import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getBookBySlug } from "@/lib/actions/book.actions";
import { requireUser } from '@/lib/auth';
import { getVoiceConversationHistory } from '@/lib/actions/conversation.actions';
import VoiceStudy from '@/components/VoiceStudy';
import BookModeTabs from '@/components/BookModeTabs';

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
      <Link href="/" className="back-btn-floating">
        <ArrowLeft className="size-6 text-[#212a3b]" />
      </Link>

      <BookModeTabs slug={book.slug} active="voice" />
      <VoiceStudy book={book} sessions={sessions} />
    </div>
  );
}
