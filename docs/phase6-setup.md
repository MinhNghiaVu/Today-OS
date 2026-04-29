# Phase 6 — Job Board Setup

One manual step: run the DB migration.

## Run the migration

### Option A — Supabase dashboard (easiest)

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Paste the SQL below and click **Run**

```sql
-- Phase 6: Job board

CREATE TABLE public.jobs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company        text        NOT NULL,
  role           text,
  status         text        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','applied','recruiter_screen','interview','offer','rejected','ghosted','dropped')),
  interview_stage text
                   CHECK (interview_stage IS NULL OR interview_stage IN ('first_round','second_round','third_round','fourth_round','fifth_round')),
  job_url        text,
  contact        text,
  applied_date   date,
  interviewer    text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own jobs"
  ON public.jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX jobs_user_created ON public.jobs (user_id, created_at DESC);
```

### Option B — Supabase CLI

```bash
supabase db push
```

(requires `supabase` CLI linked to your project)

## Verify

After running, go to `/jobs` in the app — you should see the empty state (Briefcase icon, "No companies targeted yet"). Click **+ Add**, enter a company, and confirm the row appears.
