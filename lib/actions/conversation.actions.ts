'use server';

import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateBookReply } from '@/lib/gemini';
import type { ConversationMessage, ConversationSession } from '@/types';

const messageInputSchema = z.object({ bookId: z.string().uuid(), sessionId: z.string().uuid().optional(), content: z.string().trim().min(1).max(4000) });

type SessionRow = { id: string; started_at: string; created_at: string };
type MessageRow = { id: string; role: 'user' | 'assistant'; content: string; sequence_index: number; created_at: string };

function mapSession(row: SessionRow): ConversationSession { return { id: row.id, startedAt: new Date(row.started_at), createdAt: new Date(row.created_at) }; }
function mapMessage(row: MessageRow): ConversationMessage { return { id: row.id, role: row.role, content: row.content, sequenceIndex: row.sequence_index, createdAt: new Date(row.created_at) }; }

export async function getVoiceConversationHistory(bookId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('voice_sessions').select('id,started_at,created_at').eq('book_id', bookId).order('created_at', { ascending: false });
  return error ? [] : (data as SessionRow[]).map(mapSession);
}

export async function getVoiceConversationMessages(sessionId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('voice_session_messages').select('id,role,content,sequence_index,created_at').eq('session_id', sessionId).order('sequence_index');
  return error ? [] : (data as MessageRow[]).map(mapMessage);
}

export async function getChatConversationHistory(bookId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('chat_sessions').select('id,started_at,created_at').eq('book_id', bookId).order('created_at', { ascending: false });
  return error ? [] : (data as SessionRow[]).map(mapSession);
}

export async function getChatConversationMessages(sessionId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('chat_messages').select('id,role,content,sequence_index,created_at').eq('session_id', sessionId).order('sequence_index');
  return error ? [] : (data as MessageRow[]).map(mapMessage);
}

async function getGrounding(bookId: string, query: string) {
  const admin = createAdminClient();
  const { data } = await admin.rpc('search_book_segments', { p_book_id: bookId, p_query: query, p_limit: 3 });
  return ((data ?? []) as { content: string }[]).map((row) => row.content).join('\n\n---\n\n');
}

export async function sendChatMessage(input: z.infer<typeof messageInputSchema>) {
  const user = await requireUser();
  const parsed = messageInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Enter a message between 1 and 4,000 characters.' };
  const { bookId, content } = parsed.data;
  const supabase = await createClient();
  const { data: book } = await supabase.from('books').select('id').eq('id', bookId).maybeSingle();
  if (!book) return { success: false, error: 'Book not found.' };

  let sessionId = parsed.data.sessionId;
  if (sessionId) {
    const { data: session } = await supabase.from('chat_sessions').select('id').eq('id', sessionId).eq('book_id', bookId).maybeSingle();
    if (!session) return { success: false, error: 'Chat session not found.' };
  } else {
    const { data: session, error } = await supabase.from('chat_sessions').insert({ user_id: user.id, book_id: bookId }).select('id').single();
    if (error || !session) return { success: false, error: 'Could not start a chat.' };
    sessionId = session.id;
  }

  const { data: existing } = await supabase.from('chat_messages').select('id,role,content,sequence_index,created_at').eq('session_id', sessionId).order('sequence_index');
  const history = ((existing ?? []) as MessageRow[]).map(mapMessage);
  const userIndex = history.length;
  const { error: userError } = await supabase.from('chat_messages').insert({ session_id: sessionId, role: 'user', content, sequence_index: userIndex });
  if (userError) return { success: false, error: 'Could not save your message.' };

  try {
    const reply = await generateBookReply({ question: content, history, grounding: await getGrounding(bookId, content), safetyIdentifier: user.id });
    const { data: assistant, error: assistantError } = await supabase.from('chat_messages').insert({ session_id: sessionId, role: 'assistant', content: reply, sequence_index: userIndex + 1 }).select('id,role,content,sequence_index,created_at').single();
    if (assistantError || !assistant) throw new Error('Could not save the assistant response.');
    return { success: true, sessionId, message: mapMessage(assistant as MessageRow) };
  } catch (error) {
    return { success: false, sessionId, error: error instanceof Error ? error.message : 'The chat assistant could not respond.' };
  }
}
