-- Markers can optionally have a time. NULL time = full-day marker (shown at the
-- top of its date on the calendar).
alter table public.calendar_markers add column if not exists event_time time;
