create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  email text not null default '',
  display_name text,
  preferences jsonb not null default '{"theme":"dark","accentIndex":0}'::jsonb,
  google_access_token text,
  google_refresh_token text,
  google_token_expiry timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'done')),
  due_date date,
  priority text check (priority in ('high', 'medium', 'low')),
  note_id uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists todos_user_due on public.todos (user_id, due_date);

create table if not exists public.habit_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  name text not null,
  unit text not null,
  type text not null check (type in ('min_goal', 'max_goal', 'info_only')),
  daily_goal numeric,
  color text not null default '#6366f1',
  icon text not null default 'target'
    check (icon in (
      'target',
      'droplets',
      'footprints',
      'tree-pine',
      'flame',
      'moon',
      'brain',
      'dumbbell',
      'heart-pulse',
      'book-open',
      'coffee',
      'utensils',
      'clock-3',
      'sun',
      'smartphone'
    )),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  habit_id uuid not null references public.habit_definitions(id) on delete cascade,
  date date not null,
  value numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists habit_logs_user_date on public.habit_logs (user_id, date);
create index if not exists habit_logs_habit_date on public.habit_logs (habit_id, date);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  type text not null default 'note' check (type in ('note', 'draft', 'list')),
  date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_updated on public.notes (user_id, updated_at desc);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  company text not null,
  role text,
  status text not null default 'pending'
    check (status in ('pending','applied','recruiter_screen','interview','offer','rejected','ghosted','dropped')),
  interview_stage text
    check (interview_stage is null or interview_stage in ('first_round','second_round','third_round','fourth_round','fifth_round')),
  job_url text,
  contact text,
  applied_date date,
  interviewer text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_created on public.jobs (user_id, created_at desc);
