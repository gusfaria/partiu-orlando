-- Add plus_guests to activity_signups
-- Allows users to indicate they are bringing additional people (e.g. children)
alter table public.activity_signups
  add column plus_guests integer not null default 0 check (plus_guests >= 0);
