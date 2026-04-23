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
- [ ] Implement basic SvelteKit routing structure.
- [ ] Build in-memory stores in src/lib/stores.
- [ ] Render Today page with fake data.
- [ ] Hook up Habit Log Drawer UX.
- [ ] Basic notes CRUD with markdown.

## Decisions
- 2026-04-23: Habit logs are append-only rows; totals are sums per day.
- 2026-04-23: Notes use markdown for content.

## Log
2026-04-23
- Scaffolded SvelteKit project with Bun.
- Drafted Today page layout.
