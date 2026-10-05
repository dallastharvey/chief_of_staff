create extension if not exists pgcrypto;

create table if not exists memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'manual',
  kind text not null default 'note' check (kind in ('task','event','person','note','commitment')),
  title text not null,
  content text not null,
  status text not null default 'active',
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memory_items_user_created_at_idx on memory_items(user_id, created_at desc);
create index if not exists memory_items_user_kind_idx on memory_items(user_id, kind);
create index if not exists memory_items_user_due_at_idx on memory_items(user_id, due_at);

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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

alter table memory_items enable row level security;
alter table connections enable row level security;

drop policy if exists "Users can read their own memory" on memory_items;
create policy "Users can read their own memory" on memory_items for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own memory" on memory_items;
create policy "Users can create their own memory" on memory_items for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own memory" on memory_items;
create policy "Users can update their own memory" on memory_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read their own connections" on connections;
create policy "Users can read their own connections" on connections for select using (auth.uid() = user_id);

drop policy if exists "Users can update their own connections" on connections;
create policy "Users can update their own connections" on connections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.create_default_connections()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.connections (user_id, provider, display_name, status)
  values
    (new.id, 'calendar', 'Calendar', 'not_connected'),
    (new.id, 'email', 'Email', 'not_connected'),
    (new.id, 'tasks', 'Tasks', 'not_connected')
  on conflict (user_id, provider) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_default_connections();