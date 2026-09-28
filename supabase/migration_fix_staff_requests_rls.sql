-- FIX: staff_requests RLS without disabling RLS
-- Run this ONCE in Supabase SQL Editor.
--
-- The customer request API calls a SECURITY DEFINER function.
-- The function validates the QR session token before inserting.
-- This prevents a customer from choosing another table's session_id.

create or replace function public.create_staff_request(
  p_token text,
  p_type text
)
returns table (
  id uuid,
  type text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
  v_id uuid;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'ไม่พบ Session Token';
  end if;

  if p_type not in ('staff', 'bill') then
    raise exception 'ประเภทคำขอไม่ถูกต้อง';
  end if;

  select s.id
    into v_session_id
  from public.sessions s
  where s.token = p_token
    and s.status = 'open'
  limit 1;

  if v_session_id is null then
    raise exception 'Session หมดอายุหรือโต๊ะถูกปิดแล้ว';
  end if;

  insert into public.staff_requests (session_id, type, status)
  values (v_session_id, p_type, 'pending')
  on conflict (session_id, type) where status = 'pending'
  do nothing
  returning staff_requests.id into v_id;

  if v_id is null then
    return query
      select r.id, r.type, r.status, r.created_at
      from public.staff_requests r
      where r.session_id = v_session_id
        and r.type = p_type
        and r.status = 'pending'
      limit 1;
  else
    return query
      select r.id, r.type, r.status, r.created_at
      from public.staff_requests r
      where r.id = v_id;
  end if;
end;
$$;

-- Safe to call from the public customer page because the function
-- requires a valid, currently-open QR session token.
grant execute on function public.create_staff_request(text, text)
to anon, authenticated, service_role;
