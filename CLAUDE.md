# Today OS — Working Log

> Authoritative handoff between sessions. Read top-to-bottom before any code. Update Task Queue + Decisions + Log + Open Questions before ending. Spec lives at `docs/today-os-spec.md`. **Design system lives at `docs/design-system.md` and is canonical for every UI decision.**

---

## Session Protocol (READ FIRST)

1. Read this file end-to-end + the spec section for the **Current Phase** below + `docs/design-system.md` if the task touches UI in any way.
2. Pick exactly ONE task from **Task Queue** (top-down). Do not multi-task phases.
3. Propose a 3–4 step micro-plan, then execute. If a step balloons past its phase, stop and add to **Open Questions** rather than guess.
4. **Manual-action handoff:** for anything I need to do outside the editor (API keys, OAuth setup, billing, bucket config), write `docs/phase{N}-setup.md` with copy-paste-ready steps. Use MCPs to do setup yourself wherever possible — only ask me for things only I can do.
5. **Context hygiene:** at ~80% context use `/compact`; when switching tasks use `/clear`. Don't ride a stale context to the bottom.
6. **End of session:** update Task Queue, Decisions, Log, and Open Questions sections below. Run `/caveman-commit` with all session files.
7. If blocked or uncertain, log to **Open Questions** and stop. Don't guess.

---

## UI Work Protocol (READ BEFORE TOUCHING ANY .svelte FILE)

Any task that creates or modifies UI must follow this. No exceptions.
0. **Load the frontend-design skill before any UI task.** The skill provides judgment on patterns and aesthetics; the design system provides the specific tokens and rules. Use both.
1. **Read `docs/design-system.md` end-to-end** if you haven't this session. It's canonical. Spacing, type, colors, components, motion — all decisions are pre-made there.
2. **Audit before you fix.** When refactoring an existing screen, list every spacing, alignment, hierarchy, density, and motion issue first. Group by severity. Don't change code until the audit is in the proposed micro-plan.
3. **Pick from the system, don't invent.** Spacing values come from the scale. Colors come from `--token` references. Type from the ramp. Components from §8. If a value isn't in the system, **add it to `docs/design-system.md` + `src/app.css` in the same commit** that uses it. Never inline a one-off.
4. **Spec all four states** before shipping any screen: loading, empty, error, populated. If any is "later," it gets done now.
5. **Build static first, then animate.** Layout and hierarchy correct → then add transitions per §9 of the design system. Never animation-first.
6. **Match a reference UI.** Linear, ClickUp, Things 3, Vercel dashboard. When unsure about density or hierarchy, screenshot the closest reference and match it. When in doubt: match Linear's restraint.
7. **Reject these patterns on sight** (the most common failure modes — they're the canonical "what not to ship" list in §14):
   - Controls inside text inputs (date pickers, dropdowns, badges, submit buttons crammed into one input)
   - Monospace font outside `<code>` blocks
   - Raw Tailwind colors (`bg-red-500`, `text-gray-400`) or inline hex
   - Content hugging the top-left of the viewport with no max-width container
   - Empty screens with no empty state (no icon, no title, no CTA)
   - `transition: all`, or animations on width/height/top/left
   - Left-border accent stripes on active nav items
   - Full-page spinners as the default loading state
   - 700+ font-weight in body/UI, or `text-xs` (10px) anywhere
8. For a refactor, **Read docs/design-system.md and load the frontend-design skill.** Audit the Todos screen — list every spacing, hierarchy, density, motion, and aesthetic issue. The skill should inform what "feels right"; the design system tells you what specific values to use.

---

## Principles

### Scope discipline
- Keep scope small per phase. Spec is canonical; don't drift.
- Production-quality at MVP level — "good enough to keep" — not prototype quality.
- Move to next phase only after I confirm zero bugs.

### Stack
- **SvelteKit + TypeScript (strict) + Bun + Supabase + Tailwind.** Never `npm`/`pnpm` — always `bun` (`bun install`, `bun run dev`, `bun add`).
- **One library per job.** Before adding a dep, confirm an existing one can't do the job. Pick markdown OR rich-text, not both. Pick lucide OR phosphor, not both. (We use `marked` for markdown; lucide for icons; Inter via `@fontsource-variable/inter`.)

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

### Styling — see `docs/design-system.md`
- **Read the design system before any UI work.** It is canonical for spacing, type, color, radius, shadow, layout, components, motion, accessibility, and the "what not to do" list.
- All design tokens live in `src/app.css` as CSS variables. The CSS file and the design-system doc must agree at all times.
- Never inline a hex. Never use raw Tailwind colors (`text-red-400`, `bg-gray-800`). Never invent a one-off spacing or type value.
- Use tokens via `style="color: var(--text-primary)"` or Tailwind arbitrary values like `bg-[color:var(--surface-1)]`.
- Light mode = `[data-theme='light']` overrides on the same variables. Never a parallel set of class names.
- **Dark is the primary theme.** Design and tune for dark first; light is a recolor of the same tokens.
- New patterns require updating `docs/design-system.md` + `src/app.css` in the same commit that uses them.

### TypeScript
- `strict: true`. No `any`, no `as unknown as Foo`. No implicit return types on exported functions.
- Domain unions (`TodoStatus`, `HabitType`) are exported from `src/lib/types.ts` and used everywhere — never re-declared inline.

### Naming
- Components: `PascalCase.svelte`. Stores: `camelCase` (`todos`, `habits`). Routes: `kebab-case` URLs.
- Booleans: `is*`, `has*`, `can*`. No abbreviations except `id`, `url`.

### Error handling
- Form actions return `fail(400, { error: '...' })` with messages the user can act on ("Couldn't save — check your connection"), not stack traces.
- Surface errors inline at the relevant level (form-level for form errors, page-level for load failures). See design system §10.
- Don't wrap whole components in try/catch to hide errors. Let them bubble.
- No silent catches. If you catch, surface or log.

### Performance
- Route-level code splitting via SvelteKit's default routing — don't import giant libs at the top of `+layout.svelte`.
- Don't memoize prophylactically. Measure first.
- Streaming load (`return { promise }`) for slow DB calls so the page renders fast. Skeletons match the populated layout's row heights (design system §8.13).

### Accessibility minimums (industry baseline, non-negotiable)
- See design system §11 for the full list.
- Every interactive element keyboard-reachable. Tab order matches visual order. Esc closes overlays.
- Every icon-only button has `aria-label`. Decorative icons are `aria-hidden="true"`.
- Visible focus rings — never `outline: none` without a focus-visible replacement that's at least as visible.
- Color contrast AA. Test both themes.
- `prefers-reduced-motion` respected globally (declared once in `app.css`).
- Touch targets ≥36×36, ≥44×44 preferred for primary actions on touch.

### Security
- No secrets in client code. Only `PUBLIC_*` env vars are exposed to the browser; the anon key is the only one that should be.
- RLS enforced on every table. Never `.bypassRls()` or call from a server route without `event.locals.supabase` (which carries the user's auth).
- `.env*` gitignored except `.env.example`.

### Git & commits
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`. One logical change per commit.
- Branch per phase: `phase/3-calendar`, `phase/4-google-calendar`, etc. Merge to `main` after I confirm acceptance.
- Design-system updates and the components that use them ship in the same commit.
- End of session: `/caveman-commit`.

### What NOT to do
- No `+page.ts` (universal load) for protected routes — always `+page.server.ts` so RLS-aware queries run server-side.
- No client-side Supabase mutations except auth flow.
- No CSS-in-JS. No styled-components. No `style=` blocks doing what utility classes can do — except for `style="color: var(--token)"` patterns where Tailwind arbitrary values get noisy.
- No new abstractions on top of Supabase (`Repository`, `Service`, etc.). Call `event.locals.supabase` directly in `db.ts` helpers.
- No screens that exist "for completeness" with no content. If a phase doesn't need a screen, skip it.
- No `// TODO` placeholders in committed code. Either build it or open a tracked task in the queue.
- See design system §14 for the canonical UI "what not to do" list.

---

## Current Phase

**Phase 2 — Supabase + Auth: COMPLETE pending manual setup.** I need to follow `docs/phase2-setup.md` to wire keys, run the migration, and enable Google OAuth. After that, Phase 3 begins.

**Phase 2.5 — COMPLETE.** All screens refactored to design system: tokens, typography, motion, empty states, Toast component.

**Phase 3 — Calendar & history (next).** Spec section 5: month view + per-day breakdown (todos, habits, notes), optional simple charts for last 7/30 days. Built against the now-finalized design system.

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
- [x] **Phase 2.5 — Wire design tokens into `src/app.css`** per `docs/design-system.md` §2–§6. Add Inter via `@fontsource-variable/inter`. Add easing curves. Add `prefers-reduced-motion` block.
- [x] **Phase 2.5 — Audit & refactor Sidebar** — replace `email + sign-out button` with bottom account-block popover (design system §8.7). Active nav state via `--surface-3`, no left-border stripes.
- [x] **Phase 2.5 — Audit & refactor Todos screen** — split the input/date/priority/submit out of one box per §8.2. Add list-item enter/exit motion per §9. Container max-width + page padding per §7. All tokens + inline hex replaced. Empty state per §8.12.
- [x] **Phase 2.5 — `src/lib/components/Select.svelte`** — reusable animated dropdown (fly in/out, chevron rotation, check icon on selected, keyboard nav, hidden input for form submission). Used on Todos priority fields.
- [x] **Phase 2.5 — Audit & refactor Habits screen** — same container/padding fix; row density set to Default; New Habit button is primary `md`; empty state per §8.12.
- [x] **Phase 2.5 — Apply `Select` component to Habits screen** — replace native `<select>` for habit type on the Habits add/edit form.
- [x] **Phase 2.5 — Audit & refactor Notes screen** — Inter for note body (not mono); editor/preview as a segmented control per §8.9; selected-note crossfade per §9.
- [x] **Phase 2.5 — Audit & refactor Settings screen** — section structure per §8.8; danger button for Clear; max-width container.
- [x] **Phase 2.5 — Audit & refactor Today screen** — page header + section gaps per §7; inline log motion per §9.
- [x] **Phase 2.5 — Toast component** + global `toast()` helper per §8.14. Replace any inline error banners that should be transient.
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
- 2026-04-27: Design system at `docs/design-system.md` is canonical. Dark theme is primary. Inter is the single UI font. Accent is rose `#f43f5e` by default; the picker swaps `--accent` and recomputes the soft variants via `color-mix`.
- 2026-04-27: Phase 2.5 inserted between Phase 2 and Phase 3 — full design-system rollout across existing screens before any new feature work.

---

## Open Questions

_(Add when blocked. I review between sessions.)_

- None currently.

---

## Log

### 2026-04-29 (session 5 — Phase 2.5 completion)
- `notes/+page.svelte` — token migration; content textarea → Inter 15px/1.6 (removed mono); tab bar → segmented control (§8.9) with CSS sliding indicator and 200ms ease-out transition; `{#key selectedId}` fly transition on note switch; proper §8.12 empty states (list + editor); delete button → destructive secondary variant using `--danger`/`--danger-soft`; active item uses `--surface-3`.
- `settings/+page.svelte` — full token migration; section structure per §8.8 (border-top separators, 11px uppercase headings); theme toggle → segmented control style (`--surface-overlay` + `--shadow-sm`); export button → proper secondary; clear button → destructive secondary with `--danger`/`--danger-soft`/`color-mix` border.
- `today/+page.svelte` — full token migration; priority badges use semantic tokens (`--danger-soft`/`--warning-soft`/`--info-soft`); input focus → outline not border; todo list `fly` + `flip` animate:flip transitions; log row `fly` in/out; bar-warn uses `var(--danger)` not inline hex; input radius → `--radius-md` (8px).
- `src/lib/toast.ts` — writable store with `add()`/`dismiss()`; auto-dismiss 4s success/info, 6s error; max 3 visible.
- `src/lib/components/Toast.svelte` — bottom-right fixed; `fly={{ y: 12 }}` in / `fly={{ y: 8 }}` out; `flip` animate for stacking; icon per variant; dismiss button; `aria-live="polite"`.
- `+layout.svelte` — imported and mounted `<Toast />`.
- Phase 2.5 COMPLETE. All screens on design system tokens + motion.

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