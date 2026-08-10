'use client';

import Image from 'next/image';
import { Clock3, Mic, MicOff, Radio, Volume2 } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useVapi from '@/hooks/useVapi';
import type { IBook, Messages } from '@/types';
import Transcript from '@/components/Transcript';

const statusLabels = { idle: 'Ready to study', connecting: 'Connecting', starting: 'Starting session', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking' } as const;

export default function VapiControls({ book, initialMessages = [], readOnly = false }: { book: IBook; initialMessages?: Messages[]; readOnly?: boolean }) {
  const { status, isActive, messages, currentMessage, currentUserMessage, duration, start, stop, clearError, limitError } = useVapi(book, initialMessages);
  const router = useRouter();

  useEffect(() => {
    if (limitError) {
      toast.error(limitError);
      router.push('/');
      clearError();
    }
  }, [limitError, router, clearError]);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const statusLabel = statusLabels[status as keyof typeof statusLabels] ?? 'Ready to study';

  return <section className="voice-study">
    <header className="voice-study__header">
      <div className="voice-study__book-mark"><Image src={book.coverURL || '/assets/book-cover.svg'} alt="" width={76} height={114} className="voice-study__cover" /></div>
      <div className="voice-study__intro"><p className="summary-eyebrow">Voice study session</p><h2>Talk your way through the text.</h2><p>Ask questions, test your understanding, or work through a difficult idea aloud.</p></div>
      <button type="button" onClick={isActive ? stop : start} disabled={readOnly || status === 'connecting'} className={isActive ? 'voice-study__mic voice-study__mic--active' : 'voice-study__mic'} aria-label={isActive ? 'End voice session' : readOnly ? 'Saved transcripts are read only' : 'Start voice session'}>
        {isActive ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}<span>{isActive ? 'End session' : readOnly ? 'Saved session' : 'Start speaking'}</span>
      </button>
    </header>
    <div className="voice-study__details">
      <span className={`voice-study__status voice-study__status--${status}`}><i aria-hidden="true" />{statusLabel}</span>
      <span><Volume2 aria-hidden="true" />{book.persona || 'Daniel'}</span>
      <span><Clock3 aria-hidden="true" />{formattedDuration}</span>
      {isActive ? <span><Radio aria-hidden="true" />Live session</span> : null}
    </div>
    <div className="voice-study__transcript"><Transcript messages={messages} currentMessage={currentMessage} currentUserMessage={currentUserMessage} /></div>
  </section>;
}
