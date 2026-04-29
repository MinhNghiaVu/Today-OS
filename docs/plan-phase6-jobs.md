# Phase 6 — Job Board Plan

## Feature summary
`/jobs` route: Airtable-style table for tracking job applications. Add rows with a `+` button. Each row is a company target with status, interview stage, and metadata. Inline editing on row click. Design system tokens throughout.

---

## Data model

### Fields per job
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `user_id` | uuid | FK → users(id), RLS key |
| `company` | text NOT NULL | |
| `role` | text | job title/position |
| `status` | text | CHECK constraint, see below |
| `interview_stage` | text | nullable, CHECK constraint |
| `job_url` | text | nullable |
| `contact` | text | nullable, recruiter/referral name |
| `applied_date` | date | nullable |
| `interviewer` | text | nullable |
| `notes` | text | nullable, freeform |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

### Status values (with badge colors)
- `pending` → `--text-tertiary` / `--surface-2` (neutral, default)
- `applied` → `--warning` / `--warning-soft`
- `recruiter_screen` → `--info` / `--info-soft`
- `interview` → `--accent` / `--accent-soft`
- `offer` → `--success` / `--success-soft`
- `rejected` → `--danger` / `--danger-soft`
- `ghosted` → `--danger` / `--danger-soft` (muted variant)
- `dropped` → `--text-tertiary` / `--surface-2`

### Interview stage values
`first_round` | `second_round` | `third_round` | `fourth_round` | `fifth_round` (all nullable — only show when status is `interview` or later)

---

## UI design

**Layout:** Full-width table inside `max-w-7xl` container with `32px 24–40px` page padding (matches calendar pattern).

**Table structure (columns in order):**
1. Company (primary, bold, ~20% width)
2. Role (secondary text, ~20%)
3. Status badge (pill, color-coded, clickable → inline Select, ~15%)
4. Interview Stage (pill if set, `--surface-2` neutral, ~15%)
5. Applied Date (date string, `--text-secondary`, ~10%)
6. Contact (text, ~10%)
7. Notes preview (truncated, `--text-tertiary`, ~remaining)
8. Delete button (hover-reveal, right-aligned)

**Add row:** Single inline form at the top of the table. Shows on click of `+` button in header. Minimal: company + role fields only, rest default to `pending` / null. Submit inserts and collapses.

**Inline edit:** Click any row → row expands below (not replaces) showing all fields in a 2-column form grid. Cancel/Save buttons. Uses same `use:enhance` pattern as todos.

**Empty state:** Briefcase icon, "No companies targeted yet", "Add your first target with the + button." — centered, design system §8.12.

**Status badge click:** Clicking the status badge in the row opens a `Select` dropdown (reuse `src/lib/components/Select.svelte`) inline, submits `?/updateStatus` action immediately on change.

---

## Phase 1 — DB migration + types + query helper

**Files to create/modify:**
1. `supabase/migrations/003_jobs.sql` — new table + RLS + index
2. `src/lib/types.ts` — append `JobStatus`, `JobInterviewStage`, `Job` interface
3. `src/lib/db.ts` — append `getJobs(sb, userId): Promise<Job[]>`

### 003_jobs.sql

```sql
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','applied','recruiter_screen','interview','offer','rejected','ghosted','dropped')),
  interview_stage text
    CHECK (interview_stage IS NULL OR interview_stage IN ('first_round','second_round','third_round','fourth_round','fifth_round')),
  job_url text,
  contact text,
  applied_date date,
  interviewer text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs: own rows only" ON public.jobs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX jobs_user_created ON public.jobs (user_id, created_at DESC);
```

### types.ts additions

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

### db.ts addition

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

**Verification:**
- `grep -n 'JobStatus' src/lib/types.ts` → finds type
- `grep -n 'getJobs' src/lib/db.ts` → finds function
- File `supabase/migrations/003_jobs.sql` exists

---

## Phase 2 — Server route (`+page.server.ts`)

**File:** `src/routes/jobs/+page.server.ts`

**Actions needed:** `add`, `update`, `remove`

```typescript
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getJobs } from '$lib/db';
import type { JobStatus, JobInterviewStage } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/login');
  const jobs = await getJobs(locals.supabase, locals.user.id);
  return { jobs };
};

export const actions: Actions = {
  add: async ({ locals, request }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });
    const form = await request.formData();
    const company = (form.get('company') as string)?.trim();
    const role = (form.get('role') as string)?.trim() || null;
    if (!company) return fail(400, { error: 'Company is required' });
    const { error } = await locals.supabase.from('jobs').insert({
      user_id: locals.user.id, company, role, status: 'pending'
    });
    if (error) return fail(500, { error: error.message });
  },

  update: async ({ locals, request }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });
    const form = await request.formData();
    const id = form.get('id') as string;
    if (!id) return fail(400, { error: 'ID required' });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    // Only include fields present in form data
    const fields = ['company','role','status','interview_stage','job_url','contact','applied_date','interviewer','notes'];
    for (const f of fields) {
      if (form.has(f)) {
        const v = (form.get(f) as string)?.trim() || null;
        patch[f] = v;
      }
    }
    const { error } = await locals.supabase
      .from('jobs').update(patch).eq('id', id).eq('user_id', locals.user.id);
    if (error) return fail(500, { error: error.message });
  },

  remove: async ({ locals, request }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });
    const form = await request.formData();
    const id = form.get('id') as string;
    if (!id) return fail(400, { error: 'ID required' });
    const { error } = await locals.supabase
      .from('jobs').delete().eq('id', id).eq('user_id', locals.user.id);
    if (error) return fail(500, { error: error.message });
  }
};
```

**Verification:**
- `grep -n "export const actions" src/routes/jobs/+page.server.ts` → found
- `grep -rn "add\|update\|remove" src/routes/jobs/+page.server.ts` → 3 actions present
- TypeScript: `source ~/.zshrc 2>/dev/null; bun run check` passes (no new type errors)

---

## Phase 3 — Page UI (`+page.svelte`)

**File:** `src/routes/jobs/+page.svelte`

### Component structure

```
<page>
  <header>
    <h1>Jobs</h1>
    <span class="total-badge">{jobs.length} companies</span>
    <button class="btn-primary sm" on:click={() => addingNew = true}>+ Add</button>
  </header>

  <!-- Add row (shown when addingNew) -->
  {#if addingNew}
    <form method="POST" action="?/add" use:enhance={...}>
      <input name="company" placeholder="Company name" required autofocus />
      <input name="role" placeholder="Role / title" />
      <button type="submit" class="btn-primary">Add</button>
      <button type="button" class="btn-ghost" on:click={() => addingNew = false}>Cancel</button>
    </form>
  {/if}

  <!-- Table (or empty state) -->
  {#if jobs.length === 0}
    <empty-state />
  {:else}
    <table>
      <thead>Company | Role | Status | Stage | Applied | Contact | Notes</thead>
      <tbody>
        {#each jobs as job (job.id)}
          <!-- Normal row -->
          <tr on:click={() => editingId = job.id}>
            <td class="col-company">{job.company}</td>
            <td class="col-role">{job.role ?? '—'}</td>
            <td class="col-status">
              <!-- Status badge, click stops propagation → opens inline select -->
              <StatusBadge {job} />
            </td>
            <td class="col-stage">{stageLabel(job.interview_stage) ?? '—'}</td>
            <td class="col-date">{job.applied_date ?? '—'}</td>
            <td class="col-contact">{job.contact ?? '—'}</td>
            <td class="col-notes">{truncate(job.notes)}</td>
            <td class="col-actions">
              <form method="POST" action="?/remove" use:enhance>
                <input type="hidden" name="id" value={job.id} />
                <button type="submit" class="act-btn danger" aria-label="Delete">✕</button>
              </form>
            </td>
          </tr>
          <!-- Inline edit row (expands below clicked row) -->
          {#if editingId === job.id}
            <tr class="edit-row">
              <td colspan="8">
                <form method="POST" action="?/update" use:enhance={closeOnSuccess}>
                  <input type="hidden" name="id" value={job.id} />
                  <!-- 2-col grid form: company, role, status, stage, url, contact, date, interviewer, notes (full width) -->
                  ...
                  <div class="edit-actions">
                    <button type="submit" class="btn-primary">Save</button>
                    <button type="button" class="btn-ghost" on:click={() => editingId = null}>Cancel</button>
                  </div>
                </form>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  {/if}
</page>
```

### Status badge inline update
Clicking the status badge in the row (not the row itself) submits `?/update` immediately via a hidden form + `requestSubmit()`. This avoids opening the full edit form just for a status change — the most common quick action.

### Status badge colors
Map `JobStatus → { bg: CSS var, text: CSS var, label: string }`:
```typescript
const STATUS_META: Record<JobStatus, { bg: string; fg: string; label: string }> = {
  pending:          { bg: 'var(--surface-3)',   fg: 'var(--text-secondary)', label: 'Pending' },
  applied:          { bg: 'var(--warning-soft)', fg: 'var(--warning)',        label: 'Applied' },
  recruiter_screen: { bg: 'var(--info-soft)',    fg: 'var(--info)',           label: 'Recruiter Screen' },
  interview:        { bg: 'var(--accent-soft)',  fg: 'var(--accent)',         label: 'Interview' },
  offer:            { bg: 'var(--success-soft)', fg: 'var(--success)',        label: 'Offer' },
  rejected:         { bg: 'var(--danger-soft)',  fg: 'var(--danger)',         label: 'Rejected' },
  ghosted:          { bg: 'var(--danger-soft)',  fg: 'var(--danger)',         label: 'Ghosted' },
  dropped:          { bg: 'var(--surface-3)',    fg: 'var(--text-tertiary)',  label: 'Dropped' },
};
```

### Reuse `Select.svelte`
Use for `status` and `interview_stage` fields in the inline edit form. Interface: `name`, `options: { value, label }[]`, `value`.

### Status options array
```typescript
const statusOpts = [
  { value: 'pending', label: 'Pending' },
  { value: 'applied', label: 'Applied' },
  { value: 'recruiter_screen', label: 'Recruiter Screen' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'ghosted', label: 'Ghosted' },
  { value: 'dropped', label: 'Dropped' },
];

const stageOpts = [
  { value: '', label: '—' },
  { value: 'first_round', label: 'First Round' },
  { value: 'second_round', label: 'Second Round' },
  { value: 'third_round', label: 'Third Round' },
  { value: 'fourth_round', label: 'Fourth Round' },
  { value: 'fifth_round', label: 'Fifth Round' },
];
```

### CSS tokens to use
- Table: `background: var(--surface-1)`, `border: 1px solid var(--border-subtle)`, `border-radius: var(--radius-xl)`
- `thead th`: `--text-tertiary`, 11px, uppercase, `--border-subtle` bottom border
- `tbody tr`: `--border-subtle` between rows, 48px row height, `cursor: pointer`
- `tbody tr:hover`: `background: var(--surface-2)`
- Edit row: `background: var(--surface-2)`, no bottom border on parent row
- Delete button: opacity 0 on tr, opacity 1 on tr:hover — same pattern as todos
- All font sizes: 13–14px for cells, 11px for header labels

### States to implement
1. **Loading:** SvelteKit handles via SSR — no spinner needed (data loads before render)
2. **Empty:** Briefcase icon, "No companies targeted yet", "+ Add your first target" CTA
3. **Error:** Form action returns `fail()` → `$page.form?.error` shown via toast
4. **Populated:** Full table

**Verification:**
- Dev server loads `/jobs` without errors
- Can add a row → appears in table
- Can click row → edit form expands
- Can save → edit form closes, row updates
- Can delete → row removed with animation
- Can click status badge → status updates without opening full edit
- Empty state shows correctly when table is empty
- TypeScript check: `source ~/.zshrc 2>/dev/null; bun run check` passes

---

## Phase 4 — Nav + DB migration + cleanup

**Files to modify:**
1. `src/routes/+layout.svelte` — add Jobs nav item (Briefcase icon from lucide-svelte)
2. `CLAUDE.md` — update Task Queue + Log + Current Phase
3. Run: `source ~/.zshrc 2>/dev/null; bun run check` for final type check

**Nav entry:**
```svelte
import { ..., Briefcase } from 'lucide-svelte';
// in nav array, between Calendar and Settings:
{ href: '/jobs', label: 'Jobs', icon: Briefcase },
```

**Manual step (user must do):**
Run the migration against real Supabase:
```bash
# In Supabase dashboard SQL editor, or:
supabase db push
# or paste contents of supabase/migrations/003_jobs.sql into dashboard
```

Write `docs/phase6-setup.md` with copy-paste migration SQL + instructions.

**Final verification checklist:**
- [ ] `/jobs` loads (auth-gated, redirects to `/login` if not authed)
- [ ] Table shows all columns with correct widths
- [ ] Add form adds a row, collapses, row appears at top of table
- [ ] Clicking a row expands inline edit with all fields pre-filled
- [ ] Status Select dropdown shows 8 options with correct labels
- [ ] Stage Select shows 6 options (including blank "—")
- [ ] Saving edit updates row data in place
- [ ] Status badge click updates status without opening full edit
- [ ] Delete button removes row with fly-out animation
- [ ] Empty state shows when no jobs exist
- [ ] Both themes (dark + light) render correctly
- [ ] No TypeScript errors (`bun run check`)
- [ ] Nav item "Jobs" appears in sidebar with Briefcase icon

---

## Anti-patterns to avoid
- No raw Tailwind colors (`text-red-500`, `bg-gray-800`) — use CSS var tokens
- No inline hex values — all colors via `var(--token)`
- No client-side Supabase mutations — all through form actions
- No `+page.ts` — must be `+page.server.ts` for auth-gated routes
- No `any` types — `JobStatus` and `JobInterviewStage` used everywhere
- Status badge click must `stopPropagation()` to avoid triggering row edit open
- Update action must include `updated_at: new Date().toISOString()` 
- Migration file must be `003_jobs.sql` (next in sequence after `002_google_tokens.sql`)
