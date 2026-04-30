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

**Phase 3 — COMPLETE** (pending manual DB setup in phase2-setup.md).

**Phase 4 — Google Calendar (read-only): COMPLETE** (pending manual setup in phase4-setup.md).

**Phase 5 — AI Assistant: COMPLETE** (pending manual setup in phase5-setup.md — just an Anthropic API key). **Note: AI assistant is temporarily disabled** — Anthropic imports commented out in `src/routes/api/chat/+server.ts`, nav item commented out in layout. Re-enable when API key is ready.

**Phase 6 — Job Board: COMPLETE** (pending manual DB migration per `docs/phase6-setup.md` when written). All four sub-phases done: DB migration, server route, page UI, nav item.

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
- [x] **Phase 3 — `/calendar` route:** month grid view; click a date → per-day panel (todos due, habit totals, notes for that date). Spec §5.
- [x] **Phase 3 — Habit charts:** 7-day and 30-day bar/line per habit on `/habits/{id}` detail view.
- [x] **Phase 4 — Google Calendar (read-only)** on Today + per-day. Spec §6.
- [x] **Phase 5 — AI assistant** at `/assistant`. Spec §7.
- [ ] **Manual:** follow `docs/phase5-setup.md` (Anthropic API key) and verify streaming chat works.
- [x] **Phase 6.1 — DB migration** — `supabase/migrations/003_jobs.sql`; types in `src/lib/types.ts`; query helper `getJobs` in `src/lib/db.ts`. See Phase 6 spec below.
- [x] **Phase 6.2 — Server route** — `src/routes/jobs/+page.server.ts`: load + `add` / `update` / `remove` actions. See Phase 6 spec below.
- [x] **Phase 6.3 — Page UI** — `src/routes/jobs/+page.svelte`: table layout, add-row form, inline edit, status badge quick-update, empty state. Read Phase 6 UI spec before writing a single line. See Phase 6 spec below.
- [x] **Phase 6.4 — Nav + cleanup** — add Briefcase nav item to layout; write `docs/phase6-setup.md` with migration SQL; update CLAUDE.md log.
- [x] **Manual:** run `supabase/migrations/003_jobs.sql` against real Supabase (paste into dashboard SQL editor or `supabase db push`).

---

## Phase 6 — Job Board Spec

> Read this entire section before touching any Phase 6 file. It is the authoritative UI + data contract.

### Purpose
`/jobs` — a personal job-targeting board. Track companies you want to work at, the application status, interview progress, and notes. Airtable-inspired table density; design system tokens for everything.

---

### Data model

**Migration file:** `supabase/migrations/003_jobs.sql` (next after `002_google_tokens.sql`)

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, `gen_random_uuid()` |
| `user_id` | uuid NOT NULL | FK → `users(id)` ON DELETE CASCADE |
| `company` | text NOT NULL | — |
| `role` | text | nullable |
| `status` | text NOT NULL DEFAULT `'pending'` | CHECK: see status values below |
| `interview_stage` | text | nullable, CHECK: see stage values below |
| `job_url` | text | nullable |
| `contact` | text | nullable (recruiter / referral name) |
| `applied_date` | date | nullable |
| `interviewer` | text | nullable |
| `notes` | text | nullable, freeform |
| `created_at` | timestamptz NOT NULL | DEFAULT now() |
| `updated_at` | timestamptz NOT NULL | DEFAULT now() |

**RLS:** same pattern as all other tables — `FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`.

**Index:** `CREATE INDEX jobs_user_created ON public.jobs (user_id, created_at DESC);`

---

### Status values + badge colors

These are the only valid `status` values (CHECK constraint). Color mapping uses existing design tokens — no new tokens needed.

| Value | Label | Badge bg | Badge fg |
|---|---|---|---|
| `pending` | Pending | `var(--surface-3)` | `var(--text-secondary)` |
| `applied` | Applied | `var(--warning-soft)` | `var(--warning)` |
| `recruiter_screen` | Recruiter Screen | `var(--info-soft)` | `var(--info)` |
| `interview` | Interview | `var(--accent-soft)` | `var(--accent)` |
| `offer` | Offer | `var(--success-soft)` | `var(--success)` |
| `rejected` | Rejected | `var(--danger-soft)` | `var(--danger)` |
| `ghosted` | Ghosted | `var(--danger-soft)` | `var(--danger)` |
| `dropped` | Dropped | `var(--surface-3)` | `var(--text-tertiary)` |

All badges: `border-radius: var(--radius-full)`, `padding: 2px 8px`, `font-size: 12px`, `font-weight: 500`, `white-space: nowrap`.

---

### Interview stage values

`interview_stage` is nullable. Only meaningful when `status` is `interview` or `offer`. Show `—` when null.

| Value | Label |
|---|---|
| `first_round` | First Round |
| `second_round` | Second Round |
| `third_round` | Third Round |
| `fourth_round` | Fourth Round |
| `fifth_round` | Fifth Round |

Stage shown as a neutral pill: `background: var(--surface-2)`, `color: var(--text-secondary)`, same sizing as status badge.

---

### TypeScript types (append to `src/lib/types.ts`)

```typescript
export type JobStatus =
  | 'pending' | 'applied' | 'recruiter_screen' | 'interview'
  | 'offer' | 'rejected' | 'ghosted' | 'dropped';

export type JobInterviewStage =
  | 'first_round' | 'second_round' | 'third_round' | 'fourth_round' | 'fifth_round';

export interface Job {
  id: string;
  user_id: string;
  company: string;
  role: string | null;
  status: JobStatus;
  interview_stage: JobInterviewStage | null;
  job_url: string | null;
  contact: string | null;
  applied_date: string | null;
  interviewer: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

---

### Query helper (append to `src/lib/db.ts`)

```typescript
export async function getJobs(sb: SupabaseClient, userId: string): Promise<Job[]> {
  const { data, error } = await sb
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

---

### Server route: `src/routes/jobs/+page.server.ts`

Three actions: `add`, `update`, `remove`.

- `add`: requires `company` (trim, non-empty), optional `role`. Inserts with `status: 'pending'`.
- `update`: accepts `id` + any subset of all columns. Loops over known field names, includes only those present in FormData. Always sets `updated_at: new Date().toISOString()`. Used for both full-edit saves and quick status-badge changes (same action, different fields sent).
- `remove`: requires `id`. Deletes with `.eq('user_id', user.id)` guard.

All actions: auth-check first (`fail(401)`), validate required fields (`fail(400)`), DB error → `fail(500, { error: error.message })`.

---

### Page UI: `src/routes/jobs/+page.svelte`

#### Layout container
`max-w-7xl` container (matches `/calendar`), `32px 24–40px` responsive page padding. Full-width table inside.

#### Page header
```
[h1: Jobs]  [badge: N companies]          [btn-primary sm: + Add]
```
- `h1`: 26px, weight 600, `--text-primary`, letter-spacing -0.01em
- Badge: same pattern as Todos total-badge — `--surface-3` bg, `--text-secondary` fg, 12px, `--radius-full`
- `+ Add` button: primary `sm` variant, right-aligned. Clicking sets `addingNew = true`.

#### Add row form (shown when `addingNew`)
Appears between header and table, slides in with `fly={{ y: -8, duration: 180 }}`. Single-line form:
```
[input: Company*]  [input: Role]  [btn-primary: Add]  [btn-ghost: Cancel]
```
- Company input: autofocus, required, placeholder "Company name"
- Role input: optional, placeholder "Role / title"
- Submit inserts row, collapses form (`addingNew = false`) on success
- Cancel sets `addingNew = false`
- Uses `use:enhance` — on `result.type === 'success'` collapse form

#### Table structure
`<table>` with `width: 100%`, `border-collapse: collapse`. Wrapped in a `<div class="table-shell">` with `background: var(--surface-1)`, `border: 1px solid var(--border-subtle)`, `border-radius: var(--radius-xl)`, `overflow: hidden`.

**Column order and approximate widths:**

| # | Column | Width | Notes |
|---|---|---|---|
| 1 | Company | 18% | Bold, `--text-primary`, 14px |
| 2 | Role | 18% | Regular, `--text-secondary`, 13px |
| 3 | Status | 14% | Color badge pill (clickable — see below) |
| 4 | Stage | 12% | Neutral pill or `—` |
| 5 | Applied | 10% | Date string `--text-secondary` 13px, or `—` |
| 6 | Contact | 10% | `--text-secondary` 13px, or `—` |
| 7 | Notes | remaining | Truncated 1 line, `--text-tertiary` 13px |
| 8 | Actions | 36px | Delete button, hover-reveal |

**`<thead>`:**
- `<th>` cells: 11px, uppercase, letter-spacing 0.05em, `--text-tertiary`, font-weight 500, `padding: 10px 12px`, `border-bottom: 1px solid var(--border-subtle)`, `text-align: left`
- `background: var(--surface-1)` (sticky optional)

**`<tbody tr>` (normal row):**
- Height: `min-height: 48px` (via padding `12px 0`)
- `border-bottom: 1px solid var(--border-subtle)` (last row: none)
- `cursor: pointer`
- `transition: background-color 120ms cubic-bezier(0.22, 1, 0.36, 1)`
- Hover: `background: var(--surface-2)`
- `<td>` padding: `10px 12px`
- Clicking a row sets `editingId = job.id` — EXCEPT clicks on the status badge or delete button (those `stopPropagation()`)

**Delete button (column 8):**
- `opacity: 0` by default; `opacity: 1` on `tr:hover`
- `transition: opacity 120ms`
- Icon-only, `aria-label="Delete {job.company}"`
- Danger style: `color: var(--danger)`, hover `background: var(--danger-soft)`
- 28×28px, `border-radius: var(--radius-sm)`
- Submits `?/remove` action via `use:enhance`

#### Status badge — quick update interaction
The status badge in each row is **not just display** — it's an interactive dropdown. Behavior:
1. Click badge → `stopPropagation()` (don't open row edit)
2. Opens a `Select.svelte` dropdown (reuse existing component) positioned inline
3. On selection, immediately submits `?/update` with `{ id, status: newValue }` via `requestSubmit()` on a hidden form
4. No full-edit form needed for status changes
5. `Select` options array: all 8 status values with their labels

This is the most-used action — make it feel instant. Use `use:enhance` so no page reload.

#### Inline edit row (expands below clicked row)
When `editingId === job.id`, render an additional `<tr class="edit-row">` immediately after that job's normal row:
- `<td colspan="8">` containing a full edit form
- `background: var(--surface-2)`, `border-bottom: 1px solid var(--border-subtle)`
- Normal row above gets `background: var(--surface-2)` (selected state, no hover needed)
- Animate in: `fly={{ y: -4, duration: 180, easing: cubicOut }}`

**Edit form layout — 2-column CSS grid:**
```
[Company*]        [Role]
[Status Select]   [Stage Select]
[Job URL]         [Contact]
[Applied Date]    [Interviewer]
[Notes — full width, textarea, 3 rows]
[Save btn] [Cancel btn]  (right-aligned)
```

- All inputs: design system field style — `background: var(--surface-3)`, `border: 1px solid var(--border-default)`, `border-radius: var(--radius-md)`, `height: 36px`, `padding: 0 10px`, `font-size: 14px`, `color: var(--text-primary)`, focus outline `2px solid var(--border-focus)`
- Status + Stage use `Select.svelte` component
- Notes `<textarea>`: `height: auto`, `rows={3}`, `resize: vertical`, `padding: 8px 10px`
- Hidden `<input type="hidden" name="id" value={job.id} />`
- On save success: `editingId = null`
- Cancel: `editingId = null` immediately (no server call)
- Uses `use:enhance` with custom callback to collapse on success

**Stage Select options** (include blank option first):
```typescript
const stageOpts = [
  { value: '', label: '—' },
  { value: 'first_round', label: 'First Round' },
  { value: 'second_round', label: 'Second Round' },
  { value: 'third_round', label: 'Third Round' },
  { value: 'fourth_round', label: 'Fourth Round' },
  { value: 'fifth_round', label: 'Fifth Round' },
];
```

#### Empty state
Shown when `jobs.length === 0`. Centered inside the table-shell (not a separate element — render as a single `<tr>` with `<td colspan="8">`):
```
[Briefcase icon, 40px, --text-tertiary]
[h2: No companies targeted yet]
[p: Add your first target with the + button above.]
```
- Padding: `64px 24px`
- Title: 17px, weight 600, `--text-primary`
- Description: 14px, `--text-secondary`, max-width 280px

#### Animations
- New row added: `fly={{ y: -8, duration: 220, easing: cubicOut }}` in, no out animation needed (list re-renders from server)
- Edit row: `fly={{ y: -4, duration: 180, easing: cubicOut }}` in, `fly={{ y: -4, duration: 140, easing: cubicIn }}` out
- Add form: `fly={{ y: -8, duration: 180, easing: cubicOut }}` in/out
- Do NOT use `animate:flip` on table rows — flip doesn't work correctly with `<tr>` elements

#### Error handling
- Form action errors → `$page.form?.error` → call `toast(error, 'error')` in `$effect` / reactive statement
- No inline error banners inside the table

#### States checklist (all four required before shipping)
1. **Loading** — SSR handles this; data loads before render. No spinner needed.
2. **Empty** — Briefcase icon + title + description inside table-shell (see above).
3. **Error** — `fail()` from action → toast via `$page.form?.error`.
4. **Populated** — Full table with all columns.

---

### Nav item
Add to `src/routes/+layout.svelte` between Calendar and Settings:
```svelte
import { ..., Briefcase } from 'lucide-svelte';
// nav array:
{ href: '/jobs', label: 'Jobs', icon: Briefcase },
```

---

### Phase 6 anti-patterns (do not ship these)
- Status badge as plain text with no interaction — it must be a clickable quick-update control
- Opening full edit form just to change status — status badge handles that inline
- Using `animate:flip` on `<tr>` elements — breaks layout
- `interview_stage` shown when status is `pending` or `applied` — stage only meaningful from `recruiter_screen` onward; hide/grey it otherwise
- `updated_at` not set on update — always include it in the update patch
- Raw Tailwind color classes for status badges — every color via `var(--token)`
- Mixing the status badge click handler and the row click handler without `stopPropagation()` — they must be independent
- Textarea inside a `<td>` without `resize: vertical` — horizontal resize breaks table layout

---

## Decisions
- 2026-04-23: Habit logs are append-only rows; daily totals are `sum(value)` per (habit_id, date).
- 2026-04-23: Notes use markdown for content; render with `marked`.
- 2026-04-25: All routes use `+page.server.ts` `load` + form actions. No client-side Supabase mutations except auth.
- 2026-04-25: Stores stripped to client UI state only (settings + ACCENT_PRESETS). Server state stays on the server.
- 2026-04-25: Auto-create `users` row via Postgres trigger on first sign-in (not in app code).
- 2026-04-27: Design system at `docs/design-system.md` is canonical. Dark theme is primary. Inter is the single UI font. Accent is rose `#f43f5e` by default; the picker swaps `--accent` and recomputes the soft variants via `color-mix`.
- 2026-04-27: Phase 2.5 inserted between Phase 2 and Phase 3 — full design-system rollout across existing screens before any new feature work.
- 2026-04-30: AI assistant (`/assistant`) temporarily disabled — Anthropic SDK calls commented out, nav item commented out. Re-enable by uncommenting `src/routes/api/chat/+server.ts` imports and the layout nav entry, then adding `ANTHROPIC_API_KEY` to `.env`.
- 2026-04-30: Job board (`/jobs`) data model decided — `jobs` table with 8 status values + 5 interview stage values as CHECK-constrained text columns. Status badge doubles as quick-update control (inline Select, no full-edit needed for status changes). Single `update` action handles both full-edit saves and status-badge quick-changes by only patching fields present in FormData. Table UI (not cards) — `<table>` with `max-w-7xl` container, 8 columns, inline edit row expands below clicked row. Reference: Airtable density, design system tokens.

---

## Open Questions

_(Add when blocked. I review between sessions.)_

- None currently.

---

## Log

### 2026-04-30 (session 12 — Phase 6.3 + 6.4)
- `src/routes/jobs/+page.svelte` — full table UI per spec: `max-w-7xl` container; page header with count badge + `+ Add` button; add-row form with `fly` transition; `table-shell` wrapper (surface-1, border, radius-xl, overflow-hidden); 8-column `<table>` (Company, Role, Status, Stage, Applied, Contact, Notes, Actions); status badge as styled Select.svelte trigger (`:global()` CSS overrides per status value — pending/applied/recruiter_screen/interview/offer/rejected/ghosted/dropped); status quick-update via per-row `<form bind:this>` + `requestSubmit()` after `tick()`; stage neutral pill shown only when status is `recruiter_screen` or later; delete button hover-reveal (opacity 0→1 on row hover); inline edit row (`<tr class="edit-row">` with `colspan=8`, `fly` in/out, 2-col CSS grid form with all fields, Select for status + stage, save/cancel); empty state inside table as `<tr>` with Briefcase icon; `$page.form?.error` → `toast(..., 'error')`; all design system tokens throughout.
- `src/routes/+layout.svelte` — added `Briefcase` import + `{ href: '/jobs', label: 'Jobs', icon: Briefcase }` nav item between Calendar and Settings.
- Phase 6.3 + 6.4 COMPLETE. Phase 6 fully done. Next: manual DB migration (run `supabase/migrations/003_jobs.sql`).

### 2026-04-30 (session 11 — Phase 6.2)
- `src/routes/jobs/+page.server.ts` — `load` (auth-gated, calls `getJobs`); `add` action (requires `company`, optional `role`, inserts `status: 'pending'`); `update` action (patches only FormData-present fields from `JOB_FIELDS` constant + always sets `updated_at`, validates company non-empty if present); `remove` action (`.eq('user_id')` guard). All actions: 401 → not authed, 400 → validation, 500 → DB error.
- Phase 6.2 COMPLETE. Next: Phase 6.3 — page UI.

### 2026-04-30 (session 10 — Phase 6.1)
- `supabase/migrations/003_jobs.sql` — `jobs` table with all columns; CHECK constraints on `status` (8 values) and `interview_stage` (5 values); RLS policy `users manage own jobs`; index `jobs_user_created`.
- `src/lib/types.ts` — appended `JobStatus`, `JobInterviewStage`, `Job` types per spec.
- `src/lib/db.ts` — added `Job` to import; appended `getJobs` query helper (ordered by `created_at DESC`).
- Phase 6.1 COMPLETE. Next: Phase 6.2 — server route with `load` + `add`/`update`/`remove` actions.

### 2026-04-30 (session 9 — Phase 6 planning)
- `src/routes/api/chat/+server.ts` — Anthropic SDK imports commented out; POST handler returns 503. AI assistant disabled until API key available.
- `src/routes/+layout.svelte` — Bot import + Assistant nav item commented out.
- `docs/plan-phase6-jobs.md` — full Phase 6 implementation plan written (4 phases, DB schema, server actions, UI spec, anti-patterns, verification checklist).
- `CLAUDE.md` — Phase 6 spec section added (data model, status + stage values + badge color table, TypeScript types, query helper, server actions contract, full UI spec: table layout, column widths, add-row form, status badge quick-update interaction, inline edit row, edit form grid, empty state, animations, error handling, 4-state checklist, anti-patterns). Task Queue updated with Phase 6.1–6.4 tasks. Decisions updated.

### 2026-04-29 (session 8 — Phase 5)
- `bun add @anthropic-ai/sdk@0.91.1` — Anthropic SDK installed.
- `src/routes/api/chat/+server.ts` — auth-gated POST endpoint; pulls `getHabitTotalsToday`, `getTodosToday`, `getNotes` from Supabase; builds a system prompt with today's context; streams Claude Haiku response via `ReadableStream`.
- `src/routes/assistant/+page.server.ts` — minimal load with auth guard.
- `src/routes/assistant/+page.svelte` — chat UI: empty state (Bot icon + 5 example question chips), message list (user right/accent, assistant left/surface-2), streaming cursor animation, textarea input with Enter-to-send and Shift+Enter for newline, send button (accent, disabled when empty or loading, spinner while streaming), error toast on failure. Design system tokens throughout, `max-w-3xl`, all 4 states.
- `src/routes/+layout.svelte` — added `Bot` icon import + "Assistant" nav item between Calendar and Settings.
- `.env.example` — added `ANTHROPIC_API_KEY` placeholder.
- `docs/phase5-setup.md` — setup guide: get Anthropic API key, add to `.env`, verify.
- Phase 5 COMPLETE (pending manual setup per `docs/phase5-setup.md`).

### 2026-04-29 (session 7 — Phase 4)
- `supabase/migrations/002_google_tokens.sql` — adds `google_access_token`, `google_refresh_token`, `google_token_expiry` columns to `users` table.
- `src/routes/login/+page.server.ts` — OAuth sign-in now requests `calendar.readonly` scope with `access_type: offline` + `prompt: consent` to obtain refresh token.
- `src/routes/auth/callback/+server.ts` — after code exchange, stores `provider_token` + `provider_refresh_token` + 55-min expiry in `users` table.
- `src/routes/auth/connect-calendar/+server.ts` — new GET route; re-initiates OAuth with calendar scope for already-authed users (used by "Connect"/"Reconnect" buttons).
- `src/lib/google-calendar.ts` — `CalendarEvent` type, `getEventsForDate(token, date)` fetches primary calendar events (throws `TOKEN_EXPIRED` on 401), `formatEventTime()` utility.
- `src/routes/today/+page.server.ts` — loads `google_access_token`/`google_token_expiry` from DB; derives `calendarState` (`ok`/`disconnected`/`expired`); streams `calendarEvents` Promise so Today page renders without blocking on Calendar API.
- `src/routes/today/+page.svelte` — new "Schedule" section (above Todos): shows event list with time + title + location, or connect/reconnect prompt, using `{#await}` for streamed events.
- `src/routes/calendar/+page.server.ts` — loads GC token; adds `gcEvents: CalendarEvent[]` to `dayData` when date selected; adds `gcConnected` boolean to page data.
- `src/routes/calendar/+page.svelte` — day panel gains "Schedule" section (first, above Todos) showing GC events or a connect link.
- `docs/phase4-setup.md` — setup guide: enable Calendar API in GCP, add scope in Supabase Auth, re-authenticate; notes on token expiry, timezone limitation, primary-calendar-only.
- Also committed: theme flash-prevention (inline cookie script in `app.html` + cookie write in layout), and `max-width` removal on Habits/Settings/Todos pages.
- Phase 4 COMPLETE (pending manual setup per `docs/phase4-setup.md`).

### 2026-04-29 (session 6 — Phase 3)
- `src/lib/db.ts` — added `getTodosForDate`, `getHabitTotalsForDate`, `getNotesForDate`, `getCalendarMonthActivity` (returns `DayActivity[]` with dot indicators per day), `getHabitLogsForRange` (returns `HabitDailyTotal[]` for chart range), exported `DayActivity` and `HabitDailyTotal` types.
- `src/routes/calendar/+page.server.ts` — load with `?year=`, `?month=`, `?date=` params; fetches month activity + per-day todos/habits/notes when date selected.
- `src/routes/calendar/+page.svelte` — month grid (7-col, activity dots for todos/habits/notes), today highlight, selected-date highlight, per-day panel slides in with `fly` transition; panel shows todos (with status/priority), habit bars (with progress bar + goal line), notes (links to `/notes?id=`). All 4 states. Design system tokens throughout. `max-w-7xl` container per §7.
- `src/routes/+layout.svelte` — added Calendar nav item with `CalendarDays` icon.
- `src/lib/components/HabitChart.svelte` — pure SVG bar chart; goal dashed line; bar color follows habit type (green when min_goal met, red when max_goal exceeded); x-axis labels thin out for 30d range.
- `src/routes/habits/[id]/+page.server.ts` — loads habit + 7d + 30d log arrays.
- `src/routes/habits/[id]/+page.svelte` — detail view: stat cards (total, avg, days with logs), 7d/30d toggle with `fly` transition between ranges, `HabitChart`, best-day callout.
- `src/routes/habits/+page.svelte` — added chart-link button per row → `/habits/{id}`.
- Phase 3 COMPLETE (pending real DB — requires phase2-setup.md first).

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