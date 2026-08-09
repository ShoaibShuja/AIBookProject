'use server';

import type { EndSessionResult, StartSessionResult } from '@/types';
import { FREE_PLAN_LIMITS } from '@/lib/limits';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function startVoiceSession(bookId: string): Promise<StartSessionResult> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('start_voice_session', { p_book_id: bookId });

  if (error) {
    const message = error.message.includes('SESSION_LIMIT_REACHED')
      ? `You have reached the monthly free-plan limit of ${FREE_PLAN_LIMITS.maxSessionsPerMonth} sessions.`
      : 'Failed to start voice session. Please try again later.';
    return { success: false, error: message };
  }

  const session = (data as { session_id: string; max_duration_minutes: number }[] | null)?.[0];
  if (!session) return { success: false, error: 'Failed to start voice session. Please try again later.' };
  return { success: true, sessionId: session.session_id, maxDurationMinutes: session.max_duration_minutes };
}

export async function endVoiceSession(sessionId: string, durationSeconds: number): Promise<EndSessionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc('end_voice_session', {
    p_session_id: sessionId,
    p_duration_seconds: Math.max(0, Math.floor(durationSeconds)),
  });
  return error ? { success: false, error: 'Failed to end voice session.' } : { success: true };
}
