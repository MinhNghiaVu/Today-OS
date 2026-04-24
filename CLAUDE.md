# Today OS - Working Log

## Principles
- Keep scope small per phase.
- Everything production-quality enough to keep.
- SvelteKit + Bun + Supabase.

## Current Phase
Phase 2 - Supabase + Auth (complete — wiring keys):
- All routes now use +page.server.ts load + form actions.
- Google OAuth via Supabase; RLS enforced on all tables.
- See docs/phase2-setup.md for manual steps (keys, migration, Google OAuth).

## Task Queue
- [x] Implement basic SvelteKit routing structure.
- [x] Build in-memory stores in src/lib/stores.
- [x] Render Today page with fake data.
- [x] Hook up Habit Log Drawer UX.
- [x] Basic notes CRUD with markdown.
- [x] Settings page (theme, accent, export, clear).
- [x] Supabase + Google Auth (Phase 2) — needs env keys + migration run.
- [ ] /calendar or /days view (Phase 3).

## Decisions
- 2026-04-23: Habit logs are append-only rows; totals are sums per day.
- 2026-04-23: Notes use markdown for content.

## Log
2026-04-25 (session 4 — Phase 2)
- Installed @supabase/supabase-js + @supabase/ssr.
- src/app.d.ts — typed App.Locals (supabase, session, user) and App.PageData.
- src/hooks.server.ts — createServerClient per request, attaches user+session to locals.
- src/routes/+layout.server.ts — redirects unauthenticated to /login, loads user preferences from DB.
- src/routes/+layout.svelte — shows user email + logout button, initializes settings store from DB preferences.
- src/routes/login/+page.svelte + +page.server.ts — Google OAuth initiation, redirects already-authed users to /today.
- src/routes/auth/callback/+server.ts — exchanges OAuth code for session, redirects to /today.
- src/routes/logout/+server.ts — signs out, redirects to /login.
- supabase/migrations/001_initial_schema.sql — full schema: users, todos, habit_definitions, habit_logs, notes; RLS on all; trigger to auto-create user row on first sign-in.
- src/lib/types.ts — updated HabitLog (habit_id, value, created_at), Note (updated_at, type, date, user_id); added HabitWithTotal.
- src/lib/stores.ts — stripped to settings + ACCENT_PRESETS only; added init() method.
- src/lib/db.ts — shared Supabase query helpers: getTodos, getTodosToday, getHabits, getHabitTotalsToday, getNotes.
- All routes: +page.server.ts load + form actions replace in-memory stores. Pages use use:enhance for CRUD without reload.
- Notes page: debounced auto-save via fetch to ?/update; invalidateAll() refreshes sidebar without resetting editor.
- Settings page: theme/accent use optimistic store update + server save; export fetches from Supabase client-side.
- docs/phase2-setup.md — step-by-step guide for user to create Supabase project, run migration, enable Google OAuth, set env vars.
- Remaining: user must follow docs/phase2-setup.md; 4 type errors on PUBLIC_SUPABASE_* disappear after .env created.

2026-04-24 (session 3)
- settings/+page.svelte — Full settings page: dark/light theme toggle, 6 accent color swatches, export-all-data as JSON download, clear-all-data with confirm.
- stores.ts — Added settings store (theme, accentIndex), ACCENT_PRESETS constant, clear() on todos/habits/habitLogs/notes stores.
- app.css — Added [data-theme='light'] CSS variable overrides.
- layout.svelte — Reactively applies data-theme attribute and --accent/--accent-hover CSS vars from settings store.
- Finished Phase 1 — settings page now has theme toggle, accent colors, data export, and clear. Next step is Phase 2: Supabase persistence.

2026-04-24 (session 2)
- notes/+page.svelte — Full notes CRUD: two-panel layout (sidebar list + editor), auto-save on input, Edit/Preview tab toggle with marked markdown rendering, delete with confirm, relative timestamps. Added marked@18 dep.

2026-04-24
- types.ts — Todo replaced: TodoStatus ('pending'|'done'), TodoPriority ('high'|'medium'|'low'), full Todo shape (title, description?, status, due_date?, priority?, note_id?, created_at, completed_at?).
- stores.ts — todos store: add(title, opts?), toggle sets completed_at, update(id, patch), remove. Added todosToday derived: filters due today or overdue-pending, sorts pending-first then by priority rank.
- todos/+page.svelte — New full management screen: filter tabs (All/Pending/Done with counts), inline add form (title + date + priority), todo rows with priority badges + overdue date highlight, hover-reveal edit/delete actions, inline edit form (title, description, due_date, priority), circular checkbox. Seed data: 4 todos with varying priority/status.
- today/+page.svelte — Todos section uses todosToday derived store (today + overdue only). Updated to todo.title, todo.status. Priority dot badge (H/M/L) shown per row. New todos auto-set due_date to today.
- layout.svelte — Added Todos nav link.

2026-04-23
- Scaffolded SvelteKit project with Bun.
- Drafted Today page layout.
- Building Today OS habit log drawer. Added inline log form per habit row on Today page — hover the + button to enter an amount. Next: wire up the Habits management page. (disable recaps in /config)  

- types.ts — Habit expanded: type: HabitType, daily_goal: number | null, color: string, is_active: boolean. HabitType union exported.
- stores.ts — habits store gains update() + toggleActive(). Seed data upgraded to full shape. habitTotalsToday now filters inactive habits. habitLogs gains remove() + update().
- habits/+page.svelte — Full management screen: list with color dot + type badge + inactive dimming, hover-reveal action buttons (edit/activate/delete), inline add/edit form with all fields (name, unit, type, goal, color picker, active toggle). Delete confirms via confirm().
- today/+page.svelte — Bar uses habit.color, bar-warn overrides red when max_goal exceeded, bar-met brightens when min_goal met. Count line shows total / goal or just total for info_only.