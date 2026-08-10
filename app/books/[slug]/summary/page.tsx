import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { getBookBySlug } from '@/lib/actions/book.actions';
import { getSummaryWorkspace } from '@/lib/actions/summary.actions';
import BookModeTabs from '@/components/BookModeTabs';
import SummaryStudy from '@/components/SummaryStudy';

export default async function SummaryPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const result = await getBookBySlug(slug);
  if (!result.success || !result.data) redirect('/');
  const book = result.data;
  const { chapters, summary } = await getSummaryWorkspace(book.id);
  return <div className="book-page-container">
    <Link href="/" className="back-btn-floating"><ArrowLeft className="size-6 text-[#212a3b]" /></Link>
    <BookModeTabs slug={book.slug} active="summary" />
    <SummaryStudy book={book} initialChapters={chapters} initialSummary={summary} />
  </div>;
}
