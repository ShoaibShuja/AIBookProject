import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  book: { id: '00000000-0000-4000-8000-000000000001' } as { id: string } | null,
  gemini: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireUser: vi.fn().mockResolvedValue({ id: 'test-user' }) }));
vi.mock('@/lib/gemini', () => ({ generateGeminiText: mocks.gemini }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === 'books') {
        const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: mocks.book }) };
        return query;
      }
      if (table === 'book_segments') {
        const query = { select: () => query, eq: () => query, order: async () => ({ data: [{ segment_index: 0, content: 'Chapter 1: Testing\nTesting is important.', page_number: 1 }] }) };
        return query;
      }
      if (table === 'book_summary_chapters') return { delete: () => ({ eq: async () => ({ error: null }) }), insert: async () => ({ error: null }) };
      if (table === 'book_summaries') return { upsert: mocks.upsert };
      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

import { generateBookSummary } from '@/lib/actions/summary.actions';

const bookId = '00000000-0000-4000-8000-000000000001';
const chapters = [{ title: 'Chapter 1: Testing', startSegmentIndex: 0, endSegmentIndex: 0 }];

describe('summary generation actions', () => {
  beforeEach(() => {
    mocks.book = { id: bookId };
    mocks.gemini.mockReset();
    mocks.upsert.mockReset().mockResolvedValue({ error: null });
  });

  it('does not send segments to Gemini when the book is not accessible', async () => {
    mocks.book = null;
    const result = await generateBookSummary({ bookId, chapters });
    expect(result.success).toBe(false);
    expect(mocks.gemini).not.toHaveBeenCalled();
  });

  it('persists the guide only after chapter and final synthesis complete', async () => {
    mocks.gemini
      .mockResolvedValueOnce('A grounded chapter summary.')
      .mockResolvedValueOnce(JSON.stringify({ overview: 'A grounded overview.', keyConcepts: ['Testing'], keyTakeaways: ['Validate behavior'], reviewQuestions: ['Why test?'] }));
    const result = await generateBookSummary({ bookId, chapters });
    expect(result.success).toBe(true);
    expect(mocks.gemini).toHaveBeenCalledTimes(2);
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ book_id: bookId, guide: expect.objectContaining({ overview: 'A grounded overview.' }) }));
  });
});
