'use client';

import type { FormEvent } from 'react';
import { useState, useTransition } from 'react';
import { ArrowUp, Bot, FileText, LoaderCircle, Sparkles } from 'lucide-react';
import type { ConversationMessage, ConversationSession, IBook } from '@/types';
import { getChatConversationMessages, sendChatMessage } from '@/lib/actions/conversation.actions';
import ConversationSidebar from '@/components/ConversationSidebar';

export default function ChatStudy({ book, sessions }: { book: IBook; sessions: ConversationSession[] }) {
  const [sessionList, setSessionList] = useState(sessions);
  const [activeId, setActiveId] = useState<string>();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const selectSession = (id: string) => startTransition(async () => { setMessages(await getChatConversationMessages(id)); setActiveId(id); setError(undefined); });
  const newChat = () => { setActiveId(undefined); setMessages([]); setInput(''); setError(undefined); };
  const send = (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || isPending) return;
    setInput('');
    setError(undefined);
    startTransition(async () => {
      const optimistic: ConversationMessage = { id: `pending-${Date.now()}`, role: 'user', content, sequenceIndex: messages.length, createdAt: new Date() };
      setMessages((current) => [...current, optimistic]);
      const result = await sendChatMessage({ bookId: book.id, sessionId: activeId, content });
      if (!result.success || !result.message || !result.sessionId) {
        if (result.sessionId && !activeId) {
          setActiveId(result.sessionId);
          setSessionList((current) => [{ id: result.sessionId!, startedAt: new Date(), createdAt: new Date() }, ...current]);
        }
        setError(result.error ?? 'The chat assistant could not respond.');
        return;
      }
      if (!activeId) setSessionList((current) => [{ id: result.sessionId!, startedAt: new Date(), createdAt: new Date() }, ...current]);
      setActiveId(result.sessionId);
      setMessages((current) => [...current.filter((message) => message.id !== optimistic.id), optimistic, result.message]);
    });
  };

  return <section className="book-study-layout">
    <ConversationSidebar sessions={sessionList} activeSessionId={activeId} onSelect={selectSession} onNew={newChat} label="chat" />
    <section className="chat-study">
      <header className="chat-study__header"><div><p className="summary-eyebrow">Source-grounded conversation</p><h2>Ask about the book</h2><p>Answers are built from the passages stored in your private library.</p></div><Bot aria-hidden="true" /></header>
      <div className="chat-study__messages" aria-live="polite">
        {messages.length === 0 ? <div className="chat-study__empty"><div><Sparkles aria-hidden="true" /></div><h3>Begin with a question.</h3><p>Ask for an explanation, a comparison, or help reviewing an idea from this book.</p></div> : messages.map((message) => <div key={message.id} className={`chat-message chat-message--${message.role}`}><span>{message.role === 'user' ? 'You' : 'KitabHoshmand'}</span><p>{message.content}</p></div>)}
      </div>
      <form onSubmit={send} className="chat-study__composer">
        <label htmlFor="chat-message" className="sr-only">Message</label>
        <textarea id="chat-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} rows={2} placeholder="Ask a question about this book…" />
        <div><p>{isPending ? <><LoaderCircle className="animate-spin" aria-hidden="true" />Thinking through the book…</> : <><FileText aria-hidden="true" />Grounded in your uploaded passages</>}</p><button disabled={isPending || !input.trim()} aria-label="Send message">{isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}</button></div>
        {error ? <p role="alert" className="chat-study__error">{error}</p> : null}
      </form>
    </section>
  </section>;
}
