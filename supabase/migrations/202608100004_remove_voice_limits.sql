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
  return query
  insert into public.voice_sessions (user_id, book_id, billing_period_start)
  values (v_user_id, p_book_id, v_period)
  returning id, null::integer;
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
  update public.voice_sessions set ended_at = now(), duration_seconds = p_duration_seconds
  where id = p_session_id and user_id = auth.uid();
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode = 'P0002'; end if;
  return true;
end;
$$;
