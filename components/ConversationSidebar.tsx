'use client';

import { History, Plus } from 'lucide-react';
import type { ConversationSession } from '@/types';

type Props = { sessions: ConversationSession[]; activeSessionId?: string; onSelect: (id: string) => void; onNew: () => void; label: string };

export default function ConversationSidebar({ sessions, activeSessionId, onSelect, onNew, label }: Props) {
  const title = label === 'chat' ? 'New chat' : 'New voice session';
  return <aside className="conversation-sidebar">
    <button type="button" onClick={onNew} className="conversation-sidebar__new"><Plus aria-hidden="true" />{title}</button>
    <div className="conversation-sidebar__heading"><History aria-hidden="true" /><span>Previous {label === 'chat' ? 'chats' : 'sessions'}</span></div>
    <div className="conversation-sidebar__list">
      {sessions.length === 0 ? <p className="conversation-sidebar__empty">Saved {label === 'chat' ? 'chats' : 'transcripts'} will appear here.</p> : sessions.map((session) => <button key={session.id} type="button" onClick={() => onSelect(session.id)} className={activeSessionId === session.id ? 'conversation-sidebar__session conversation-sidebar__session--active' : 'conversation-sidebar__session'}>
        <span>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(session.startedAt)}</span><small>{new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(session.startedAt)}</small>
      </button>)}
    </div>
  </aside>;
}
