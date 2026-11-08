'use server';

import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ConversationMessage, ConversationSession } from '@/types';
import { z } from 'zod';

type SessionRow = { id: string; title: string | null; started_at: string; created_at: string };
type MessageRow = { id: string; role: 'user' | 'assistant'; content: string; sequence_index: number; created_at: string };

function mapSession(row: SessionRow): ConversationSession { return { id: row.id, title: row.title, startedAt: new Date(row.started_at), createdAt: new Date(row.created_at) }; }
function mapMessage(row: MessageRow): ConversationMessage { return { id: row.id, role: row.role, content: row.content, sequenceIndex: row.sequence_index, createdAt: new Date(row.created_at) }; }

export async function getVoiceConversationHistory(bookId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('voice_sessions').select('id,title,started_at,created_at').eq('book_id', bookId).order('created_at', { ascending: false });
  if (!error) return (data as SessionRow[]).map(mapSession);

  // Keep existing transcripts visible if this deployment has not yet received
  // the title-column migration.
  const legacy = await supabase.from('voice_sessions').select('id,started_at,created_at').eq('book_id', bookId).order('created_at', { ascending: false });
  return legacy.error ? [] : (legacy.data as Omit<SessionRow, 'title'>[]).map((row) => mapSession({ ...row, title: null }));
}

const sessionTitleSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().trim().min(1).max(100),
});

export async function renameVoiceConversation(input: z.infer<typeof sessionTitleSchema>) {
  await requireUser();
  const parsed = sessionTitleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Enter a title between 1 and 100 characters.' };

  const supabase = await createClient();
  const { error } = await supabase.from('voice_sessions').update({ title: parsed.data.title }).eq('id', parsed.data.sessionId);
  return error ? { success: false, error: 'Unable to rename the voice session.' } : { success: true, title: parsed.data.title };
}

export async function getVoiceConversationMessages(sessionId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('voice_session_messages').select('id,role,content,sequence_index,created_at').eq('session_id', sessionId).order('sequence_index');
  return error ? [] : (data as MessageRow[]).map(mapMessage);
}
