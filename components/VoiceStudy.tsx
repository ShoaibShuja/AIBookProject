'use client';

import { useState, useTransition } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { ConversationMessage, ConversationSession, IBook, Messages } from '@/types';
import { getVoiceConversationMessages, renameVoiceConversation } from '@/lib/actions/conversation.actions';
import ConversationSidebar from '@/components/ConversationSidebar';
import VapiControls from '@/components/VapiControls';

export default function VoiceStudy({ book, sessions }: { book: IBook; sessions: ConversationSession[] }) {
  const [savedSessions, setSavedSessions] = useState(sessions);
  const [activeId, setActiveId] = useState<string>();
  const [messages, setMessages] = useState<Messages[]>([]);
  const [isPending, startTransition] = useTransition();
  const selectSession = (id: string) => startTransition(async () => {
    const saved = await getVoiceConversationMessages(id);
    setMessages(saved.map((message: ConversationMessage) => ({ role: message.role, content: message.content })));
    setActiveId(id);
  });
  const newConversation = () => { setActiveId(undefined); setMessages([]); };
  const renameSession = async (id: string, title: string) => {
    const result = await renameVoiceConversation({ sessionId: id, title });
    if (!result.success || !result.title) {
      toast.error(result.error || 'Unable to rename the voice session.');
      return false;
    }
    setSavedSessions((current) => current.map((session) => session.id === id ? { ...session, title: result.title } : session));
    toast.success('Voice session renamed.');
    return true;
  };

  return <section className="book-study-layout">
    <ConversationSidebar sessions={savedSessions} activeSessionId={activeId} onSelect={selectSession} onNew={newConversation} onRename={renameSession} label="voice conversation" />
    <div className="book-study-layout__main">
      {isPending ? <p className="book-study-notice"><FileText aria-hidden="true" />Loading saved transcript…</p> : null}
      {activeId ? <p className="book-study-notice"><FileText aria-hidden="true" />Saved transcript. Start a new voice session to continue studying.</p> : null}
      <VapiControls key={activeId ?? 'new'} book={book} initialMessages={messages} readOnly={Boolean(activeId)} />
    </div>
  </section>;
}
