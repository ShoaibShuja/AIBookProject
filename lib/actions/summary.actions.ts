'use server';

import { z } from 'zod';
import type { BookStudyGuide, SavedBookSummary, SummaryChapter } from '@/types';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { generateGeminiText } from '@/lib/gemini';
import { buildChapterSummaryPrompt, buildStudyGuidePrompt, detectSummaryChapters, type SummarySegment } from '@/lib/summary';

type SegmentRow = SummarySegment;
type ChapterRow = { id: string; title: string; start_segment_index: number; end_segment_index: number };
type SummaryRow = { guide: unknown; model: string; generated_at: string };

const chapterSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  startSegmentIndex: z.number().int().nonnegative(),
  endSegmentIndex: z.number().int().nonnegative(),
}).refine((chapter) => chapter.endSegmentIndex >= chapter.startSegmentIndex, 'Chapter end must follow its start.');

const guideSchema = z.object({
  overview: z.string().trim().min(1).max(12000),
  keyConcepts: z.array(z.string().trim().min(1).max(800)).min(1).max(12),
  keyTakeaways: z.array(z.string().trim().min(1).max(800)).min(1).max(12),
  reviewQuestions: z.array(z.string().trim().min(1).max(800)).min(1).max(12),
});

const summaryGuideSchema = guideSchema.extend({
  chapterSummaries: z.array(z.object({ title: z.string().trim().min(1).max(200), summary: z.string().trim().min(1).max(6000) })).min(1).max(24),
});

function toChapter(row: ChapterRow): SummaryChapter {
  return { id: row.id, title: row.title, startSegmentIndex: row.start_segment_index, endSegmentIndex: row.end_segment_index };
}

function withPageRanges(chapters: SummaryChapter[], segments: SegmentRow[]) {
  const pages = new Map(segments.map((segment) => [segment.segment_index, segment.page_number]));
  return chapters.map((chapter) => ({ ...chapter, startPage: pages.get(chapter.startSegmentIndex) ?? undefined, endPage: pages.get(chapter.endSegmentIndex) ?? undefined }));
}

function validateChapterCoverage(chapters: SummaryChapter[], segmentCount: number) {
  if (!chapters.length || chapters.length > 24) throw new Error('Use between 1 and 24 chapters.');
  const parsed = chapters.map((chapter) => chapterSchema.parse(chapter)).sort((a, b) => a.startSegmentIndex - b.startSegmentIndex);
  if (parsed[0].startSegmentIndex !== 0 || parsed.at(-1)?.endSegmentIndex !== segmentCount - 1) throw new Error('Chapters must cover the full document.');
  for (let index = 1; index < parsed.length; index += 1) {
    if (parsed[index].startSegmentIndex !== parsed[index - 1].endSegmentIndex + 1) throw new Error('Chapter ranges must be continuous and cannot overlap.');
  }
  return parsed;
}

async function ownedBook(bookId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('books').select('id').eq('id', bookId).maybeSingle();
  if (!data) throw new Error('Book not found.');
  return supabase;
}

async function getSegments(supabase: Awaited<ReturnType<typeof createClient>>, bookId: string) {
  const { data, error } = await supabase.from('book_segments').select('content,segment_index,page_number').eq('book_id', bookId).order('segment_index');
  if (error || !data?.length) throw new Error('This book has no text available to summarize.');
  return data as SegmentRow[];
}

export async function getSummaryWorkspace(bookId: string): Promise<{ chapters: SummaryChapter[]; summary: SavedBookSummary | null }> {
  await requireUser();
  const supabase = await ownedBook(bookId);
  const [{ data: chapterData }, { data: summaryData }] = await Promise.all([
    supabase.from('book_summary_chapters').select('id,title,start_segment_index,end_segment_index').eq('book_id', bookId).order('start_segment_index'),
    supabase.from('book_summaries').select('guide,model,generated_at').eq('book_id', bookId).maybeSingle(),
  ]);
  const chapters = (chapterData ?? []) as ChapterRow[];
  const parsedGuide = summaryData ? summaryGuideSchema.safeParse((summaryData as SummaryRow).guide) : null;
  const summary = parsedGuide?.success && summaryData ? { guide: parsedGuide.data, model: (summaryData as SummaryRow).model, generatedAt: new Date((summaryData as SummaryRow).generated_at) } : null;
  const segments = await getSegments(supabase, bookId);
  if (chapters.length) return { chapters: withPageRanges(chapters.map(toChapter), segments), summary };
  return { chapters: withPageRanges(detectSummaryChapters(segments), segments), summary };
}

export async function saveSummaryChapters(input: { bookId: string; chapters: SummaryChapter[] }) {
  await requireUser();
  const bookId = z.string().uuid().parse(input.bookId);
  const supabase = await ownedBook(bookId);
  const segments = await getSegments(supabase, bookId);
  const chapters = validateChapterCoverage(input.chapters, segments.length);
  const { error: deleteError } = await supabase.from('book_summary_chapters').delete().eq('book_id', bookId);
  if (deleteError) return { success: false, error: 'Could not save the chapter outline.' };
  const { error } = await supabase.from('book_summary_chapters').insert(chapters.map((chapter) => ({ book_id: bookId, title: chapter.title, start_segment_index: chapter.startSegmentIndex, end_segment_index: chapter.endSegmentIndex })));
  return error ? { success: false, error: 'Could not save the chapter outline.' } : { success: true };
}

export async function generateBookSummary(input: { bookId: string; chapters: SummaryChapter[] }) {
  await requireUser();
  try {
    const bookId = z.string().uuid().parse(input.bookId);
    const supabase = await ownedBook(bookId);
    const segments = await getSegments(supabase, bookId);
    const chapters = validateChapterCoverage(input.chapters, segments.length);
    const chapterSummaries: BookStudyGuide['chapterSummaries'] = [];
    for (const chapter of chapters) {
      const content = segments.slice(chapter.startSegmentIndex, chapter.endSegmentIndex + 1).map((segment) => segment.content).join('\n\n');
      const summary = await generateGeminiText({
        systemInstruction: 'You are a meticulous academic summarizer. Never use outside knowledge. Give clear, useful study notes grounded solely in the source.',
        contents: [{ role: 'user', text: buildChapterSummaryPrompt(chapter.title, content) }],
        maxOutputTokens: 900,
      });
      chapterSummaries.push({ title: chapter.title, summary });
    }
    const synthesis = await generateGeminiText({
      systemInstruction: 'You are a meticulous academic editor. Return valid JSON only, with no Markdown fence or commentary.',
      contents: [{ role: 'user', text: buildStudyGuidePrompt(chapterSummaries) }],
      maxOutputTokens: 1400,
      responseMimeType: 'application/json',
    });
    const guideBase = guideSchema.parse(JSON.parse(synthesis));
    const guide: BookStudyGuide = { ...guideBase, chapterSummaries };
    const { error: chapterDeleteError } = await supabase.from('book_summary_chapters').delete().eq('book_id', bookId);
    if (chapterDeleteError) throw new Error('Could not save the chapter outline.');
    const { error: chapterError } = await supabase.from('book_summary_chapters').insert(chapters.map((chapter) => ({ book_id: bookId, title: chapter.title, start_segment_index: chapter.startSegmentIndex, end_segment_index: chapter.endSegmentIndex })));
    if (chapterError) throw new Error('Could not save the chapter outline.');
    const model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
    const { error: summaryError } = await supabase.from('book_summaries').upsert({ book_id: bookId, guide, model, generated_at: new Date().toISOString() });
    if (summaryError) throw new Error('Could not save the study guide.');
    return { success: true, summary: { guide, model, generatedAt: new Date() } satisfies SavedBookSummary };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'The summary could not be generated.' };
  }
}
