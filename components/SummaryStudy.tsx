'use client';

import { useState, useTransition } from 'react';
import { BookOpen, RotateCcw, Save, Sparkles } from 'lucide-react';
import type { IBook, SavedBookSummary, SummaryChapter } from '@/types';
import { generateBookSummary, saveSummaryChapters } from '@/lib/actions/summary.actions';

function Guide({ summary }: { summary: SavedBookSummary }) {
  const { guide } = summary;
  return <article className="min-w-0 space-y-7 rounded-2xl border border-[#d6c4aa] bg-[#fffdf8] p-5 shadow-sm sm:p-7">
    <header className="border-b border-[#eadcc8] pb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6242]">Saved study guide</p><h1 className="mt-2 font-serif text-3xl font-bold text-[#212a3b]">{guide.overview}</h1><p className="mt-3 text-xs text-[#806d59]">Generated {summary.generatedAt.toLocaleDateString()} with {summary.model}</p></header>
    <section><h2 className="font-serif text-xl font-bold text-[#212a3b]">Chapter notes</h2><div className="mt-3 space-y-4">{guide.chapterSummaries.map((chapter) => <div key={chapter.title} className="border-l-2 border-[#b86b45] pl-4"><h3 className="font-semibold text-[#4a3425]">{chapter.title}</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#604d3d]">{chapter.summary}</p></div>)}</div></section>
    <section className="grid gap-5 md:grid-cols-2"><GuideList title="Key concepts" items={guide.keyConcepts} /><GuideList title="Key takeaways" items={guide.keyTakeaways} /></section>
    <GuideList title="Review questions" items={guide.reviewQuestions} ordered />
  </article>;
}

function GuideList({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const List = ordered ? 'ol' : 'ul';
  return <section><h2 className="font-serif text-xl font-bold text-[#212a3b]">{title}</h2><List className={`mt-3 space-y-2 pl-5 text-sm leading-6 text-[#604d3d] ${ordered ? 'list-decimal' : 'list-disc'}`}>{items.map((item) => <li key={item}>{item}</li>)}</List></section>;
}

export default function SummaryStudy({ book, initialChapters, initialSummary }: { book: IBook; initialChapters: SummaryChapter[]; initialSummary: SavedBookSummary | null }) {
  const [chapters, setChapters] = useState(initialChapters);
  const [summary, setSummary] = useState(initialSummary);
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const updateChapter = (index: number, key: keyof SummaryChapter, value: string) => setChapters((current) => current.map((chapter, chapterIndex) => {
    if (chapterIndex !== index) return chapter;
    const updated = { ...chapter, [key]: key === 'title' ? value : Number(value) };
    if (key === 'startSegmentIndex') updated.startPage = undefined;
    if (key === 'endSegmentIndex') updated.endPage = undefined;
    return updated;
  }));
  const saveOutline = () => startTransition(async () => {
    setMessage(undefined);
    const result = await saveSummaryChapters({ bookId: book.id, chapters });
    setMessage(result.success ? 'Chapter outline saved. Regenerate the guide to use these ranges.' : result.error);
  });
  const generate = () => startTransition(async () => {
    setMessage(undefined);
    const result = await generateBookSummary({ bookId: book.id, chapters });
    if (result.success && result.summary) { setSummary(result.summary); setMessage('Study guide saved.'); } else setMessage(result.error);
  });
  return <div className="mx-auto max-w-7xl">
    <header className="mb-5 rounded-2xl border border-[#d6c4aa] bg-[#f3e4d1] px-5 py-6 sm:px-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a6242]">Reading desk</p><h1 className="mt-2 font-serif text-3xl font-bold text-[#212a3b]">Study guide for {book.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#604d3d]">Review the chapter map, then let Gemini build a source-grounded guide from the uploaded text.</p></div><button type="button" onClick={generate} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#663820] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#512c19] disabled:opacity-50"><Sparkles className="size-4" />{isPending ? 'Building guide…' : summary ? 'Regenerate guide' : 'Generate guide'}</button></div></header>
    {message ? <p role="status" className="mb-4 rounded-xl border border-[#d6c4aa] bg-[#fffaf0] px-4 py-3 text-sm text-[#604d3d]">{message}</p> : null}
    <div className="grid gap-5 lg:grid-cols-[minmax(290px,0.7fr)_minmax(0,1.5fr)]">
      <aside className="h-fit rounded-2xl border border-[#d6c4aa] bg-[#fffdf8] p-4 shadow-sm"><div className="flex items-start justify-between gap-3 border-b border-[#eadcc8] pb-4"><div><h2 className="font-serif text-xl font-bold text-[#212a3b]">Chapter map</h2><p className="mt-1 text-xs leading-5 text-[#806d59]">Detected from headings. Edit title and segment ranges before generating.</p></div><BookOpen className="mt-1 size-5 shrink-0 text-[#9a6242]" /></div><div className="mt-4 space-y-3">{chapters.map((chapter, index) => <fieldset key={`${chapter.startSegmentIndex}-${index}`} className="rounded-xl border border-[#eadcc8] bg-[#fffaf0] p-3"><legend className="sr-only">Chapter {index + 1}</legend><label className="text-xs font-semibold text-[#604d3d]" htmlFor={`chapter-title-${index}`}>Chapter {index + 1}</label><input id={`chapter-title-${index}`} value={chapter.title} onChange={(event) => updateChapter(index, 'title', event.target.value)} maxLength={200} className="mt-1 w-full rounded-lg border border-[#cdb99d] bg-white px-2 py-1.5 text-sm text-[#34271e] outline-none focus:border-[#663820]" /><p className="mt-2 text-xs text-[#806d59]">PDF pages {chapter.startPage ?? '—'}–{chapter.endPage ?? '—'}</p><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs text-[#806d59]">Start segment<input type="number" min="0" value={chapter.startSegmentIndex} onChange={(event) => updateChapter(index, 'startSegmentIndex', event.target.value)} className="mt-1 w-full rounded-lg border border-[#cdb99d] bg-white px-2 py-1.5 text-sm text-[#34271e] outline-none focus:border-[#663820]" /></label><label className="text-xs text-[#806d59]">End segment<input type="number" min="0" value={chapter.endSegmentIndex} onChange={(event) => updateChapter(index, 'endSegmentIndex', event.target.value)} className="mt-1 w-full rounded-lg border border-[#cdb99d] bg-white px-2 py-1.5 text-sm text-[#34271e] outline-none focus:border-[#663820]" /></label></div></fieldset>)}</div><button type="button" onClick={saveOutline} disabled={isPending} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#9a6242] px-3 py-2.5 text-sm font-semibold text-[#663820] hover:bg-[#f3e4d1] disabled:opacity-50"><Save className="size-4" />Save chapter map</button></aside>
      {summary ? <Guide summary={summary} /> : <section className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cdb99d] bg-[#fffdf8] px-6 text-center"><div className="rounded-full bg-[#f3e4d1] p-4"><Sparkles className="size-7 text-[#9a6242]" /></div><h2 className="mt-5 font-serif text-2xl font-bold text-[#212a3b]">Your guide is ready to be made</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#806d59]">Gemini will summarize every chapter first, then build one grounded overview with concepts, takeaways, and review questions.</p><button type="button" onClick={generate} disabled={isPending} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#663820] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><RotateCcw className="size-4" />Generate study guide</button></section>}
    </div>
  </div>;
}
