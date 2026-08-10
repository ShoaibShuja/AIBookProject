'use client';

import { useEffect, useRef } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import type { Messages } from '@/types';

interface TranscriptProps { messages: Messages[]; currentMessage: string; currentUserMessage: string; }

export default function Transcript({ messages, currentMessage, currentUserMessage }: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, currentMessage, currentUserMessage]);
  const isEmpty = messages.length === 0 && !currentMessage && !currentUserMessage;

  if (isEmpty) return <div className="voice-transcript-empty"><div><Mic aria-hidden="true" /></div><p className="summary-eyebrow">A space to think aloud</p><h3>No study conversation yet.</h3><p>Start the session when you are ready to discuss the book.</p></div>;

  return <div ref={scrollRef} className="voice-transcript" aria-live="polite">
    {messages.map((message, index) => <div key={index} className={`voice-transcript__message voice-transcript__message--${message.role}`}><span>{message.role === 'user' ? 'You' : 'KitabHoshmand'}</span><p>{message.content}</p></div>)}
    {currentUserMessage ? <div className="voice-transcript__message voice-transcript__message--user"><span>You</span><p>{currentUserMessage}<i className="voice-transcript__cursor" /></p></div> : null}
    {currentMessage ? <div className="voice-transcript__message voice-transcript__message--assistant"><span><Sparkles aria-hidden="true" />KitabHoshmand</span><p>{currentMessage}<i className="voice-transcript__cursor" /></p></div> : null}
  </div>;
}
