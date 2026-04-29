-- Add Google Calendar token columns to users table.
-- Run in Supabase SQL Editor after 001_initial_schema.sql.
alter table public.users
  add column if not exists google_access_token  text,
  add column if not exists google_refresh_token text,
  add column if not exists google_token_expiry  timestamptz;
