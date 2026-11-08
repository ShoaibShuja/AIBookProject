import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Plus, Sparkles } from 'lucide-react';
import type { IBook } from '@/types';

type HeroSectionProps = {
  bookCount: number;
  featuredBook?: IBook;
  isSearchResult?: boolean;
};

export default function HeroSection({ bookCount, featuredBook, isSearchResult = false }: HeroSectionProps) {
  const hasBooks = bookCount > 0;

  return (
    <section className="dashboard-hero" aria-labelledby="dashboard-title">
      <div className="dashboard-hero__texture" aria-hidden="true" />
      <div className="dashboard-hero__content">
        <p className="dashboard-kicker">Personal library</p>
        <h1 id="dashboard-title">A quieter place to think with books.</h1>
        <p className="dashboard-hero__description">
          {isSearchResult
            ? `We found ${bookCount} ${bookCount === 1 ? 'book' : 'books'} matching your search.`
            : hasBooks
            ? `Your library holds ${bookCount} ${bookCount === 1 ? 'book' : 'books'}, ready for a closer read.`
            : 'Start a private library where every book can become a richer study experience.'}
        </p>
        <div className="dashboard-hero__actions">
          <Link href="/books/new" className="dashboard-primary-action">
            <Plus aria-hidden="true" />
            Upload a book
          </Link>
          {featuredBook ? <Link href={`/books/${featuredBook.slug}`} className="dashboard-secondary-action" aria-label={`Continue reading ${featuredBook.title}`}>
            Continue reading
            <ArrowRight aria-hidden="true" />
          </Link> : null}
        </div>
      </div>

      <div className="dashboard-hero__aside">
        <div className="dashboard-index-card">
          <div className="dashboard-index-card__heading">
            <span className="dashboard-index-card__number">{String(bookCount).padStart(2, '0')}</span>
            <span>{isSearchResult ? 'Matching books' : 'Books in your library'}</span>
          </div>
          <div className="dashboard-index-card__rule" />
          {featuredBook ? <Link href={`/books/${featuredBook.slug}`} className="dashboard-featured-book">
            <Image src={featuredBook.coverURL || '/assets/book-cover.svg'} alt="" width={46} height={68} className="dashboard-featured-book__cover" unoptimized={Boolean(featuredBook.coverURL)} />
            <span>
              <small>Most recently added</small>
              <strong>{featuredBook.title}</strong>
              <em>{featuredBook.author}</em>
            </span>
            <ArrowRight aria-hidden="true" />
          </Link> : <div className="dashboard-empty-index">
            <div><BookOpen aria-hidden="true" /></div>
            <span>{isSearchResult ? 'Try another title or author.' : 'Your first book will appear here.'}</span>
          </div>}
        </div>
        <div className="dashboard-hero__illustration-frame" aria-hidden="true">
          <span className="dashboard-hero__illustration-label">Reading room</span>
          <Image src="/assets/hero-illustration.png" alt="" width={330} height={330} priority className="dashboard-hero__illustration" />
          <Sparkles className="dashboard-hero__sparkle" />
        </div>
      </div>
    </section>
  );
}
