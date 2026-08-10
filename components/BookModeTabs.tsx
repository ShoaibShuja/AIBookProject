import Link from 'next/link';

export default function BookModeTabs({ slug, active }: { slug: string; active: 'voice' | 'chat' | 'summary' }) {
  const base = 'rounded-full px-4 py-2 text-sm font-semibold transition-colors';
  return <nav aria-label="Conversation mode" className="mx-auto mb-5 flex w-fit gap-1 rounded-full border border-[#d6c4aa] bg-[#fffaf0] p-1">
    <Link href={`/books/${slug}`} className={`${base} ${active === 'voice' ? 'bg-[#663820] text-white' : 'text-[#5b4635] hover:bg-[#f0dfc4]'}`}>Voice</Link>
    <Link href={`/books/${slug}/chat`} className={`${base} ${active === 'chat' ? 'bg-[#663820] text-white' : 'text-[#5b4635] hover:bg-[#f0dfc4]'}`}>Chat</Link>
    <Link href={`/books/${slug}/summary`} className={`${base} ${active === 'summary' ? 'bg-[#663820] text-white' : 'text-[#5b4635] hover:bg-[#f0dfc4]'}`}>Summary</Link>
  </nav>;
}
