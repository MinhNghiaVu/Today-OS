# Today OS — Working Log

> Authoritative handoff between sessions. Read top-to-bottom before any code. Update Task Queue + Decisions + Log + Open Questions before ending. Spec lives at `docs/today-os-spec.md`.

---

## Session Protocol (READ FIRST)

1. Read this file end-to-end + the spec section for the **Current Phase** below.
2. Pick exactly ONE task from **Task Queue** (top-down). Do not multi-task phases.
3. Propose a 3–4 step micro-plan, then execute. If a step balloons past its phase, stop and add to **Open Questions** rather than guess.
4. **Manual-action handoff:** for anything I need to do outside the editor (API keys, OAuth setup, billing, bucket config), write `docs/phase{N}-setup.md` with copy-paste-ready steps. Use MCPs to do setup yourself wherever possible — only ask me for things only I can do.
5. **Context hygiene:** at ~80% context use `/compact`; when switching tasks use `/clear`. Don't ride a stale context to the bottom.
6. **End of session:** update Task Queue, Decisions, Log, and Open Questions sections below. Run `/caveman-commit` with all session files.
7. If blocked or uncertain, log to **Open Questions** and stop. Don't guess.

---

## Principles

### Scope discipline
- Keep scope small per phase. Spec is canonical; don't drift.
- Production-quality at MVP level — "good enough to keep" — not prototype quality.
- Move to next phase only after I confirm zero bugs.

### Stack
- **SvelteKit + TypeScript (strict) + Bun + Supabase + Tailwind.** Never `npm`/`pnpm` — always `bun` (`bun install`, `bun run dev`, `bun add`).
- **One library per job.** Before adding a dep, confirm an existing one can't do the job. Pick markdown OR rich-text, not both. Pick lucide OR phosphor, not both. (We use `marked` for markdown; lucide for icons.)

### Server vs client state
- **Server state** (todos, habits, logs, notes) → SvelteKit `+page.server.ts` `load` + form `actions`. Never mirror server state into a Svelte store.
- **Client UI state** (theme, accent index, drawer open/closed) → Svelte stores in `src/lib/stores.ts`.
- Mutations go through form actions with `use:enhance` for progressive enhancement. No client-side `supabase.from(...)` calls except for auth and the export feature.
- After mutations, prefer `invalidateAll()` over reloading. Optimistic UI for low-stakes toggles (theme, accent).

### File organization
- Routes: `src/routes/{name}/+page.svelte` + `+page.server.ts`. Server-only logic stays in `+page.server.ts` or `+server.ts`.
- Reusable Svelte components: `src/lib/components/`.
- Reusable pure functions: `src/lib/utils/`. If you write the same 3+ lines twice, extract.
- Supabase query helpers: `src/lib/db.ts` (one shared module, not one per route).
- Types: `src/lib/types.ts`. Domain types only. DB row types are inferred from queries.

### Styling
- All colors live in `src/app.css` as CSS variables (`--color-*`, `--accent`, `--accent-hover`). Never raw Tailwind colors like `text-red-400` and never inline hex anywhere in components.
- Use via `style="color: var(--color-x)"` or Tailwind arbitrary values like `bg-[color:var(--accent)]`.
- Light mode = `[data-theme='light']` overrides on the same variables. Don't write a parallel set of class names.
- Spacing: more breathing room than feels necessary. The app should feel calm.

### TypeScript
- `strict: true`. No `any`, no `as unknown as Foo`. No implicit return types on exported functions.
- Domain unions (`TodoStatus`, `HabitType`) are exported from `src/lib/types.ts` and used everywhere — never re-declared inline.

### Naming
- Components: `PascalCase.svelte`. Stores: `camelCase` (`todos`, `habits`). Routes: `kebab-case` URLs.
- Booleans: `is*`, `has*`, `can*`. No abbreviations except `id`, `url`.

### Error handling
- Form actions return `fail(400, { error: '...' })` with messages the user can act on ("Couldn't save — check your connection"), not stack traces.
- Don't wrap whole components in try/catch to hide errors. Let them bubble.
- No silent catches. If you catch, surface or log.

### Performance
- Route-level code splitting via SvelteKit's default routing — don't import giant libs at the top of `+layout.svelte`.
- Don't memoize prophylactically. Measure first.
- Streaming load (`return { promise }`) for slow DB calls so the page renders fast.

### Accessibility minimums
- Every interactive element keyboard-reachable. Every icon-only button has `aria-label`. Visible focus rings.
- Color contrast AA for body text. Test both themes.

### Security
- No secrets in client code. Only `PUBLIC_*` env vars are exposed to the browser; the anon key is the only one that should be.
- RLS enforced on every table. Never `.bypassRls()` or call from a server route without `event.locals.supabase` (which carries the user's auth).
- `.env*` gitignored except `.env.example`.

### Git & commits
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`. One logical change per commit.
- Branch per phase: `phase/3-calendar`, `phase/4-google-calendar`, etc. Merge to `main` after I confirm acceptance.
- End of session: `/caveman-commit`.

### What NOT to do
- No `+page.ts` (universal load) for protected routes — always `+page.server.ts` so RLS-aware queries run server-side.
- No client-side Supabase mutations except auth flow.
- No CSS-in-JS. No styled-components. No `style=` blocks doing what utility classes can do.
- No new abstractions on top of Supabase (`Repository`, `Service`, etc.). Call `event.locals.supabase` directly in `db.ts` helpers.
- No screens that exist "for completeness" with no content. If a phase doesn't need a screen, skip it.
- No `// TODO` placeholders in committed code. Either build it or open a tracked task in the queue.

---

## Current Phase

**Phase 2 — Supabase + Auth: COMPLETE pending manual setup.** I need to follow `docs/phase2-setup.md` to wire keys, run the migration, and enable Google OAuth. After that, Phase 3 begins.

**Phase 3 — Calendar & history (next).** Spec section 5: month view + per-day breakdown (todos, habits, notes), optional simple charts for last 7/30 days.

---

## Task Queue
- [x] SvelteKit routing structure.
- [x] In-memory stores in `src/lib/stores.ts`.
- [x] Today page with fake data.
- [x] Habit Log Drawer UX.
- [x] Notes CRUD with markdown.
- [x] Settings page (theme, accent, export, clear).
- [x] Phase 2 — Supabase + Google Auth code.
- [ ] **Manual:** follow `docs/phase2-setup.md` (Supabase project, env vars, migration, OAuth) and confirm `/today` loads against real DB.
- [ ] **Phase 3 — `/calendar` route:** month grid view; click a date → per-day panel (todos due, habit totals, notes for that date). Spec §5.
- [ ] **Phase 3 — Habit charts:** 7-day and 30-day bar/line per habit on the per-day panel and/or `/habits/{id}` detail view.
- [ ] **Phase 4 — Google Calendar (read-only)** on Today + per-day. Spec §6.
- [ ] **Phase 5 — AI assistant** at `/assistant`. Spec §7.

---

## Decisions
- 2026-04-23: Habit logs are append-only rows; daily totals are `sum(value)` per (habit_id, date).
- 2026-04-23: Notes use markdown for content; render with `marked`.
- 2026-04-25: All routes use `+page.server.ts` `load` + form actions. No client-side Supabase mutations except auth.
- 2026-04-25: Stores stripped to client UI state only (settings + ACCENT_PRESETS). Server state stays on the server.
- 2026-04-25: Auto-create `users` row via Postgres trigger on first sign-in (not in app code).

---

## Open Questions

_(Add when blocked. I review between sessions.)_

- None currently.

---

## Log

### 2026-04-25 (session 4 — Phase 2)
- Installed `@supabase/supabase-js` + `@supabase/ssr`.
- `src/app.d.ts` — typed `App.Locals` (supabase, session, user) and `App.PageData`.
- `src/hooks.server.ts` — createServerClient per request, attaches user+session to locals.
- `src/routes/+layout.server.ts` — redirects unauthenticated to `/login`, loads user preferences from DB.
- `src/routes/+layout.svelte` — shows user email + logout button, initializes settings store from DB preferences.
- `src/routes/login/+page.svelte` + `+page.server.ts` — Google OAuth initiation, redirects already-authed users to `/today`.
- `src/routes/auth/callback/+server.ts` — exchanges OAuth code for session, redirects to `/today`.
- `src/routes/logout/+server.ts` — signs out, redirects to `/login`.
- `supabase/migrations/001_initial_schema.sql` — full schema: users, todos, habit_definitions, habit_logs, notes; RLS on all; trigger to auto-create user row on first sign-in.
- `src/lib/types.ts` — updated HabitLog (habit_id, value, created_at), Note (updated_at, type, date, user_id); added HabitWithTotal.
- `src/lib/stores.ts` — stripped to settings + ACCENT_PRESETS only; added init() method.
- `src/lib/db.ts` — shared Supabase query helpers: getTodos, getTodosToday, getHabits, getHabitTotalsToday, getNotes.
- All routes: `+page.server.ts` load + form actions replace in-memory stores. Pages use `use:enhance` for CRUD without reload.
- Notes page: debounced auto-save via fetch to `?/update`; `invalidateAll()` refreshes sidebar without resetting editor.
- Settings page: theme/accent use optimistic store update + server save; export fetches from Supabase client-side.
- `docs/phase2-setup.md` — step-by-step guide for user to create Supabase project, run migration, enable Google OAuth, set env vars.
- Remaining: user must follow `docs/phase2-setup.md`; 4 type errors on `PUBLIC_SUPABASE_*` disappear after `.env` created.

### 2026-04-24 (session 3)
- `settings/+page.svelte` — theme toggle, 6 accent swatches, export-all-data JSON, clear-all-data with confirm.
- `stores.ts` — added settings store, `ACCENT_PRESETS`, `clear()` on todos/habits/habitLogs/notes stores.
- `app.css` — `[data-theme='light']` CSS variable overrides.
- `layout.svelte` — reactively applies `data-theme` and `--accent` from settings store.
- Phase 1 done.

### 2026-04-24 (session 2)
- `notes/+page.svelte` — full notes CRUD: two-panel layout, auto-save, Edit/Preview tab toggle with marked, delete with confirm, relative timestamps. Added `marked@18`.

### 2026-04-24 (session 1)
- `types.ts` — Todo replaced: TodoStatus, TodoPriority, full Todo shape (title, description?, status, due_date?, priority?, note_id?, created_at, completed_at?).
- `stores.ts` — todos store: `add(title, opts?)`, `toggle` sets completed_at, `update(id, patch)`, `remove`. Added `todosToday` derived: filters today/overdue-pending, sorts pending-first then by priority.
- `todos/+page.svelte` — full management screen: filter tabs (All/Pending/Done), inline add form, todo rows with priority badges + overdue highlight, hover-reveal edit/delete, inline edit form, circular checkbox. Seed data: 4 todos.
- `today/+page.svelte` — Todos section uses `todosToday`. Updated to `todo.title`, `todo.status`. Priority dot badge. New todos auto-set `due_date` to today.
- `layout.svelte` — added Todos nav link.

### 2026-04-23 (session 0)
- Scaffolded SvelteKit project with Bun.
- Drafted Today page layout.
- Habit Log Drawer with inline log form per habit row on Today page.
- `types.ts` — Habit expanded: type, daily_goal, color, is_active. HabitType union exported.
- `stores.ts` — habits store gains `update()` + `toggleActive()`. habitTotalsToday filters inactive. habitLogs gains `remove()` + `update()`.
- `habits/+page.svelte` — full management screen: list with color dot + type badge + inactive dimming, hover-reveal action buttons, inline add/edit form (name, unit, type, goal, color picker, active toggle).
- `today/+page.svelte` — bar uses `habit.color`, `bar-warn` overrides red when max_goal exceeded, `bar-met` brightens when min_goal met.
