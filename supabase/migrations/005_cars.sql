-- cars: guest-entered car rental info, open to all authenticated guests
create table public.cars (
  id              uuid        primary key default gen_random_uuid(),
  created_by      uuid        references public.profiles(id) on delete set null,
  rental_company  text        not null,
  location        text        not null,
  pickup_date     date        not null,
  dropoff_date    date        not null,
  brand           text        not null,
  color           text        not null,
  seats           integer     not null,
  photo_path      text,
  created_at      timestamptz not null default now()
);

alter table public.cars enable row level security;

-- Anyone can edit/delete any entry — a rental is tied to a couple, not a login
create policy "cars: read all"   on public.cars for select to authenticated using (true);
create policy "cars: insert all" on public.cars for insert to authenticated with check (true);
create policy "cars: update all" on public.cars for update to authenticated using (true);
create policy "cars: delete all" on public.cars for delete to authenticated using (true);

-- car-photos bucket: public read; any authenticated user can write any object
insert into storage.buckets (id, name, public) values ('car-photos', 'car-photos', true);

create policy "car-photos read"   on storage.objects for select using (bucket_id = 'car-photos');
create policy "car-photos insert" on storage.objects for insert to authenticated with check (bucket_id = 'car-photos');
create policy "car-photos update" on storage.objects for update to authenticated using (bucket_id = 'car-photos');
create policy "car-photos delete" on storage.objects for delete to authenticated using (bucket_id = 'car-photos');
