-- avatar on profiles
alter table public.profiles add column avatar_url text;

-- site photos (galleries + hero)
create table public.site_photos (
  id            uuid        primary key default gen_random_uuid(),
  section       text        not null check (section in ('house','cars','hero')),
  storage_path  text        not null,
  caption       text,
  display_order integer     not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.site_photos enable row level security;

create policy "site_photos: read all"     on public.site_photos for select to authenticated using (true);
create policy "site_photos: admin insert" on public.site_photos for insert to authenticated with check (public.is_admin());
create policy "site_photos: admin update" on public.site_photos for update to authenticated using (public.is_admin());
create policy "site_photos: admin delete" on public.site_photos for delete to authenticated using (public.is_admin());

-- storage buckets
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('photos',  'photos',  true);

-- avatars bucket: public read; users write only in their own folder
create policy "avatars read"   on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- photos bucket: public read; admin write
create policy "photos read"   on storage.objects for select using (bucket_id = 'photos');
create policy "photos insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_admin());
create policy "photos update" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.is_admin());
create policy "photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_admin());
