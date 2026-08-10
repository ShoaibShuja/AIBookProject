import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import type { IBook } from '@/types';

export default function BookWorkspaceHeader({ book }: { book: IBook }) {
  return <header className="book-workspace-header">
    <Link href="/" className="book-workspace-header__back"><ArrowLeft aria-hidden="true" />Library</Link>
    <div className="book-workspace-header__book">
      <div className="book-workspace-header__cover-wrap"><Image src={book.coverURL || '/assets/book-cover.svg'} alt="" width={68} height={100} className="book-workspace-header__cover" /></div>
      <div><p className="summary-eyebrow"><BookOpen aria-hidden="true" />Study workspace</p><h1>{book.title}</h1><p>{book.author}</p></div>
    </div>
  </header>;
}
