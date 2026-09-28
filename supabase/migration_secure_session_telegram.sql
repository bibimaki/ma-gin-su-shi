-- Run this migration on an EXISTING Supabase project.
-- This version does not change Realtime and does not revoke existing permissions.

create extension if not exists pgcrypto;

alter table public.sessions add column if not exists token text;
update public.sessions
set token = encode(gen_random_bytes(32), 'hex')
where token is null;

create unique index if not exists idx_sessions_token_unique
on public.sessions(token)
where token is not null;

alter table public.sessions
  alter column token set default encode(gen_random_bytes(32), 'hex');

create table if not exists public.staff_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  type text not null check (type in ('staff', 'bill')),
  status text not null default 'pending'
    check (status in ('pending', 'handled', 'cancelled')),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

create index if not exists idx_staff_requests_session_id
on public.staff_requests(session_id);

create index if not exists idx_staff_requests_status
on public.staff_requests(status);

create unique index if not exists idx_staff_requests_pending_unique
on public.staff_requests(session_id, type)
where status = 'pending';

-- orders is already in supabase_realtime in your project.
-- Do NOT run: alter publication supabase_realtime add table public.orders;
