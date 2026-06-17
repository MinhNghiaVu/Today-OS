alter table public.todos add column if not exists today_focus boolean not null default false;
alter table public.todos add column if not exists focus_order smallint check (focus_order between 1 and 3);

create index if not exists todos_focus on public.todos (user_id, today_focus, focus_order);