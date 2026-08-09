'use client';

import { FormEvent, useState, useTransition } from 'react';
import type { ConversationMessage, ConversationSession, IBook } from '@/types';
import { getChatConversationMessages, sendChatMessage } from '@/lib/actions/conversation.actions';
import ConversationSidebar from '@/components/ConversationSidebar';

export default function ChatStudy({ book, sessions }: { book: IBook; sessions: ConversationSession[] }) {
  const [activeId, setActiveId] = useState<string>();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const selectSession = (id: string) => startTransition(async () => { setMessages(await getChatConversationMessages(id)); setActiveId(id); setError(undefined); });
  const newChat = () => { setActiveId(undefined); setMessages([]); setInput(''); setError(undefined); };
  const send = (event: FormEvent) => { event.preventDefault(); const content = input.trim(); if (!content || isPending) return; setInput(''); setError(undefined); startTransition(async () => {
    const optimistic: ConversationMessage = { id: `pending-${Date.now()}`, role: 'user', content, sequenceIndex: messages.length, createdAt: new Date() };
    setMessages((current) => [...current, optimistic]);
    const result = await sendChatMessage({ bookId: book.id, sessionId: activeId, content });
    if (!result.success || !result.message || !result.sessionId) { setMessages((current) => current.filter((message) => message.id !== optimistic.id)); setError(result.error ?? 'The chat assistant could not respond.'); return; }
    setActiveId(result.sessionId);
    setMessages((current) => [...current.filter((message) => message.id !== optimistic.id), optimistic, result.message]);
  }); };
  return <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row">
    <ConversationSidebar sessions={sessions} activeSessionId={activeId} onSelect={selectSession} onNew={newChat} label="chat" />
    <section className="flex min-h-[560px] min-w-0 flex-1 flex-col rounded-2xl border border-[#d6c4aa] bg-[#fffdf8] shadow-sm">
      <header className="border-b border-[#eadcc8] px-5 py-4"><h1 className="font-serif text-2xl font-bold text-[#212a3b]">Chat with {book.title}</h1><p className="mt-1 text-sm text-[#6d5946]">Ask about the book. Answers use its stored passages.</p></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">{messages.length === 0 ? <p className="pt-16 text-center text-[#806d59]">Start a text conversation about this book.</p> : messages.map((message) => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-[#663820] text-white' : 'bg-[#f0e4d1] text-[#34271e]'}`}>{message.content}</p></div>)}</div>
      <form onSubmit={send} className="border-t border-[#eadcc8] p-4"><label htmlFor="chat-message" className="sr-only">Message</label><div className="flex gap-2"><textarea id="chat-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} rows={2} placeholder="Ask a question about this book…" className="min-w-0 flex-1 resize-none rounded-xl border border-[#cdb99d] bg-white px-3 py-2 text-sm outline-none focus:border-[#663820]" /><button disabled={isPending || !input.trim()} className="rounded-xl bg-[#663820] px-4 text-sm font-semibold text-white disabled:opacity-50">{isPending ? 'Thinking…' : 'Send'}</button></div>{error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}</form>
    </section>
  </div>;
}
