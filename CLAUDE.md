# Today OS - Working Log

## Principles
- Keep scope small per phase.
- Everything production-quality enough to keep.
- SvelteKit + Bun + Supabase.

## Current Phase
Phase 1 - Local-only prototype:
- In-memory stores for todos, habits, habit logs, notes.
- Implement /today, /habits, /notes, /settings skeleton.

## Task Queue
- [x] Implement basic SvelteKit routing structure.
- [x] Build in-memory stores in src/lib/stores.
- [x] Render Today page with fake data.
- [x] Hook up Habit Log Drawer UX.
- [x] Basic notes CRUD with markdown.
- [ ] /calendar or /days view (Phase 3).

## Decisions
- 2026-04-23: Habit logs are append-only rows; totals are sums per day.
- 2026-04-23: Notes use markdown for content.

## Log
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