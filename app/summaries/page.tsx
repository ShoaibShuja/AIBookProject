import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Plus, Sparkles } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { getSummaryLibrary } from '@/lib/actions/summary.actions';

export default async function SummariesPage() {
  await requireUser();
  const books = await getSummaryLibrary();
  const readyCount = books.filter(({ summaryGeneratedAt }) => summaryGeneratedAt).length;

  return (
    <main className="wrapper container summary-library-page">
      <header className="summary-library-hero">
        <div className="summary-library-hero__texture" aria-hidden="true" />
        <div className="summary-library-hero__content">
          <p className="summary-eyebrow">Study guide shelf</p>
          <h1>Turn reading into lasting understanding.</h1>
          <p>Create a source-grounded guide when you are ready, then return to it whenever you need to review.</p>
        </div>
        <div className="summary-library-stat" aria-label={`${readyCount} study guides ready`}>
          <strong>{String(readyCount).padStart(2, '0')}</strong>
          <span>guides ready<br />to revisit</span>
        </div>
      </header>

      {books.length ? <section aria-label="Books available for summaries" className="summary-shelf">
        <div className="summary-shelf__heading">
          <div><p className="summary-eyebrow">Your collection</p><h2>Choose a book to study</h2></div>
          <p>{books.length} {books.length === 1 ? 'book' : 'books'} in your library</p>
        </div>
        <div className="summary-shelf__grid">
          {books.map(({ book, summaryGeneratedAt }) => {
            const isReady = Boolean(summaryGeneratedAt);
            return <article key={book.id} className="summary-shelf-card">
              <div className="summary-shelf-card__cover-wrap">
                <Image src={book.coverURL || '/assets/book-cover.svg'} alt="" width={112} height={164} className="summary-shelf-card__cover" />
              </div>
              <div className="summary-shelf-card__content">
                <p className={`summary-status ${isReady ? 'summary-status--ready' : 'summary-status--new'}`}>
                  {isReady ? <BookOpen aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                  {isReady ? 'Guide ready' : 'Not summarized'}
                </p>
                <h2>{book.title}</h2>
                <p className="summary-shelf-card__author">{book.author}</p>
                {summaryGeneratedAt ? <p className="summary-shelf-card__date">Updated {summaryGeneratedAt.toLocaleDateString()}</p> : <p className="summary-shelf-card__date">Create a focused study guide</p>}
                <Link href={`/books/${book.slug}/summary`} className="summary-shelf-card__action">
                  {isReady ? 'Open study guide' : 'Create study guide'}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>;
          })}
        </div>
      </section> : <section className="summary-library-empty">
        <div className="summary-library-empty__icon"><FileText aria-hidden="true" /></div>
        <p className="summary-eyebrow">Your study shelf is empty</p>
        <h2>Upload a book to make your first guide.</h2>
        <p>Once a book is in your library, you can choose exactly when to create a detailed guide.</p>
        <Link href="/books/new" className="summary-library-empty__action"><Plus aria-hidden="true" />Upload a book</Link>
      </section>}
    </main>
  );
}
