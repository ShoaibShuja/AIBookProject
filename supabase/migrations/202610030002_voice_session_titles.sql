alter table public.voice_sessions
  add column if not exists title text;

alter table public.voice_sessions
  drop constraint if exists voice_sessions_title_length;

alter table public.voice_sessions
  add constraint voice_sessions_title_length
  check (title is null or char_length(trim(title)) between 1 and 100);
