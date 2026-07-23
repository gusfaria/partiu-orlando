-- Replace per-user arrivals with free-form arrival/departure events

drop table if exists public.arrivals cascade;

create table public.arrival_events (
  id             uuid        primary key default gen_random_uuid(),
  description    text        not null,
  transportation text        not null,
  arrival_date   date,
  arrival_time   time,
  departure_date date,
  departure_time time,
  created_by     uuid        references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create table public.arrival_event_people (
  id       uuid primary key default gen_random_uuid(),
  event_id uuid references public.arrival_events(id) on delete cascade not null,
  user_id  uuid references public.profiles(id) on delete cascade not null
);

alter table public.arrival_events       enable row level security;
alter table public.arrival_event_people enable row level security;

create policy "arrival_events: read all"   on public.arrival_events for select to authenticated using (true);
create policy "arrival_events: insert all" on public.arrival_events for insert to authenticated with check (true);
create policy "arrival_events: update all" on public.arrival_events for update to authenticated using (true);
create policy "arrival_events: delete all" on public.arrival_events for delete to authenticated using (true);

create policy "aep: read all"   on public.arrival_event_people for select to authenticated using (true);
create policy "aep: insert all" on public.arrival_event_people for insert to authenticated with check (true);
create policy "aep: update all" on public.arrival_event_people for update to authenticated using (true);
create policy "aep: delete all" on public.arrival_event_people for delete to authenticated using (true);
