import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { getBookBySlug } from '@/lib/actions/book.actions';
import { getChatConversationHistory } from '@/lib/actions/conversation.actions';
import BookModeTabs from '@/components/BookModeTabs';
import ChatStudy from '@/components/ChatStudy';

export default async function ChatPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const result = await getBookBySlug(slug);
  if (!result.success || !result.data) redirect('/');
  const book = result.data;
  const sessions = await getChatConversationHistory(book.id);
  return <div className="book-page-container">
    <Link href="/" className="back-btn-floating"><ArrowLeft className="size-6 text-[#212a3b]" /></Link>
    <BookModeTabs slug={book.slug} active="chat" />
    <ChatStudy book={book} sessions={sessions} />
  </div>;
}
