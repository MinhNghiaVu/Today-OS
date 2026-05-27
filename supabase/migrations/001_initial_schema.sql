-- ============================================================
-- Today OS — Initial Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor).
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
-- Mirrors auth.users; stores display preferences.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  preferences jsonb not null default '{"theme":"dark","accentIndex":5}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: own row only" on public.users
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a user row on first sign-in.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Todos ─────────────────────────────────────────────────────
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'done')),
  due_date date,
  priority text check (priority in ('high', 'medium', 'low')),
  note_id uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.todos enable row level security;

create policy "todos: own rows only" on public.todos
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index todos_user_due on public.todos (user_id, due_date);

-- ── Habit Definitions ─────────────────────────────────────────
create table if not exists public.habit_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  unit text not null,
  type text not null check (type in ('min_goal', 'max_goal', 'info_only')),
  daily_goal numeric,
  color text not null default '#6366f1',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.habit_definitions enable row level security;

create policy "habit_definitions: own rows only" on public.habit_definitions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Habit Logs ────────────────────────────────────────────────
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  habit_id uuid not null references public.habit_definitions(id) on delete cascade,
  date date not null,
  value numeric not null,
  created_at timestamptz not null default now()
);

alter table public.habit_logs enable row level security;

create policy "habit_logs: own rows only" on public.habit_logs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index habit_logs_user_date on public.habit_logs (user_id, date);
create index habit_logs_habit_date on public.habit_logs (habit_id, date);

-- ── Notes ─────────────────────────────────────────────────────
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  type text not null default 'note' check (type in ('note', 'draft', 'list')),
  date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "notes: own rows only" on public.notes
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index notes_user_updated on public.notes (user_id, updated_at desc);
