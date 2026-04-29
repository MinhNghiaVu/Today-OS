# Phase 5 Setup — AI Assistant

One manual step: get an Anthropic API key and add it to your environment.

---

## 1. Get an Anthropic API key

1. Go to https://console.anthropic.com/
2. Sign in (or create an account).
3. Navigate to **API Keys** → **Create Key**.
4. Copy the key (starts with `sk-ant-…`).

The assistant uses **Claude Haiku** — the cheapest Claude model. Cost is roughly $0.0001 per message for typical queries. No billing surprises for personal use.

---

## 2. Add to `.env`

Open `.env` in the project root and add:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Then restart the dev server:

```
bun run dev
```

---

## 3. Verify

1. Open the app → click **Assistant** in the sidebar.
2. Type "What are my habits today?" and press Enter.
3. You should see a streaming response appear.

If you get "Couldn't reach the assistant", check:
- The `ANTHROPIC_API_KEY` is set and the server was restarted.
- Your Anthropic account has credits (new accounts get free credits).

---

## What context the assistant sees

Each request pulls live data from Supabase:
- Today's habit totals (name, unit, total vs goal, status)
- Today's todos (pending + done, with priority)
- Your 10 most recent notes (title + first 200 chars of content)

The model (Haiku) reasons over this context. It does not perform math — the aggregated numbers come from the DB directly.

No conversation history is persisted. Each page load starts a fresh session.
