import { describe, expect, it } from 'vitest';
import { buildChapterSummaryPrompt, buildStudyGuidePrompt, detectSummaryChapters } from '@/lib/summary';

describe('book summaries', () => {
  it('detects chapter headings and creates continuous ranges', () => {
    const chapters = detectSummaryChapters([
      { segment_index: 0, content: 'Chapter 1: Origins\nThe opening text.', page_number: 1 },
      { segment_index: 1, content: 'More on the opening.', page_number: 2 },
      { segment_index: 2, content: 'Chapter 2: Methods\nThe next section.', page_number: 3 },
      { segment_index: 3, content: 'More methods.', page_number: 4 },
    ]);
    expect(chapters).toEqual([
      { title: 'Chapter 1: Origins', startSegmentIndex: 0, endSegmentIndex: 1 },
      { title: 'Chapter 2: Methods', startSegmentIndex: 2, endSegmentIndex: 3 },
    ]);
  });

  it('uses evenly sized fallback sections when no headings exist', () => {
    const chapters = detectSummaryChapters(Array.from({ length: 17 }, (_, segment_index) => ({ segment_index, content: `Page ${segment_index}`, page_number: segment_index + 1 })));
    expect(chapters[0].startSegmentIndex).toBe(0);
    expect(chapters.at(-1)?.endSegmentIndex).toBe(16);
    expect(chapters.every((chapter, index) => index === 0 || chapter.startSegmentIndex === chapters[index - 1].endSegmentIndex + 1)).toBe(true);
  });

  it('keeps chapter and synthesis prompts grounded in the source', () => {
    expect(buildChapterSummaryPrompt('Methods', 'Only this source text.')).toContain('Only this source text.');
    expect(buildStudyGuidePrompt([{ title: 'Methods', summary: 'Evidence-based steps.' }])).toContain('Evidence-based steps.');
  });
});
