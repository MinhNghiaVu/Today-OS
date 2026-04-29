# Phase 4 Setup — Google Calendar Integration

Follow these steps after deploying the Phase 4 code. All steps are one-time unless you rotate credentials.

---

## 1. Run the DB migration

In the Supabase dashboard → SQL Editor, run:

```sql
alter table public.users
  add column if not exists google_access_token  text,
  add column if not exists google_refresh_token text,
  add column if not exists google_token_expiry  timestamptz;
```

This is also saved at `supabase/migrations/002_google_tokens.sql`.

---

## 2. Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → your project (the same one you used for Supabase Google OAuth).
2. APIs & Services → Library → search "Google Calendar API" → Enable.

---

## 3. Add the Calendar scope to your Google OAuth app

1. Google Cloud Console → APIs & Services → OAuth consent screen.
2. Under **Scopes**, click **Add or remove scopes**.
3. Add: `https://www.googleapis.com/auth/calendar.readonly`
4. Save.

> If your app is in "Testing" mode, you must also add your email to the **Test users** list.

---

## 4. Add the scope to Supabase Auth provider

1. Supabase dashboard → Authentication → Providers → Google.
2. In the **Additional OAuth scopes** field, add:
   ```
   https://www.googleapis.com/auth/calendar.readonly
   ```
3. Save.

---

## 5. Re-authenticate to grant calendar access

The new scope only takes effect on a fresh OAuth grant. Sign out of Today OS, then sign back in. You will see Google's consent screen again — approve calendar access.

After sign-in, the app stores your Google access token. Calendar events will appear on the Today page and in the Calendar day panel.

---

## Notes

- **Token expiry:** Google access tokens last ~1 hour. After expiry, the app shows a "Reconnect" prompt — click it to re-authorize. Auto-refresh can be added in a later phase (requires storing `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` as private env vars and calling Google's token endpoint).
- **Timezone:** Events are fetched for the UTC day boundary (`00:00:00Z–23:59:59Z`). If you are far from UTC, events near midnight may appear on the wrong day. Timezone support can be added to user preferences in a later phase.
- **Primary calendar only:** Only `primary` calendar events are fetched. Multi-calendar support can be added later via the Calendars list API.
