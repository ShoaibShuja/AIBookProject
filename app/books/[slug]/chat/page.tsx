import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getBookBySlug } from '@/lib/actions/book.actions';
import { getChatConversationHistory } from '@/lib/actions/conversation.actions';
import BookModeTabs from '@/components/BookModeTabs';
import ChatStudy from '@/components/ChatStudy';
import BookWorkspaceHeader from '@/components/BookWorkspaceHeader';

export default async function ChatPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const result = await getBookBySlug(slug);
  if (!result.success || !result.data) redirect('/');
  const book = result.data;
  const sessions = await getChatConversationHistory(book.id);
  return <div className="book-page-container">
    <BookWorkspaceHeader book={book} />
    <BookModeTabs slug={book.slug} active="chat" />
    <ChatStudy book={book} sessions={sessions} />
  </div>;
}
