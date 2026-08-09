'use client';

import type { ConversationSession } from '@/types';

type Props = { sessions: ConversationSession[]; activeSessionId?: string; onSelect: (id: string) => void; onNew: () => void; label: string };

export default function ConversationSidebar({ sessions, activeSessionId, onSelect, onNew, label }: Props) {
  return <aside className="w-full md:w-56 shrink-0 border border-[#d6c4aa] bg-[#fffaf0] p-3 rounded-xl">
    <button type="button" onClick={onNew} className="w-full rounded-lg bg-[#663820] px-3 py-2 text-sm font-semibold text-white hover:bg-[#512b19]">New {label}</button>
    <p className="mt-4 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#806d59]">Previous {label}s</p>
    <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
      {sessions.length === 0 ? <p className="px-1 py-2 text-sm text-[#806d59]">No saved conversations.</p> : sessions.map((session) => <button key={session.id} type="button" onClick={() => onSelect(session.id)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${session.id === activeSessionId ? 'bg-[#f0dfc4] text-[#3c2214]' : 'text-[#594433] hover:bg-[#f6ead8]'}`}>
        {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(session.startedAt)}
      </button>)}
    </div>
  </aside>;
}
