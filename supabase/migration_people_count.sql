-- Run this once in Supabase SQL Editor if your existing sessions table
-- was created before the adult/child count feature was added.
alter table public.sessions
  add column if not exists adult_count integer not null default 1;

alter table public.sessions
  add column if not exists child_count integer not null default 0;

alter table public.sessions
  drop constraint if exists sessions_adult_count_check;

alter table public.sessions
  add constraint sessions_adult_count_check check (adult_count >= 0);

alter table public.sessions
  drop constraint if exists sessions_child_count_check;

alter table public.sessions
  add constraint sessions_child_count_check check (child_count >= 0);
