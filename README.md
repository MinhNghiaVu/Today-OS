# Today OS

> **Work in progress.** Core routes are functional; some integrations (Google Calendar, AI assistant) require manual setup.

A personal daily operating system built with SvelteKit. Open it and immediately know what to do today.

---

## What it does

**Today** — The home screen. Shows your todos for today, habit progress, and a read-only Google Calendar timeline side by side. One screen, zero context-switching.

**Todos** — A simple task list. Tasks have a title, optional due time, and a done/pending status. Overdue incomplete tasks surface automatically.

**Habits** — Log repeating metrics (water, calories, sleep, screen time, etc.). Each habit has a goal type: minimum, maximum, or info-only. Progress bars color-shift when you hit or exceed the goal. Tapping a habit opens a log drawer for the selected day.

**Notes** — A quick-capture pad for scratch notes, LinkedIn drafts, shopping lists — anything that doesn't need Notion-level structure.

**Calendar** — A read-only monthly/weekly view pulling from Google Calendar. Context only; no write-back in v1.

**Jobs** — A job application tracker. Inline status updates, table-first layout, no fuss.

**Settings** — Theme (dark/light) and accent color. Preferences persist across sessions.

**AI Assistant** — Stubbed; disabled until an Anthropic API key is configured (see setup).

---

## Stack

| Layer | Tech |
|---|---|
| Framework | SvelteKit |
| Runtime | Bun |
| Backend / Auth | Supabase (Postgres + RLS + Google OAuth) |
| Styling | Tailwind CSS + CSS custom properties |
| Icons | lucide-svelte |
| Markdown | marked |
| Calendar | Google Calendar API (read-only) |

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) v1+
- A Neon Postgres project with Neon Auth enabled, usually through the Vercel Marketplace
- (Optional) Google Cloud project with Calendar API enabled

### Install

```bash
bun install
```

### Environment variables

Create a `.env` file at the repo root:

```env
DATABASE_URL=postgres://...
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
NEON_AUTH_BASE_URL=https://.../auth
VITE_NEON_AUTH_URL=https://.../auth
```

The server prefers `DATABASE_URL`, with `POSTGRES_URL` and `POSTGRES_PRISMA_URL` as database fallbacks. It uses `NEON_AUTH_BASE_URL` for auth, with `VITE_NEON_AUTH_URL` as a fallback for the same Neon Auth URL. Add the exact deployed app origin to Neon Auth trusted domains before testing OAuth in production.

Full setup — including Google OAuth, migrations, Google Calendar, and the Anthropic key — is covered in the docs below.

### Run

```bash
bun run dev
```

### Other commands

```bash
bun run check        # type-check
bun run build        # production build
bun run preview      # preview production build
```

---

## Setup docs

| Doc | Covers |
|---|---|
| `docs/phase2-setup.md` | Neon project, env vars, schema bootstrap, Neon Auth |
| `docs/phase4-setup.md` | Google Calendar read-only integration |
| `docs/phase5-setup.md` | Anthropic API key / AI assistant |
| `docs/phase6-setup.md` | Jobs table migration |

---

## Project structure

```
src/
  routes/          # SvelteKit routes (one folder per page)
  lib/
    components/    # Reusable Svelte components
    db.ts          # Shared data query helpers
    stores.ts      # Client-only UI state
    types.ts       # Shared domain types
    utils/         # Pure helpers
  app.css          # Design tokens + global styles
neon/
  migrations/      # Neon Postgres schema reference
docs/              # Specs, setup guides, design system
```

---

## Design

Warm dark surfaces, restrained density, strong alignment — closer to Linear or Things 3 than Notion. Design tokens and component rules live in `docs/design-system.md`.

---

## Status

Phase 1–6 complete. Core routes are functional end-to-end with Neon Postgres and Neon Auth. The AI assistant route is intentionally disabled until an Anthropic key is ready.
