create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  table_number text not null,
  adult_count integer not null default 1 check (adult_count >= 0),
  child_count integer not null default 0 check (child_count >= 0),
  status text not null default 'open'
    check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  token text
);

-- Secure customer session token for QR access.
alter table public.sessions add column if not exists token text;
update public.sessions set token = encode(gen_random_bytes(32), 'hex') where token is null;
create unique index if not exists idx_sessions_token_unique on public.sessions(token) where token is not null;
alter table public.sessions alter column token set default encode(gen_random_bytes(32), 'hex');

-- If the sessions table already existed before this version, add the new customer counts.
alter table public.sessions add column if not exists adult_count integer not null default 1;
alter table public.sessions add column if not exists child_count integer not null default 0;

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  is_available boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  table_number text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  status text not null default 'received'
    check (status in ('received', 'preparing', 'ready', 'served')),
  created_at timestamptz not null default now()
);

create table if not exists public.staff_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  type text not null check (type in ('staff', 'bill')),
  status text not null default 'pending'
    check (status in ('pending', 'handled', 'cancelled')),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

create index if not exists idx_staff_requests_session_id on public.staff_requests(session_id);
create index if not exists idx_staff_requests_status on public.staff_requests(status);
create unique index if not exists idx_staff_requests_pending_unique
on public.staff_requests(session_id, type)
where status = 'pending';

create index if not exists idx_sessions_table_number
on public.sessions(table_number);

create index if not exists idx_sessions_status
on public.sessions(status);

create index if not exists idx_menu_items_category_id
on public.menu_items(category_id);

create index if not exists idx_orders_session_id
on public.orders(session_id);

create index if not exists idx_orders_status
on public.orders(status);

create index if not exists idx_orders_created_at
on public.orders(created_at);

insert into public.menu_categories (name, sort_order)
values
  ('ซูชิ', 1),
  ('โรล', 2),
  ('ซาชิมิ', 3),
  ('อาหารญี่ปุ่น', 4),
  ('เครื่องดื่ม', 5)
on conflict do nothing;

insert into public.menu_items (category_id, name, description, price)
values
  ((select id from public.menu_categories where name = 'ซูชิ' limit 1), 'ซูชิแซลมอน', 'แซลมอนสดบนข้าวซูชิ', 15),
  ((select id from public.menu_categories where name = 'ซูชิ' limit 1), 'ซูชิทูน่า', 'ทูน่าสดบนข้าวซูชิ', 15),
  ((select id from public.menu_categories where name = 'ซูชิ' limit 1), 'ซูชิไข่หวาน', 'ไข่หวานญี่ปุ่น', 10),
  ((select id from public.menu_categories where name = 'ซูชิ' limit 1), 'ซูชิกุ้ง', 'กุ้งต้มบนข้าวซูชิ', 15),
  ((select id from public.menu_categories where name = 'ซูชิ' limit 1), 'ซูชิไข่กุ้ง', 'ไข่กุ้งปรุงรส', 20),
  ((select id from public.menu_categories where name = 'โรล' limit 1), 'California Roll', 'โรลปูอัดและอะโวคาโด', 89),
  ((select id from public.menu_categories where name = 'โรล' limit 1), 'Salmon Roll', 'โรลแซลมอน', 99),
  ((select id from public.menu_categories where name = 'โรล' limit 1), 'Spicy Salmon Roll', 'โรลแซลมอนซอสเผ็ด', 109),
  ((select id from public.menu_categories where name = 'ซาชิมิ' limit 1), 'Salmon Sashimi', 'แซลมอนซาชิมิ', 159),
  ((select id from public.menu_categories where name = 'ซาชิมิ' limit 1), 'Tuna Sashimi', 'ทูน่าซาชิมิ', 159),
  ((select id from public.menu_categories where name = 'ซาชิมิ' limit 1), 'Mixed Sashimi', 'ชุดซาชิมิรวม', 199),
  ((select id from public.menu_categories where name = 'อาหารญี่ปุ่น' limit 1), 'ทาโกะยากิ', 'ทาโกะยากิ 6 ลูก', 50),
  ((select id from public.menu_categories where name = 'อาหารญี่ปุ่น' limit 1), 'เกี๊ยวซ่า', 'เกี๊ยวซ่าทอด', 50),
  ((select id from public.menu_categories where name = 'อาหารญี่ปุ่น' limit 1), 'เทมปุระ', 'กุ้งและผักชุบแป้งทอด', 69),
  ((select id from public.menu_categories where name = 'อาหารญี่ปุ่น' limit 1), 'ข้าวแซลมอน', 'ข้าวญี่ปุ่นพร้อมแซลมอน', 129),
  ((select id from public.menu_categories where name = 'เครื่องดื่ม' limit 1), 'ชาเขียว', 'ชาเขียวญี่ปุ่น', 30),
  ((select id from public.menu_categories where name = 'เครื่องดื่ม' limit 1), 'น้ำเปล่า', 'น้ำดื่ม', 15),
  ((select id from public.menu_categories where name = 'เครื่องดื่ม' limit 1), 'น้ำอัดลม', 'เครื่องดื่มอัดลม', 25);

-- Realtime for orders is assumed to be enabled in Supabase. Do not run ALTER PUBLICATION repeatedly.
