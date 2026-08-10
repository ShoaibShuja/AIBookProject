create or replace function public.ingest_book(
  p_book_id uuid, p_title text, p_slug text, p_author text, p_persona text, p_pdf_path text, p_cover_path text, p_file_size bigint, p_segments jsonb
)
returns table(status text, book_id uuid, book_slug text)
language plpgsql set search_path = public as $$
declare
  v_user_id uuid := auth.uid(); v_existing_id uuid; v_segment_count integer;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if jsonb_typeof(p_segments) <> 'array' or jsonb_array_length(p_segments) = 0 then raise exception 'SEGMENTS_REQUIRED' using errcode = '22023'; end if;
  if exists (
    select 1
    from rows from (
      jsonb_to_recordset(p_segments) as (content text, segment_index integer, page_number integer, word_count integer)
    ) with ordinality as s(content, segment_index, page_number, word_count, ordinal)
    where s.content is null or char_length(trim(s.content)) = 0 or s.segment_index <> s.ordinal - 1 or s.word_count is null or s.word_count <= 0 or s.word_count > 500
  ) then raise exception 'INVALID_SEGMENTS' using errcode = '22023'; end if;
  if p_file_size <= 0 or p_file_size > 52428800 then raise exception 'INVALID_FILE_SIZE' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  select id into v_existing_id from public.books where owner_id = v_user_id and slug = p_slug;
  if v_existing_id is not null then return query select 'already_exists'::text, v_existing_id, p_slug; return; end if;
  insert into public.books (id, owner_id, title, slug, author, persona, pdf_path, cover_path, file_size, total_segments)
  values (p_book_id, v_user_id, p_title, p_slug, p_author, nullif(p_persona, ''), p_pdf_path, nullif(p_cover_path, ''), p_file_size, jsonb_array_length(p_segments));
  insert into public.book_segments (book_id, content, segment_index, page_number, word_count)
  select p_book_id, s.content, s.segment_index, s.page_number, s.word_count from jsonb_to_recordset(p_segments) as s(content text, segment_index integer, page_number integer, word_count integer);
  get diagnostics v_segment_count = row_count;
  if v_segment_count <> jsonb_array_length(p_segments) then raise exception 'SEGMENT_IMPORT_FAILED'; end if;
  return query select 'created'::text, p_book_id, p_slug;
end;
$$;
