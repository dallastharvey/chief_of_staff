create extension if not exists pgcrypto;

create table if not exists memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  source text not null default 'manual',
  kind text not null default 'note',
  title text not null,
  content text not null,
  status text not null default 'active',
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memory_items_created_at_idx on memory_items(created_at desc);
create index if not exists memory_items_kind_idx on memory_items(kind);
create index if not exists memory_items_due_at_idx on memory_items(due_at);

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  provider text not null,
  display_name text not null,
  status text not null default 'not_connected',
  last_checked_at timestamptz,
  last_success_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

insert into connections (provider, display_name, status)
values
  ('calendar', 'Calendar', 'not_connected'),
  ('email', 'Email', 'not_connected'),
  ('tasks', 'Tasks', 'not_connected')
on conflict do nothing;