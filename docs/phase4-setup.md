# Phase 4 Setup — Google Calendar Integration

Follow these steps after deploying the Phase 4 code. All steps are one-time unless you rotate credentials.

---

## 1. Confirm Neon Auth is enabled

Today OS uses Neon Auth and the app's `/api/auth/*` proxy. Google provider tokens are read from the Neon Auth provider account with `/get-access-token`; the app no longer depends on manually storing Google tokens in `public.users`.

---

## 2. Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → your project (the same one you used for Neon Auth Google OAuth).
2. APIs & Services → Library → search "Google Calendar API" → Enable.

---

## 3. Add the Calendar scope to your Google OAuth app

1. Google Cloud Console → APIs & Services → OAuth consent screen.
2. Under **Scopes**, click **Add or remove scopes**.
3. Add: `https://www.googleapis.com/auth/calendar.readonly`
4. Save.

> If your app is in "Testing" mode, you must also add your email to the **Test users** list.

---

## 4. Confirm Google OAuth in Neon Auth

1. Neon Auth → OAuth providers → Google must be enabled.
2. The Google OAuth client redirect URI must match the redirect URL shown by Neon Auth.
3. Add the production app domain to Neon Auth trusted domains, for example `https://today-os-five.vercel.app`.

The app requests `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/calendar.readonly` when starting Google sign-in or linking Calendar.

---

## 5. Connect or reconnect Calendar

The new scope only takes effect on a fresh OAuth grant. In Today OS, click **Connect** or **Reconnect** in the Calendar context panel. You will see Google's consent screen again; approve calendar access.

After the OAuth flow finishes, the app reads the Google provider access token from Neon Auth and calendar events will appear on the Today page and in the Calendar day panel.

---

## Notes

- **Token expiry:** Google access tokens last ~1 hour. Neon Auth may refresh provider tokens when a refresh token is available. If Google access fails, the app shows a "Reconnect" prompt.
- **Timezone:** Events are fetched for the UTC day boundary (`00:00:00Z–23:59:59Z`). If you are far from UTC, events near midnight may appear on the wrong day. Timezone support can be added to user preferences in a later phase.
- **Primary calendar only:** Only `primary` calendar events are fetched. Multi-calendar support can be added later via the Calendars list API.
