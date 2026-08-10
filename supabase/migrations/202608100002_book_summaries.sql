create table if not exists public.book_summary_chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  start_segment_index integer not null check (start_segment_index >= 0),
  end_segment_index integer not null check (end_segment_index >= start_segment_index),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(book_id, start_segment_index),
  unique(book_id, end_segment_index)
);

create table if not exists public.book_summaries (
  book_id uuid primary key references public.books(id) on delete cascade,
  guide jsonb not null check (jsonb_typeof(guide) = 'object'),
  model text not null check (char_length(trim(model)) between 1 and 100),
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists book_summary_chapters_book_idx on public.book_summary_chapters(book_id, start_segment_index);

drop trigger if exists book_summary_chapters_updated_at on public.book_summary_chapters;
create trigger book_summary_chapters_updated_at before update on public.book_summary_chapters for each row execute procedure public.set_updated_at();
drop trigger if exists book_summaries_updated_at on public.book_summaries;
create trigger book_summaries_updated_at before update on public.book_summaries for each row execute procedure public.set_updated_at();

alter table public.book_summary_chapters enable row level security;
alter table public.book_summaries enable row level security;

drop policy if exists "summary chapters: book owner" on public.book_summary_chapters;
create policy "summary chapters: book owner" on public.book_summary_chapters for all to authenticated using (
  exists (select 1 from public.books where books.id = book_summary_chapters.book_id and books.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.books where books.id = book_summary_chapters.book_id and books.owner_id = (select auth.uid()))
);

drop policy if exists "book summaries: book owner" on public.book_summaries;
create policy "book summaries: book owner" on public.book_summaries for all to authenticated using (
  exists (select 1 from public.books where books.id = book_summaries.book_id and books.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.books where books.id = book_summaries.book_id and books.owner_id = (select auth.uid()))
);
