'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { CreateBook, IBook, TextSegment } from '@/types';
import { generateSlug } from '@/lib/utils';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const textSegmentSchema = z.object({
  text: z.string().min(1),
  segmentIndex: z.number().int().nonnegative(),
  pageNumber: z.number().int().positive().optional(),
  wordCount: z.number().int().positive(),
});

const createBookSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(100),
  author: z.string().trim().min(1).max(100),
  persona: z.string().trim().max(100).optional(),
  pdfPath: z.string().min(1).max(500),
  coverPath: z.string().max(500).optional(),
  fileSize: z.number().int().positive().max(50 * 1024 * 1024),
  segments: z.array(textSegmentSchema).min(1).superRefine((segments, context) => {
    segments.forEach((segment, index) => {
      if (segment.segmentIndex !== index) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Segment indexes must be contiguous.' });
      if (segment.wordCount > 500) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Segments cannot exceed 500 words.' });
    });
  }),
});

type BookRow = {
  id: string;
  title: string;
  slug: string;
  author: string;
  persona: string | null;
  pdf_path: string;
  cover_path: string | null;
  file_size: number;
  total_segments: number;
  created_at: string;
  updated_at: string;
};

function toBook(row: BookRow, coverURL?: string | null): IBook {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    author: row.author,
    persona: row.persona ?? undefined,
    pdfPath: row.pdf_path,
    coverPath: row.cover_path,
    coverURL: coverURL ?? null,
    fileSize: Number(row.file_size),
    totalSegments: row.total_segments,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

async function addCoverUrls(rows: BookRow[]) {
  const supabase = await createClient();
  return Promise.all(rows.map(async (row) => {
    if (!row.cover_path) return toBook(row, null);
    const { data } = await supabase.storage.from('book-covers').createSignedUrl(row.cover_path, 60 * 10);
    return toBook(row, data?.signedUrl ?? null);
  }));
}

export async function getAllBooks(search?: string) {
  await requireUser();
  const supabase = await createClient();
  let query = supabase.from('books').select('id,title,slug,author,persona,pdf_path,cover_path,file_size,total_segments,created_at,updated_at').order('created_at', { ascending: false });

  const normalizedSearch = search?.trim();
  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[%_(),]/g, ' ');
    query = query.or(`title.ilike.%${escapedSearch}%,author.ilike.%${escapedSearch}%`);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: 'Unable to load your books.', data: [] as IBook[] };
  return { success: true, data: await addCoverUrls((data ?? []) as BookRow[]) };
}

export async function checkBookExists(title: string) {
  await requireUser();
  const slug = generateSlug(title);
  const supabase = await createClient();
  const { data, error } = await supabase.from('books').select('id,slug').eq('slug', slug).maybeSingle();
  if (error) return { exists: false, error: 'Unable to check existing books.' };
  return data ? { exists: true, book: data } : { exists: false };
}

export async function ingestBook(input: CreateBook) {
  const user = await requireUser();
  const parsed = createBookSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid book upload data.' };

  const book = parsed.data;
  const expectedPrefix = `${user.id}/${book.id}/`;
  if (!book.pdfPath.startsWith(expectedPrefix) || (book.coverPath && !book.coverPath.startsWith(expectedPrefix))) {
    return { success: false, error: 'Invalid storage path.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('ingest_book', {
    p_book_id: book.id,
    p_title: book.title,
    p_slug: generateSlug(book.title),
    p_author: book.author,
    p_persona: book.persona ?? '',
    p_pdf_path: book.pdfPath,
    p_cover_path: book.coverPath ?? '',
    p_file_size: book.fileSize,
    p_segments: book.segments.map((segment: TextSegment) => ({
      content: segment.text,
      segment_index: segment.segmentIndex,
      page_number: segment.pageNumber ?? null,
      word_count: segment.wordCount,
    })),
  });

  if (error) return { success: false, error: 'Unable to save this book. Please try again.', code: error.message };

  const result = (data as { status: string; book_id: string; book_slug: string }[] | null)?.[0];
  if (!result) return { success: false, error: 'Unable to save this book.' };

  revalidatePath('/');
  return { success: true, alreadyExists: result.status === 'already_exists', data: { id: result.book_id, slug: result.book_slug } };
}

export async function getBookBySlug(slug: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('books')
    .select('id,title,slug,author,persona,pdf_path,cover_path,file_size,total_segments,created_at,updated_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return { success: false, error: 'Book not found.' };
  return { success: true, data: (await addCoverUrls([data as BookRow]))[0] };
}
