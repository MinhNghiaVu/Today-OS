-- Today OS now defaults to the rose accent preset.
-- Existing saved preferences keep their current accentIndex.
alter table public.users
  alter column preferences set default '{"theme":"dark","accentIndex":5}'::jsonb;
