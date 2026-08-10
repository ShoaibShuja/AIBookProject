import type { SummaryChapter } from '@/types';

export type SummarySegment = { content: string; segment_index: number; page_number: number | null };

function firstHeading(content: string) {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 4);
  for (const line of lines) {
    if (line.length > 160) continue;
    if (/^(chapter|part|section|unit|lesson)\s+(\d+|[ivxlcdm]+)\b/i.test(line)) return line;
    if (/^(?:\d{1,2}|[ivxlcdm]+)[.:\-\s]+[A-Z][\w\s,:'’&()\-]{2,120}$/i.test(line)) return line;
  }
  return undefined;
}

export function detectSummaryChapters(segments: SummarySegment[]): SummaryChapter[] {
  if (!segments.length) return [];
  const candidates = segments.flatMap((segment) => {
    const title = firstHeading(segment.content);
    return title ? [{ title, startSegmentIndex: segment.segment_index }] : [];
  }).filter((candidate, index, all) => index === 0 || candidate.startSegmentIndex - all[index - 1].startSegmentIndex >= 2);

  if (candidates.length >= 2 && candidates.length <= 24) {
    const starts = candidates[0].startSegmentIndex === 0 ? candidates : [{ title: 'Opening', startSegmentIndex: 0 }, ...candidates];
    return starts.map((chapter, index) => ({ title: chapter.title, startSegmentIndex: chapter.startSegmentIndex, endSegmentIndex: (starts[index + 1]?.startSegmentIndex ?? segments.length) - 1 }));
  }

  const segmentsPerChapter = Math.max(1, Math.ceil(segments.length / 16));
  return Array.from({ length: Math.ceil(segments.length / segmentsPerChapter) }, (_, index) => ({
    title: `Part ${index + 1}`,
    startSegmentIndex: index * segmentsPerChapter,
    endSegmentIndex: Math.min(segments.length - 1, ((index + 1) * segmentsPerChapter) - 1),
  }));
}

export function buildChapterSummaryPrompt(title: string, content: string) {
  return `Summarize the chapter titled "${title}" using only the provided source text. Preserve the source language. Explain its central argument, essential details, terms, examples, and conclusions. Do not invent content or citations. If the excerpt is incomplete, say what is missing.\n\nSOURCE TEXT:\n${content}`;
}

export function buildStudyGuidePrompt(chapterSummaries: { title: string; summary: string }[]) {
  return `Create a rigorous study guide from these grounded chapter summaries. Preserve their language. Return only valid JSON with this exact shape: {"overview":"string","keyConcepts":["string"],"keyTakeaways":["string"],"reviewQuestions":["string"]}. Include 4 to 10 concise items in each list. Do not add facts not present in the summaries.\n\nCHAPTER SUMMARIES:\n${chapterSummaries.map((chapter) => `## ${chapter.title}\n${chapter.summary}`).join('\n\n')}`;
}
