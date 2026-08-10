'use client';

import { useState, useTransition } from 'react';
import { FileText } from 'lucide-react';
import type { ConversationMessage, ConversationSession, IBook, Messages } from '@/types';
import { getVoiceConversationMessages } from '@/lib/actions/conversation.actions';
import ConversationSidebar from '@/components/ConversationSidebar';
import VapiControls from '@/components/VapiControls';

export default function VoiceStudy({ book, sessions }: { book: IBook; sessions: ConversationSession[] }) {
  const [activeId, setActiveId] = useState<string>();
  const [messages, setMessages] = useState<Messages[]>([]);
  const [isPending, startTransition] = useTransition();
  const selectSession = (id: string) => startTransition(async () => {
    const saved = await getVoiceConversationMessages(id);
    setMessages(saved.map((message: ConversationMessage) => ({ role: message.role, content: message.content })));
    setActiveId(id);
  });
  const newConversation = () => { setActiveId(undefined); setMessages([]); };

  return <section className="book-study-layout">
    <ConversationSidebar sessions={sessions} activeSessionId={activeId} onSelect={selectSession} onNew={newConversation} label="voice conversation" />
    <div className="book-study-layout__main">
      {isPending ? <p className="book-study-notice"><FileText aria-hidden="true" />Loading saved transcript…</p> : null}
      {activeId ? <p className="book-study-notice"><FileText aria-hidden="true" />Saved transcript. Start a new voice session to continue studying.</p> : null}
      <VapiControls key={activeId ?? 'new'} book={book} initialMessages={messages} readOnly={Boolean(activeId)} />
    </div>
  </section>;
}
