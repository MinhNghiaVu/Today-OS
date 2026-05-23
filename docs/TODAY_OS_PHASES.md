# Today OS Phases

This is the phase/status handoff for Today OS. Keep root `AGENTS.md` and `CLAUDE.md` short; put any future phase breakdowns here or in a focused `docs/{FEATURE}_PHASES.md` file.

## Current Next Task

No active implementation phase. Phase work through Phase 6 is complete.

Known manual setup remains:

- Follow `docs/phase2-setup.md` for Supabase project keys, DB migrations, and Google OAuth.
- Follow `docs/phase4-setup.md` for Google Calendar read-only integration.
- Follow `docs/phase5-setup.md` when the Anthropic assistant should be re-enabled.
- Follow `docs/phase6-setup.md` for the jobs table migration if the target Supabase project has not run it yet.

Work one phase at a time if a new phase is added. Do not expand into later phases unless the user explicitly asks.

## Phase Status

- [x] **Phase 1 — SvelteKit routing, in-memory stores, Today page, habit drawer, notes, and settings**
- [x] **Phase 2 — Supabase + Google Auth code**
- [x] **Phase 2.5 — Design-system rollout across existing screens**
- [x] **Phase 3 — Calendar route + habit charts**
- [x] **Phase 4 — Google Calendar read-only**
- [x] **Phase 5 — AI Assistant** — currently disabled until API key setup.
- [x] **Phase 6 — Job Board**
- [x] **Polish pass — Load performance, first-paint theme, and responsive shell**

## Phase Notes

### Phase 2 — Supabase + Auth

Status: complete, with manual setup documented.

Expected manual doc:

- `docs/phase2-setup.md`

Important behavior:

- Auth/session work now uses Neon Auth through the SvelteKit auth proxy.
- User-owned data is keyed by the Neon Auth user id.
- Server routes use `event.locals.supabase` as a Neon-backed compatibility client.

### Phase 2.5 — Design-System Rollout

Status: complete.

Purpose: align core screens with `docs/design-system.md`.

Important behavior:

- Tokens live in `src/app.css`.
- `docs/design-system.md` and `src/app.css` must stay aligned.
- Dark mode is primary and should use warm layered surfaces, not pure black.

### Phase 3 — Calendar + Habit Charts

Status: complete.

Expected behavior:

- `/calendar` shows a month grid and a per-day panel.
- Habit detail pages show 7-day and 30-day trends.

### Phase 4 — Google Calendar

Status: complete, with manual setup documented.

Expected manual doc:

- `docs/phase4-setup.md`

Important behavior:

- Calendar is read-only.
- Slow Google Calendar fetches should not block perceived first paint.

### Phase 5 — AI Assistant

Status: complete but disabled.

Expected manual doc:

- `docs/phase5-setup.md`

Important behavior:

- Assistant nav is disabled until `ANTHROPIC_API_KEY` is ready.
- `src/routes/api/chat/+server.ts` should stay as an auth-gated disabled stub until re-enabled deliberately.

### Phase 6 — Job Board

Status: complete.

Expected docs:

- `docs/plan-phase6-jobs.md`
- `docs/phase6-setup.md`

Expected behavior:

- `/jobs` is table-first, not card-first.
- Add row form is inline.
- Row click opens inline edit.
- Status badge is a quick-update dropdown.
- Jobs schema now lives in `neon/migrations/001_today_os_schema.sql` with the rest of the Neon schema.

### Polish Pass — Performance + First Paint

Status: complete.

Important behavior:

- First-paint theme is applied in `src/app.html` before hydration.
- Theme/accent persistence uses localStorage and cookies.
- Logged-out auth path should stay fast.
- Normal app requests should not run schema bootstrap or repeated user upserts; migrations own schema setup.
- Today and Todos task interactions are optimistic: visible rows update immediately, then reconcile through SvelteKit form actions and roll back on failure.
- Today and Todos share `src/lib/components/TodoList.svelte` for todo UI/state, with shared helpers in `src/lib/utils/todos.ts` and shared server actions in `src/lib/server/todo-actions.ts`.
- Today habit logs and quick notes also update optimistically so daily logging feels instant while the backend remains the durable sync target.
