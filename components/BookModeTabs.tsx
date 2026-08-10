import Link from 'next/link';
import { FileText, MessageCircle, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

const modes = [
  { id: 'voice', label: 'Voice', icon: Mic, href: (slug: string) => `/books/${slug}` },
  { id: 'chat', label: 'Chat', icon: MessageCircle, href: (slug: string) => `/books/${slug}/chat` },
  { id: 'summary', label: 'Study guide', icon: FileText, href: (slug: string) => `/books/${slug}/summary` },
] as const;

export default function BookModeTabs({ slug, active }: { slug: string; active: 'voice' | 'chat' | 'summary' }) {
  return <nav aria-label="Study mode" className="book-mode-tabs">
    {modes.map(({ id, label, icon: Icon, href }) => <Link key={id} href={href(slug)} aria-current={active === id ? 'page' : undefined} className={cn('book-mode-tabs__link', active === id && 'book-mode-tabs__link--active')}><Icon aria-hidden="true" />{label}</Link>)}
  </nav>;
}
