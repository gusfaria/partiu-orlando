-- Calendar markers: whole-group, whole-day notes (check-in, check-out, free day, ...)
-- No people, no cost, no sign-up. Just a label + emoji on a date.

create table public.calendar_markers (
  id            uuid        primary key default gen_random_uuid(),
  label         text        not null,
  emoji         text        not null default '📌',
  event_date    date        not null,
  display_order integer     not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.calendar_markers enable row level security;

create policy "markers: read all"     on public.calendar_markers for select to authenticated using (true);
create policy "markers: admin insert" on public.calendar_markers for insert to authenticated with check (public.is_admin());
create policy "markers: admin update" on public.calendar_markers for update to authenticated using (public.is_admin());
create policy "markers: admin delete" on public.calendar_markers for delete to authenticated using (public.is_admin());
