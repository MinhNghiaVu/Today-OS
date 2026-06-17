create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  duration_seconds int not null,
  type text not null check (type in ('focus', 'break')),
  completed_at timestamptz not null default now()
);

create index if not exists focus_sessions_user_date on public.focus_sessions (user_id, completed_at desc);