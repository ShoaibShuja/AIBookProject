'use client';

import { Check, History, Pencil, Plus, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import type { ConversationSession } from '@/types';

type Props = { sessions: ConversationSession[]; activeSessionId?: string; onSelect: (id: string) => void; onNew: () => void; onRename?: (id: string, title: string) => Promise<boolean>; label: string };

export default function ConversationSidebar({ sessions, activeSessionId, onSelect, onNew, onRename, label }: Props) {
  const [editingId, setEditingId] = useState<string>();
  const [draftTitle, setDraftTitle] = useState('');
  const title = label === 'chat' ? 'New chat' : 'New voice session';
  const startEditing = (session: ConversationSession) => {
    setEditingId(session.id);
    setDraftTitle(session.title || '');
  };
  const saveTitle = async (event: FormEvent, sessionId: string) => {
    event.preventDefault();
    const title = draftTitle.trim();
    if (!title || !onRename) return;
    if (await onRename(sessionId, title)) setEditingId(undefined);
  };
  return <aside className="conversation-sidebar">
    <button type="button" onClick={onNew} className="conversation-sidebar__new"><Plus aria-hidden="true" />{title}</button>
    <div className="conversation-sidebar__heading"><History aria-hidden="true" /><span>Previous {label === 'chat' ? 'chats' : 'sessions'}</span></div>
    <div className="conversation-sidebar__list">
      {sessions.length === 0 ? <p className="conversation-sidebar__empty">Saved {label === 'chat' ? 'chats' : 'transcripts'} will appear here.</p> : sessions.map((session) => <div key={session.id} className={activeSessionId === session.id ? 'conversation-sidebar__session conversation-sidebar__session--active' : 'conversation-sidebar__session'}>
        {editingId === session.id ? <form className="conversation-sidebar__rename" onSubmit={(event) => saveTitle(event, session.id)}>
          <input autoFocus value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} maxLength={100} aria-label="Voice session name" />
          <button type="submit" aria-label="Save session name"><Check aria-hidden="true" /></button>
          <button type="button" onClick={() => setEditingId(undefined)} aria-label="Cancel renaming"><X aria-hidden="true" /></button>
        </form> : <>
          <button type="button" onClick={() => onSelect(session.id)} className="conversation-sidebar__session-select">
            <span>{session.title || new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(session.startedAt)}</span><small>{new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(session.startedAt)}</small>
          </button>
          {onRename ? <button type="button" className="conversation-sidebar__edit" onClick={() => startEditing(session)} aria-label={`Rename ${session.title || 'voice session'}`}><Pencil aria-hidden="true" /></button> : null}
        </>}
      </div>)}
    </div>
  </aside>;
}
