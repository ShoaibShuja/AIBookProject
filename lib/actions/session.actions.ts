'use server';

import type { EndSessionResult, StartSessionResult } from '@/types';
import { z } from 'zod';
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

const messageSchema = z.object({
  sessionId: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(12000),
  sequenceIndex: z.number().int().nonnegative(),
});

export async function appendVoiceMessage(input: z.infer<typeof messageSchema>) {
  await requireUser();
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid transcript message.' };
  const supabase = await createClient();
  const { error } = await supabase.from('voice_session_messages').insert({
    session_id: parsed.data.sessionId,
    role: parsed.data.role,
    content: parsed.data.content,
    sequence_index: parsed.data.sequenceIndex,
  });
  if (error?.code === '23505') return { success: true, duplicate: true };
  return error ? { success: false, error: 'Failed to save transcript message.' } : { success: true };
}
