# Phase 2 Setup Guide — Supabase + Auth

Follow these steps to activate the backend. Claude has written all the code; you wire up the accounts and keys.

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Choose a name (e.g. `today-os`), set a strong DB password, pick a region close to you.
3. Wait ~2 minutes for provisioning.
4. In the dashboard sidebar: **Project Settings → API**.
   - Copy **Project URL** → this is `PUBLIC_SUPABASE_URL`
   - Copy **anon / public** key → this is `PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — Add environment variables

Create a `.env` file at the project root (copy from `.env.example`):

```
PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> `.env` is git-ignored. Never commit it.

---

## Step 3 — Run the database migration

1. In the Supabase dashboard: **SQL Editor → New query**.
2. Paste the full contents of `supabase/migrations/001_initial_schema.sql`.
3. Click **Run**.

This creates all tables (`users`, `todos`, `habit_definitions`, `habit_logs`, `notes`), enables Row Level Security on all of them, and sets up the trigger that auto-creates a `users` row on first sign-in.

---

## Step 4 — Enable Google OAuth

### In Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or pick an existing one).
3. Enable the **Google+ API** (or **Google Identity** API).
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
   - Application type: **Web application**
   - Authorized redirect URIs — add:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
   - (You can also add `http://localhost:5173` for local dev if Supabase supports it — it does via its own OAuth proxy.)
5. Copy **Client ID** and **Client Secret**.

### In Supabase dashboard

1. Go to **Authentication → Providers → Google**.
2. Toggle **Enable**.
3. Paste **Client ID** and **Client Secret**.
4. Save.

---

## Step 5 — Set the redirect URL (local dev)

In Supabase dashboard: **Authentication → URL Configuration**.

- **Site URL**: `http://localhost:5173`
- **Redirect URLs**: add `http://localhost:5173/auth/callback`

For production later, add your deployed URL here too.

---

## Step 6 — Run the dev server

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). You'll be redirected to `/login`. Click **Sign in with Google**. After auth, you land on `/today` with a real DB backend.

---

## What Claude coded (no action needed)

| File | What it does |
|------|-------------|
| `src/hooks.server.ts` | Creates Supabase server client per request, attaches session + user to `event.locals` |
| `src/routes/+layout.server.ts` | Redirects unauthenticated users to `/login`; loads user preferences |
| `src/routes/login/+page.server.ts` | Initiates Google OAuth redirect |
| `src/routes/auth/callback/+server.ts` | Exchanges OAuth code for session, redirects to `/today` |
| `src/routes/logout/+server.ts` | Signs out, redirects to `/login` |
| `src/routes/*/+page.server.ts` | Each route now loads from Supabase + handles CRUD via form actions |
| `src/lib/db.ts` | Shared Supabase query helpers |
| `supabase/migrations/001_initial_schema.sql` | Full schema with RLS |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "No authorization code" on callback | Check redirect URL matches exactly in both Google Console and Supabase dashboard |
| Blank page after login | Check browser console; likely missing env vars |
| `AUTH_SESSION_MISSING` errors | Clear cookies and sign in again |
| Data not showing | Verify SQL migration ran; check RLS policies in Supabase Dashboard → Table Editor |
| `relation "public.users" does not exist` | Migration didn't run — go back to Step 3 |
