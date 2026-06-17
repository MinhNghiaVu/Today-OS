alter table public.habit_definitions
  add column if not exists icon text not null default 'target';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'habit_definitions_icon_check'
      and conrelid = 'public.habit_definitions'::regclass
  ) then
    alter table public.habit_definitions
      add constraint habit_definitions_icon_check
      check (icon in (
        'target',
        'droplets',
        'footprints',
        'tree-pine',
        'flame',
        'moon',
        'brain',
        'dumbbell',
        'heart-pulse',
        'book-open',
        'coffee',
        'utensils',
        'clock-3',
        'sun',
        'smartphone'
      )) not valid;
  end if;
end $$;

update public.habit_definitions
set icon = 'droplets'
where icon = 'target' and lower(name) like '%water%';

update public.habit_definitions
set icon = 'footprints'
where icon = 'target' and (lower(name) like '%step%' or lower(name) like '%walk%');

update public.habit_definitions
set icon = 'tree-pine'
where icon = 'target' and (lower(name) like '%outside%' or lower(name) like '%outdoor%');

update public.habit_definitions
set icon = 'flame'
where icon = 'target' and (lower(name) like '%calorie%' or lower(unit) like '%kcal%');
