'use client';

import { useState, useTransition } from 'react';
import { BookOpen, Check, FileText, LoaderCircle, RotateCcw, Save, Sparkles } from 'lucide-react';
import type { IBook, SavedBookSummary, SummaryChapter } from '@/types';
import { generateBookSummary, saveSummaryChapters } from '@/lib/actions/summary.actions';

function GuideList({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const List = ordered ? 'ol' : 'ul';
  return <section className={`study-guide-list ${ordered ? 'study-guide-list--ordered' : ''}`}>
    <h2>{title}</h2>
    <List>{items.map((item) => <li key={item}>{item}</li>)}</List>
  </section>;
}

function Guide({ summary }: { summary: SavedBookSummary }) {
  const { guide } = summary;
  return <article className="study-guide">
    <header className="study-guide__header">
      <div><p className="summary-eyebrow">Saved study guide</p><h1>{guide.overview}</h1></div>
      <p>Generated {summary.generatedAt.toLocaleDateString()}<span aria-hidden="true">·</span>{summary.model}</p>
    </header>
    <section className="study-guide__chapters">
      <div className="study-guide__section-heading"><FileText aria-hidden="true" /><h2>Chapter notes</h2></div>
      <div>{guide.chapterSummaries.map((chapter, index) => <article key={chapter.title} className="study-guide__chapter"><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{chapter.title}</h3><p>{chapter.summary}</p></div></article>)}</div>
    </section>
    <div className="study-guide__insights"><GuideList title="Key concepts" items={guide.keyConcepts} /><GuideList title="Key takeaways" items={guide.keyTakeaways} /></div>
    <GuideList title="Review questions" items={guide.reviewQuestions} ordered />
  </article>;
}

type Status = { text: string; kind: 'success' | 'error' } | undefined;

export default function SummaryStudy({ book, initialChapters, initialSummary }: { book: IBook; initialChapters: SummaryChapter[]; initialSummary: SavedBookSummary | null }) {
  const [chapters, setChapters] = useState(initialChapters);
  const [summary, setSummary] = useState(initialSummary);
  const [status, setStatus] = useState<Status>();
  const [isPending, startTransition] = useTransition();

  const updateChapter = (index: number, key: keyof SummaryChapter, value: string) => setChapters((current) => current.map((chapter, chapterIndex) => {
    if (chapterIndex !== index) return chapter;
    const updated = { ...chapter, [key]: key === 'title' ? value : Number(value) };
    if (key === 'startSegmentIndex') updated.startPage = undefined;
    if (key === 'endSegmentIndex') updated.endPage = undefined;
    return updated;
  }));

  const saveOutline = () => startTransition(async () => {
    setStatus(undefined);
    const result = await saveSummaryChapters({ bookId: book.id, chapters });
    setStatus(result.success
      ? { kind: 'success', text: 'Chapter map saved. Regenerate the guide to use these ranges.' }
      : { kind: 'error', text: result.error ?? 'Unable to save the chapter map.' });
  });

  const generate = () => startTransition(async () => {
    setStatus(undefined);
    const result = await generateBookSummary({ bookId: book.id, chapters });
    if (result.success && result.summary) {
      setSummary(result.summary);
      setStatus({ kind: 'success', text: 'Study guide saved.' });
    } else setStatus({ kind: 'error', text: result.error ?? 'Unable to generate the study guide.' });
  });

  return <div className="summary-workspace">
    <header className="summary-workspace__hero">
      <div>
        <p className="summary-eyebrow">Reading desk</p>
        <h1>Study guide for <em>{book.title}</em></h1>
        <p>Shape the chapter map, then build a source-grounded guide from the text you uploaded.</p>
      </div>
      <button type="button" onClick={generate} disabled={isPending} className="summary-generate-button">
        {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
        {isPending ? 'Building guide…' : summary ? 'Regenerate guide' : 'Generate guide'}
      </button>
    </header>

    {status ? <p role="status" className={`summary-workspace__status summary-workspace__status--${status.kind}`}>
      {status.kind === 'success' ? <Check aria-hidden="true" /> : null}{status.text}
    </p> : null}

    <div className="summary-workspace__grid">
      <aside className="chapter-map">
        <header className="chapter-map__header"><div><p className="summary-eyebrow">Source setup</p><h2>Chapter map</h2><p>Detected from headings. Adjust the titles or selected source ranges before generating.</p></div><BookOpen aria-hidden="true" /></header>
        <div className="chapter-map__list">
          {chapters.map((chapter, index) => <fieldset key={`${chapter.startSegmentIndex}-${index}`} className="chapter-map__chapter">
            <legend className="sr-only">Chapter {index + 1}</legend>
            <p className="chapter-map__number">Chapter {String(index + 1).padStart(2, '0')}</p>
            <label htmlFor={`chapter-title-${index}`}>Title</label>
            <input id={`chapter-title-${index}`} value={chapter.title} onChange={(event) => updateChapter(index, 'title', event.target.value)} maxLength={200} />
            <p className="chapter-map__pages">PDF pages {chapter.startPage ?? '—'}–{chapter.endPage ?? '—'}</p>
            <div className="chapter-map__ranges">
              <label>Start segment<input type="number" min="0" value={chapter.startSegmentIndex} onChange={(event) => updateChapter(index, 'startSegmentIndex', event.target.value)} /></label>
              <label>End segment<input type="number" min="0" value={chapter.endSegmentIndex} onChange={(event) => updateChapter(index, 'endSegmentIndex', event.target.value)} /></label>
            </div>
          </fieldset>)}
        </div>
        <button type="button" onClick={saveOutline} disabled={isPending} className="chapter-map__save"><Save aria-hidden="true" />Save chapter map</button>
      </aside>

      {summary ? <Guide summary={summary} /> : <section className="study-guide-empty">
        <div className="study-guide-empty__icon"><Sparkles aria-hidden="true" /></div>
        <p className="summary-eyebrow">Ready when you are</p>
        <h2>Build a guide worth returning to.</h2>
        <p>Gemini will summarize each selected chapter first, then create one connected overview with concepts, takeaways, and review questions.</p>
        <button type="button" onClick={generate} disabled={isPending} className="study-guide-empty__action"><RotateCcw aria-hidden="true" />Generate study guide</button>
      </section>}
    </div>
  </div>;
}
