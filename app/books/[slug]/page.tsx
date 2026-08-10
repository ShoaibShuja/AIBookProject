import { redirect } from "next/navigation";
import { getBookBySlug } from "@/lib/actions/book.actions";
import { requireUser } from '@/lib/auth';
import { getVoiceConversationHistory } from '@/lib/actions/conversation.actions';
import VoiceStudy from '@/components/VoiceStudy';
import BookModeTabs from '@/components/BookModeTabs';
import BookWorkspaceHeader from '@/components/BookWorkspaceHeader';

export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireUser();

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) {
    redirect("/");
  }

  const book = result.data;
  const sessions = await getVoiceConversationHistory(book.id);

  return (
    <div className="book-page-container">
      <BookWorkspaceHeader book={book} />
      <BookModeTabs slug={book.slug} active="voice" />
      <VoiceStudy book={book} sessions={sessions} />
    </div>
  );
}
