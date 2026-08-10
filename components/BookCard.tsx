import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { BookCardProps } from '@/types';

export default function BookCard({ title, author, coverURL, slug }: BookCardProps) {
  return (
    <Link href={`/books/${slug}`} className="book-card group" aria-label={`Open ${title} by ${author}`}>
      <article>
        <figure className="book-card-figure">
          <div className="book-card-cover-wrapper">
            <div className="book-card-cover-backdrop" aria-hidden="true" />
            <Image src={coverURL || '/assets/book-cover.svg'} alt="" width={180} height={270} sizes="(max-width: 640px) 44vw, (max-width: 1024px) 28vw, 19vw" className="book-card-cover" />
            <span className="book-card-open"><span>Open book</span><ArrowUpRight aria-hidden="true" /></span>
          </div>
          <figcaption className="book-card-meta">
            <h3 className="book-card-title">{title}</h3>
            <p className="book-card-author">{author}</p>
          </figcaption>
        </figure>
      </article>
    </Link>
  );
}
