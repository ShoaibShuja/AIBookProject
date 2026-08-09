import { createHash, randomUUID } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

const required = ['MONGODB_URI', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) if (!process.env[key]) throw new Error(`${key} is required`);

const mongo = new MongoClient(process.env.MONGODB_URI);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const mongoDb = mongo.db(process.env.MONGODB_DATABASE ?? undefined);

function id(value) { return value?.toString(); }
function date(value) { return value ? new Date(value).toISOString() : null; }
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function storagePath(legacyClerkId, bookId, filename) { return `legacy/${legacyClerkId}/${bookId}/${filename}`; }

async function copyAsset(url, bucket, path) {
  if (!url) return null;
  const existing = await supabase.storage.from(bucket).download(path);
  if (!existing.error) return path;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Cannot download legacy asset: ${url}`);
  const contentType = response.headers.get('content-type') ?? undefined;
  const body = await response.arrayBuffer();
  const upload = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: false });
  if (upload.error && !upload.error.message.toLowerCase().includes('already exists')) throw upload.error;

  const verification = await supabase.storage.from(bucket).download(path);
  if (verification.error) throw verification.error;
  const downloaded = await verification.data.arrayBuffer();
  if (sha256(Buffer.from(body)) !== sha256(Buffer.from(downloaded))) throw new Error(`Checksum mismatch for ${path}`);
  return path;
}

async function upsertSegments(bookId, legacyBookId) {
  const collection = mongoDb.collection('booksegments');
  const legacySegments = await collection.find({ bookId: new ObjectId(legacyBookId) }).sort({ segmentIndex: 1 }).toArray();
  for (let index = 0; index < legacySegments.length; index += 500) {
    const rows = legacySegments.slice(index, index + 500).map((segment) => ({
      book_id: bookId,
      content: segment.content,
      segment_index: segment.segmentIndex,
      page_number: segment.pageNumber ?? null,
      word_count: segment.wordCount,
      created_at: date(segment.createdAt) ?? new Date().toISOString(),
      updated_at: date(segment.updatedAt) ?? new Date().toISOString(),
    }));
    if (!rows.length) continue;
    const { error } = await supabase.from('book_segments').upsert(rows, { onConflict: 'book_id,segment_index', ignoreDuplicates: true });
    if (error) throw error;
  }
  return legacySegments.length;
}

async function migrateBooks() {
  const legacyBooks = await mongoDb.collection('books').find({}).sort({ createdAt: 1 }).toArray();
  const mapping = new Map();

  for (const legacyBook of legacyBooks) {
    const legacyId = id(legacyBook._id);
    const { data: existing, error: existingError } = await supabase.from('books').select('id').eq('legacy_mongo_id', legacyId).maybeSingle();
    if (existingError) throw existingError;
    const bookId = existing?.id ?? randomUUID();
    const legacyClerkId = legacyBook.clerkId ?? 'unknown';
    const pdfPath = storagePath(legacyClerkId, bookId, 'source.pdf');
    const coverPath = legacyBook.coverURL ? storagePath(legacyClerkId, bookId, 'cover') : null;

    if (!legacyBook.fileURL) throw new Error(`Legacy book ${legacyId} has no PDF URL`);
    await copyAsset(legacyBook.fileURL, 'book-files', pdfPath);
    if (coverPath) await copyAsset(legacyBook.coverURL, 'book-covers', coverPath);

    const { error } = await supabase.from('books').upsert({
      id: bookId,
      owner_id: null,
      legacy_clerk_id: legacyClerkId,
      legacy_mongo_id: legacyId,
      title: legacyBook.title,
      slug: legacyBook.slug,
      author: legacyBook.author,
      persona: legacyBook.persona ?? null,
      pdf_path: pdfPath,
      cover_path: coverPath,
      file_size: legacyBook.fileSize,
      total_segments: legacyBook.totalSegments ?? 0,
      created_at: date(legacyBook.createdAt) ?? new Date().toISOString(),
      updated_at: date(legacyBook.updatedAt) ?? new Date().toISOString(),
    }, { onConflict: 'legacy_mongo_id' });
    if (error) throw error;
    const segmentCount = await upsertSegments(bookId, legacyId);
    const { error: countError } = await supabase.from('books').update({ total_segments: segmentCount }).eq('id', bookId);
    if (countError) throw countError;
    mapping.set(legacyId, bookId);
    console.log(`Migrated book ${legacyId} -> ${bookId}`);
  }
  return { count: legacyBooks.length, mapping };
}

async function migrateSessions(bookMapping) {
  const sessions = await mongoDb.collection('voicesessions').find({}).sort({ createdAt: 1 }).toArray();
  for (const session of sessions) {
    const targetBookId = bookMapping.get(id(session.bookId));
    if (!targetBookId) continue;
    const { error } = await supabase.from('voice_sessions').upsert({
      id: randomUUID(),
      user_id: null,
      book_id: targetBookId,
      legacy_clerk_id: session.clerkId ?? null,
      legacy_mongo_id: id(session._id),
      started_at: date(session.startedAt) ?? date(session.createdAt) ?? new Date().toISOString(),
      ended_at: date(session.endedAt),
      duration_seconds: session.durationSeconds ?? 0,
      billing_period_start: (date(session.billingPeriodStart) ?? new Date().toISOString()).slice(0, 10),
      created_at: date(session.createdAt) ?? new Date().toISOString(),
      updated_at: date(session.updatedAt) ?? new Date().toISOString(),
    }, { onConflict: 'legacy_mongo_id', ignoreDuplicates: true });
    if (error) throw error;
  }
  return sessions.length;
}

try {
  await mongo.connect();
  const { count: bookCount, mapping } = await migrateBooks();
  const sessionCount = await migrateSessions(mapping);
  const { count: importedBooks, error: booksError } = await supabase.from('books').select('*', { count: 'exact', head: true }).not('legacy_mongo_id', 'is', null);
  const { count: importedSessions, error: sessionsError } = await supabase.from('voice_sessions').select('*', { count: 'exact', head: true }).not('legacy_mongo_id', 'is', null);
  if (booksError || sessionsError) throw booksError ?? sessionsError;
  if (importedBooks !== bookCount || importedSessions !== sessionCount) throw new Error('Post-migration count reconciliation failed');
  console.log(`Migration verified: ${bookCount} books and ${sessionCount} sessions.`);
} finally {
  await mongo.close();
}
