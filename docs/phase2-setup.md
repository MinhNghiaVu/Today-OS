# Phase 2 Setup Guide — Neon + Auth

Follow these steps to activate the backend. Today OS now uses Neon Postgres plus Neon Auth.

---

## Step 1 — Create or connect Neon

1. Install Neon from the Vercel Marketplace and connect it to the Today OS Vercel project.
2. Enable Neon Auth in the Neon console.
3. Enable email sign-up/sign-in, and add Google as an OAuth provider if Google login is desired.
4. Add the production app domain to Neon Auth trusted domains, for example `https://today-os-five.vercel.app`.

---

## Step 2 — Add environment variables

For Vercel, the Marketplace integration should inject these automatically:

```
DATABASE_URL=postgres://...
NEON_AUTH_BASE_URL=https://.../auth
VITE_NEON_AUTH_URL=https://.../auth
```

> `.env` is git-ignored. Never commit it.

---

## Step 3 — Database schema

The deployed app bootstraps the required Neon tables on first authenticated request. The schema is also saved as `neon/migrations/001_today_os_schema.sql` for review or manual application.

This creates `users`, `todos`, `habit_definitions`, `habit_logs`, `notes`, and `jobs`.

---

## Step 4 — Enable Google OAuth

### In Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or pick an existing one).
3. Enable the **Google+ API** (or **Google Identity** API).
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
   - Application type: **Web application**
   - Authorized redirect URIs should match the redirect URL required by Neon Auth for the Google provider.
5. Copy **Client ID** and **Client Secret**.

### In Neon Auth

1. Go to Neon Auth OAuth providers.
2. Confirm Google is enabled.
3. Paste **Client ID** and **Client Secret**.
4. Save.

---

## Step 5 — Set the redirect URL (local dev)

In Neon Auth trusted domains, keep localhost enabled for local development and add the production Vercel domain.

---

## Step 6 — Run the dev server

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). You'll be redirected to `/login`. Sign in with email or Google. After auth, you land on `/today` with a real DB backend.

---

## What Claude coded (no action needed)

| File | What it does |
|------|-------------|
| `src/hooks.server.ts` | Creates Neon-backed request locals, attaches session + user to `event.locals` |
| `src/routes/+layout.server.ts` | Redirects unauthenticated users to `/login`; loads user preferences |
| `src/routes/login/+page.server.ts` | Handles email auth and initiates Google OAuth |
| `src/routes/api/auth/[...path]/+server.ts` | Proxies Neon Auth requests |
| `src/routes/logout/+server.ts` | Signs out, redirects to `/login` |
| `src/routes/*/+page.server.ts` | Each route loads from Neon + handles CRUD via form actions |
| `src/lib/db.ts` | Shared query helpers |
| `neon/migrations/001_today_os_schema.sql` | Full app schema |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Invalid origin` during sign-up or OAuth | Confirm `NEON_AUTH_BASE_URL` is set and add the exact app origin, such as `https://today-os-five.vercel.app`, to Neon Auth trusted domains |
| OAuth does not redirect back | Check trusted domains and Google provider redirect URL in Neon Auth |
| Blank page after login | Check browser console; likely missing env vars |
| `AUTH_SESSION_MISSING` errors | Clear cookies and sign in again |
| Data not showing | Verify `DATABASE_URL` exists in Vercel and the schema bootstrap ran |
| `relation "public.users" does not exist` | Apply `neon/migrations/001_today_os_schema.sql` manually or trigger a fresh authenticated request |
