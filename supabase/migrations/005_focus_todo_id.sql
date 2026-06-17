-- Add todo_id to focus_sessions for linking sessions to specific tasks
alter table public.focus_sessions add column if not exists todo_id uuid references public.todos(id) on delete set null;