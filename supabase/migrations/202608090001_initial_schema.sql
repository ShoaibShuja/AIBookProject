create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  legacy_clerk_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key,
  owner_id uuid references public.profiles(id) on delete cascade,
  legacy_clerk_id text,
  legacy_mongo_id text unique,
  title text not null check (char_length(title) between 1 and 100),
  slug text not null check (char_length(slug) between 1 and 140),
  author text not null check (char_length(author) between 1 and 100),
  persona text,
  pdf_path text not null,
  cover_path text,
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  total_segments integer not null default 0 check (total_segments >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index books_owner_slug_unique on public.books(owner_id, slug) where owner_id is not null;
create index books_owner_created_at_idx on public.books(owner_id, created_at desc);
create index books_owner_title_trgm_idx on public.books using gin (title gin_trgm_ops);
create index books_owner_author_trgm_idx on public.books using gin (author gin_trgm_ops);
create index books_legacy_clerk_id_idx on public.books(legacy_clerk_id) where owner_id is null;

create table public.book_segments (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  content text not null check (char_length(content) > 0),
  segment_index integer not null check (segment_index >= 0),
  page_number integer check (page_number > 0),
  word_count integer not null check (word_count > 0),
  search_vector tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(book_id, segment_index)
);

create index book_segments_book_idx on public.book_segments(book_id, segment_index);
create index book_segments_search_vector_idx on public.book_segments using gin(search_vector);

create table public.voice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  legacy_clerk_id text,
  legacy_mongo_id text unique,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  billing_period_start date not null default date_trunc('month', timezone('utc', now()))::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create index voice_sessions_user_period_idx on public.voice_sessions(user_id, billing_period_start);
create index voice_sessions_legacy_clerk_id_idx on public.voice_sessions(legacy_clerk_id) where user_id is null;

create table public.legacy_user_mappings (
  legacy_clerk_id text primary key,
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  mapped_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger books_updated_at before update on public.books for each row execute procedure public.set_updated_at();
create trigger book_segments_updated_at before update on public.book_segments for each row execute procedure public.set_updated_at();
create trigger voice_sessions_updated_at before update on public.voice_sessions for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.book_segments enable row level security;
alter table public.voice_sessions enable row level security;
alter table public.legacy_user_mappings enable row level security;

create policy "profiles: own row" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: own update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "books: owner select" on public.books for select to authenticated using ((select auth.uid()) = owner_id);
create policy "books: owner insert" on public.books for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "books: owner update" on public.books for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "books: owner delete" on public.books for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "segments: book owner select" on public.book_segments for select to authenticated using (
  exists (select 1 from public.books where books.id = book_segments.book_id and books.owner_id = (select auth.uid()))
);
create policy "segments: book owner insert" on public.book_segments for insert to authenticated with check (
  exists (select 1 from public.books where books.id = book_segments.book_id and books.owner_id = (select auth.uid()))
);
create policy "segments: book owner update" on public.book_segments for update to authenticated using (
  exists (select 1 from public.books where books.id = book_segments.book_id and books.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.books where books.id = book_segments.book_id and books.owner_id = (select auth.uid()))
);
create policy "segments: book owner delete" on public.book_segments for delete to authenticated using (
  exists (select 1 from public.books where books.id = book_segments.book_id and books.owner_id = (select auth.uid()))
);

create policy "sessions: own rows" on public.voice_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('book-files', 'book-files', false, 52428800, array['application/pdf']),
  ('book-covers', 'book-covers', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "storage: users read their folders" on storage.objects for select to authenticated using (
  bucket_id in ('book-files', 'book-covers') and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "storage: users upload to their folders" on storage.objects for insert to authenticated with check (
  bucket_id in ('book-files', 'book-covers') and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "storage: users update their folders" on storage.objects for update to authenticated using (
  bucket_id in ('book-files', 'book-covers') and (storage.foldername(name))[1] = (select auth.uid()::text)
) with check (
  bucket_id in ('book-files', 'book-covers') and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy "storage: users delete their folders" on storage.objects for delete to authenticated using (
  bucket_id in ('book-files', 'book-covers') and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create or replace function public.ingest_book(
  p_book_id uuid,
  p_title text,
  p_slug text,
  p_author text,
  p_persona text,
  p_pdf_path text,
  p_cover_path text,
  p_file_size bigint,
  p_segments jsonb
)
returns table(status text, book_id uuid, book_slug text)
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_id uuid;
  v_segment_count integer;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if jsonb_typeof(p_segments) <> 'array' or jsonb_array_length(p_segments) = 0 then raise exception 'SEGMENTS_REQUIRED' using errcode = '22023'; end if;
  if p_file_size <= 0 or p_file_size > 52428800 then raise exception 'INVALID_FILE_SIZE' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  select id into v_existing_id from public.books where owner_id = v_user_id and slug = p_slug;
  if v_existing_id is not null then
    return query select 'already_exists'::text, v_existing_id, p_slug;
    return;
  end if;
  if (select count(*) from public.books where owner_id = v_user_id) >= 1 then raise exception 'BOOK_LIMIT_REACHED' using errcode = 'P0001'; end if;

  insert into public.books (id, owner_id, title, slug, author, persona, pdf_path, cover_path, file_size, total_segments)
  values (p_book_id, v_user_id, p_title, p_slug, p_author, nullif(p_persona, ''), p_pdf_path, nullif(p_cover_path, ''), p_file_size, jsonb_array_length(p_segments));

  insert into public.book_segments (book_id, content, segment_index, page_number, word_count)
  select p_book_id, segment.content, segment.segment_index, segment.page_number, segment.word_count
  from jsonb_to_recordset(p_segments) as segment(content text, segment_index integer, page_number integer, word_count integer);

  get diagnostics v_segment_count = row_count;
  if v_segment_count <> jsonb_array_length(p_segments) then raise exception 'SEGMENT_IMPORT_FAILED'; end if;
  return query select 'created'::text, p_book_id, p_slug;
end;
$$;

create or replace function public.start_voice_session(p_book_id uuid)
returns table(session_id uuid, max_duration_minutes integer)
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_period date := date_trunc('month', timezone('utc', now()))::date;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if not exists (select 1 from public.books where id = p_book_id and owner_id = v_user_id) then raise exception 'BOOK_NOT_FOUND' using errcode = 'P0002'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || v_period::text, 0));
  if (select count(*) from public.voice_sessions where user_id = v_user_id and billing_period_start = v_period) >= 5 then raise exception 'SESSION_LIMIT_REACHED' using errcode = 'P0001'; end if;
  return query
  insert into public.voice_sessions (user_id, book_id, billing_period_start)
  values (v_user_id, p_book_id, v_period)
  returning id, 5;
end;
$$;

create or replace function public.end_voice_session(p_session_id uuid, p_duration_seconds integer)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if p_duration_seconds < 0 then raise exception 'INVALID_DURATION' using errcode = '22023'; end if;
  update public.voice_sessions set ended_at = now(), duration_seconds = least(p_duration_seconds, 300)
  where id = p_session_id and user_id = auth.uid();
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode = 'P0002'; end if;
  return true;
end;
$$;

create or replace function public.search_book_segments(p_book_id uuid, p_query text, p_limit integer default 3)
returns table(id uuid, book_id uuid, content text, segment_index integer, page_number integer, word_count integer, rank real)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_query tsquery;
begin
  if p_query is null or length(trim(p_query)) = 0 then return; end if;
  v_query := websearch_to_tsquery('english', p_query);
  return query
  select s.id, s.book_id, s.content, s.segment_index, s.page_number, s.word_count, ts_rank(s.search_vector, v_query)::real
  from public.book_segments s
  where s.book_id = p_book_id and s.search_vector @@ v_query
  order by ts_rank(s.search_vector, v_query) desc, s.segment_index asc
  limit greatest(1, least(p_limit, 10));
  if found then return; end if;
  return query
  select s.id, s.book_id, s.content, s.segment_index, s.page_number, s.word_count, 0::real
  from public.book_segments s
  where s.book_id = p_book_id and s.content ilike '%' || replace(replace(replace(trim(p_query), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%' escape E'\\'
  order by s.segment_index asc
  limit greatest(1, least(p_limit, 10));
end;
$$;

revoke all on function public.search_book_segments(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.search_book_segments(uuid, text, integer) to service_role;
grant execute on function public.ingest_book(uuid, text, text, text, text, text, text, bigint, jsonb) to authenticated;
grant execute on function public.start_voice_session(uuid) to authenticated;
grant execute on function public.end_voice_session(uuid, integer) to authenticated;
