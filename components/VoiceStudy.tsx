'use client';

import { useState, useTransition } from 'react';
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
  return <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row">
    <ConversationSidebar sessions={sessions} activeSessionId={activeId} onSelect={selectSession} onNew={newConversation} label="voice conversation" />
    <div className="min-w-0 flex-1">{isPending ? <p className="mb-2 text-sm text-[#806d59]">Loading conversation…</p> : null}{activeId ? <p className="mb-2 text-sm text-[#806d59]">Saved transcript. Select New voice conversation to start a call.</p> : null}<VapiControls key={activeId ?? 'new'} book={book} initialMessages={messages} readOnly={Boolean(activeId)} /></div>
  </div>;
}
