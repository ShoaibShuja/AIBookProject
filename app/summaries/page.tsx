import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, FileText, Sparkles } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { getSummaryLibrary } from '@/lib/actions/summary.actions';

export default async function SummariesPage() {
  await requireUser();
  const books = await getSummaryLibrary();
  return <main className="wrapper container">
    <header className="mb-10 rounded-2xl border border-[#d6c4aa] bg-[#f3e4d1] px-6 py-8 sm:px-9"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6242]">Study guide shelf</p><h1 className="mt-2 font-serif text-4xl font-bold text-[#212a3b]">Choose what to summarize</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#604d3d]">Every book stays in your library. Create a Gemini study guide only when you are ready, or reopen one you have already made.</p></header>
    {books.length ? <section aria-label="Books available for summaries" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{books.map(({ book, summaryGeneratedAt }) => <article key={book.id} className="group flex min-h-48 gap-4 rounded-2xl border border-[#d6c4aa] bg-[#fffdf8] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><Image src={book.coverURL || '/assets/book-cover.svg'} alt="" width={74} height={112} className="h-28 w-[74px] rounded-md object-cover shadow-sm" /><div className="flex min-w-0 flex-1 flex-col"><div><p className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${summaryGeneratedAt ? 'bg-[#e3f1df] text-[#31582d]' : 'bg-[#f3e4d1] text-[#7c4f34]'}`}>{summaryGeneratedAt ? 'Study guide ready' : 'Not summarized'}</p><h2 className="mt-3 truncate font-serif text-lg font-bold text-[#212a3b]">{book.title}</h2><p className="mt-1 truncate text-sm text-[#806d59]">{book.author}</p></div><Link href={`/books/${book.slug}/summary`} className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-[#663820] hover:text-[#9a6242]">{summaryGeneratedAt ? <><BookOpen className="size-4" />Open guide</> : <><Sparkles className="size-4" />Create guide</>}</Link></div></article>)}</section> : <section className="rounded-2xl border border-dashed border-[#cdb99d] bg-[#fffdf8] px-6 py-16 text-center"><FileText className="mx-auto size-8 text-[#9a6242]" /><h2 className="mt-4 font-serif text-2xl font-bold text-[#212a3b]">No books to summarize yet</h2><p className="mt-2 text-sm text-[#806d59]">Upload a book first, then choose it here when you want a study guide.</p><Link href="/books/new" className="mt-5 inline-flex rounded-xl bg-[#663820] px-4 py-3 text-sm font-semibold text-white">Upload a book</Link></section>}
  </main>;
}
