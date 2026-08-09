import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'LEGACY_USER_MAPPING_FILE']) {
  if (!process.env[key]) throw new Error(`${key} is required`);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const mappings = JSON.parse(await readFile(process.env.LEGACY_USER_MAPPING_FILE, 'utf8'));

async function moveIfNeeded(bucket, sourcePath, targetPath) {
  const moved = await supabase.storage.from(bucket).move(sourcePath, targetPath);
  if (!moved.error) return;
  const existing = await supabase.storage.from(bucket).download(targetPath);
  if (existing.error) throw moved.error;
}

for (const mapping of mappings) {
  const { legacyClerkId, newSupabaseUserId } = mapping;
  if (!legacyClerkId || !newSupabaseUserId) throw new Error('Every mapping needs legacyClerkId and newSupabaseUserId');
  const { data: books, error: booksError } = await supabase.from('books').select('id,pdf_path,cover_path').eq('legacy_clerk_id', legacyClerkId).is('owner_id', null);
  if (booksError) throw booksError;

  for (const book of books ?? []) {
    const nextPdfPath = `${newSupabaseUserId}/${book.id}/source.pdf`;
    await moveIfNeeded('book-files', book.pdf_path, nextPdfPath);
    let nextCoverPath = null;
    if (book.cover_path) {
      nextCoverPath = `${newSupabaseUserId}/${book.id}/cover`;
      await moveIfNeeded('book-covers', book.cover_path, nextCoverPath);
    }
    const { error: bookUpdateError } = await supabase.from('books').update({ owner_id: newSupabaseUserId, pdf_path: nextPdfPath, cover_path: nextCoverPath }).eq('id', book.id);
    if (bookUpdateError) throw bookUpdateError;
  }

  const { error: sessionError } = await supabase.from('voice_sessions').update({ user_id: newSupabaseUserId }).eq('legacy_clerk_id', legacyClerkId).is('user_id', null);
  if (sessionError) throw sessionError;
  const { error: profileError } = await supabase.from('profiles').update({ legacy_clerk_id: legacyClerkId }).eq('id', newSupabaseUserId);
  if (profileError) throw profileError;
  const { error: auditError } = await supabase.from('legacy_user_mappings').upsert({ legacy_clerk_id: legacyClerkId, user_id: newSupabaseUserId });
  if (auditError) throw auditError;
  console.log(`Mapped ${legacyClerkId} to ${newSupabaseUserId}`);
}
