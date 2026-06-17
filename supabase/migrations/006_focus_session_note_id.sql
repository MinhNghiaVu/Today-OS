-- Link focus_sessions to notes table for searchable focus notes
alter table public.focus_sessions add column if not exists note_id uuid references public.notes(id) on delete set null;