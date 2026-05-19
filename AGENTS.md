# Today OS Agent Guide

This is the short handoff for agents working in Today OS. Keep it useful, not archival. If context grows, put it in the nearest relevant `.md` file instead of turning this back into a session log.

Keep `AGENTS.md` and `CLAUDE.md` in sync.

## Project Snapshot

- Today OS is a personal productivity app built with SvelteKit, TypeScript, Bun, Supabase, Tailwind, and Svelte form actions.
- The product target is a focused daily operating system: today view, todos, habits, notes, read-only calendar context, settings, and a job board.
- The visual target is quiet, clean, and Notion-like: warm dark surfaces, restrained density, strong alignment, and rose accent by default.
- Dark mode is primary. Light mode is a recolor through the same CSS variables.
- The AI assistant route exists but is intentionally disabled until an Anthropic API key is ready.

## Commands

- Install deps: `bun install`
- Dev server: `bun run dev`
- Typecheck: `bun run check`
- Typecheck watch: `bun run check:watch`
- Build: `bun run build`
- Preview build: `bun run preview`

Never use `npm` or `pnpm` in this repo.

## Definition of Done

- The touched surface passes the smallest relevant check, usually `bun run check` for Svelte/TypeScript changes.
- User-visible flows are exercised in the browser when UI behavior changes.
- Desktop and mobile sizes are checked when layout could be affected.
- Docs near the feature are updated if they would save future code archaeology.
- Manual setup steps that only the user can do live in `docs/phase*-setup.md` or another focused setup doc.
- Commit messages are concise and explain the actual change.

## Working Style

- Make small, complete changes and verify them before handing back.
- After completing changes, commit and push to the current upstream branch unless the user explicitly says not to.
- Do not leave logs, completed phase histories, or long decision diaries in this file.
- Before large edits, read the most relevant doc first, then inspect current code. Docs may be stale; code and user direction win.
- Do not add code comments unless the code is genuinely hard to understand without one.
- Do not hide failures. Surface errors with actionable UI copy and keep terminal/test output honest.
- If the user asks for a new phase or larger task breakdown, create a focused plan file in `docs/` and work one phase at a time.

## Structure

- `src/routes/{name}/+page.svelte` for route UI.
- `src/routes/{name}/+page.server.ts` for protected loads and form actions.
- `src/lib/components/` for reusable Svelte components.
- `src/lib/db.ts` for shared Supabase query helpers.
- `src/lib/stores.ts` for client-only UI state.
- `src/lib/types.ts` for shared domain types.
- `src/lib/utils/` for pure helpers.
- `src/app.css` for global styles and design tokens.
- `supabase/migrations/` for database schema and RLS policy changes.
- `docs/` for specs, setup docs, design notes, and phase plans.

Follow the spirit of `codecrafters-io/build-your-own-x`: clear topic grouping, step-by-step docs, and context close to the code that needs it. Prefer focused setup, plan, or feature docs over one giant root file.

## Product-Specific Rules

- Server state belongs in SvelteKit server loads and form actions. Do not mirror todos, habits, notes, jobs, or logs into Svelte stores.
- Client UI state belongs in `src/lib/stores.ts`: theme, accent, drawer state, and similar local-only state.
- Mutations go through form actions with `use:enhance`. Do not call `supabase.from(...)` client-side except for auth and the export flow.
- Protected routes use `+page.server.ts`, `event.locals.supabase`, and RLS-aware queries. Do not add `+page.ts` for protected data.
- Form actions return actionable `fail(...)` messages. Do not surface stack traces in UI.
- RLS must exist for every user-owned table. Never bypass RLS.
- No secrets in client code. Only `PUBLIC_*` env vars may reach the browser.
- Keep `src/lib/types.ts` as the domain type source of truth. Do not redeclare unions inline.
- Use `marked` for markdown and `lucide-svelte` for icons. Do not add a second library for the same job.
- The first-paint theme path matters: `src/app.html`, cookies, localStorage, and `src/lib/stores.ts` should stay aligned.
- Google Calendar is read-only in v1 and should not block first paint; keep slow calendar fetches bounded.
- Jobs remain table-first, not cards. Status changes should stay quick and inline.
- The assistant remains disabled until `ANTHROPIC_API_KEY` is ready; re-enable deliberately in the nav and `src/routes/api/chat/+server.ts`.

## UI Rules

- Read `docs/design-system.md` before any UI work. It is canonical for spacing, type, color, radius, shadow, layout, components, motion, and accessibility.
- Load the `frontend-design` skill before substantial UI work.
- Audit existing spacing, alignment, hierarchy, density, and motion before refactoring a screen.
- Use design tokens from `src/app.css`; keep `src/app.css` and `docs/design-system.md` in sync when tokens or patterns change.
- Avoid raw Tailwind colors and inline hex in app UI.
- Use Inter for app UI. Do not use monospace outside code.
- Every screen needs loading, empty, error, and populated states when applicable.
- Prefer Linear/Vercel/Things-style restraint over decorative layouts.
- Do not ship controls crammed inside text inputs, left-border active nav stripes, full-page spinners as default loading UI, `transition: all`, or body/UI weights above 600.
- Keep route-to-route padding aligned. Recent accepted baseline: page padding around `32px 24px`, responsive up to `40px` where needed.
- Keep dark surfaces warm and layered, not pure black.

## Current Status

- Core routes are implemented: Today, Todos, Habits, Notes, Calendar, Settings, and Jobs.
- Phase work through Phase 6 is complete.
- Remaining known manual setup is documented, mostly Supabase/Auth, Google Calendar, and Anthropic key wiring.
- Opportunity Scout is separate from Today OS and should not be developed as a route or module in this repo.

## Useful Docs

- `docs/today-os-spec.md` is the broad product spec.
- `docs/design-system.md` is the canonical UI/design system.
- `docs/TODAY_OS_PHASES.md` tracks completed phases, manual setup, and any future phase queue.
- `docs/phase2-setup.md` covers Supabase project, env vars, migrations, and Google OAuth setup.
- `docs/phase4-setup.md` covers Google Calendar setup.
- `docs/phase5-setup.md` covers the Anthropic API key / assistant setup.
- `docs/phase6-setup.md` covers the jobs migration.
- `docs/plan-phase6-jobs.md` is the archived Phase 6 job board plan.
