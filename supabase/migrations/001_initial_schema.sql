-- ============================================================
-- profiles (extends auth.users)
-- ============================================================
create table public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  name         text        not null,
  is_admin     boolean     not null default false,
  avatar_color text        not null default '#6366f1',
  created_at   timestamptz not null default now()
);

-- ============================================================
-- arrivals (one row per guest, unique on user_id)
-- ============================================================
create table public.arrivals (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        references public.profiles(id) on delete cascade not null unique,
  arrival_date   date,
  departure_date date,
  notes          text,
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- activities
-- ============================================================
create table public.activities (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  description      text        not null default '',
  activity_date    date,
  activity_time    time,
  cost_per_person  numeric(10,2),
  cost_notes       text,
  ticket_url       text,
  display_order    integer     not null default 0,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- activity_signups
-- ============================================================
create table public.activity_signups (
  id          uuid        primary key default gen_random_uuid(),
  activity_id uuid        references public.activities(id) on delete cascade not null,
  user_id     uuid        references public.profiles(id)   on delete cascade not null,
  created_at  timestamptz not null default now(),
  unique(activity_id, user_id)
);

-- ============================================================
-- info_pages (house, cars, schedule, explore)
-- ============================================================
create table public.info_pages (
  slug       text        primary key,
  title      text        not null,
  content    text        not null default '',
  updated_at timestamptz not null default now()
);

insert into public.info_pages (slug, title, content) values
  ('schedule', 'Programação',       ''),
  ('house',    'A Casa',            ''),
  ('cars',     'Carros',            ''),
  ('explore',  'Por Conta Própria', '');

-- ============================================================
-- Trigger: auto-create profile row when a new auth user is created
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  colors text[] := array['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6',
                          '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16','#a855f7'];
  color  text   := colors[1 + floor(random() * array_length(colors,1))::int];
begin
  insert into public.profiles (id, name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', color)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.arrivals         enable row level security;
alter table public.activities       enable row level security;
alter table public.activity_signups enable row level security;
alter table public.info_pages       enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- profiles
create policy "profiles: read all"   on public.profiles for select to authenticated using (true);
create policy "profiles: update own" on public.profiles for update to authenticated using (auth.uid() = id);

-- arrivals
create policy "arrivals: read all"   on public.arrivals for select to authenticated using (true);
create policy "arrivals: insert own" on public.arrivals for insert to authenticated with check (auth.uid() = user_id);
create policy "arrivals: update own" on public.arrivals for update to authenticated using (auth.uid() = user_id);

-- activities
create policy "activities: read all"     on public.activities for select to authenticated using (true);
create policy "activities: admin insert" on public.activities for insert to authenticated with check (public.is_admin());
create policy "activities: admin update" on public.activities for update to authenticated using (public.is_admin());
create policy "activities: admin delete" on public.activities for delete to authenticated using (public.is_admin());

-- activity_signups
create policy "signups: read all"    on public.activity_signups for select to authenticated using (true);
create policy "signups: insert own"  on public.activity_signups for insert to authenticated with check (auth.uid() = user_id);
create policy "signups: delete own"  on public.activity_signups for delete to authenticated using (auth.uid() = user_id);

-- info_pages
create policy "info_pages: read all"     on public.info_pages for select to authenticated using (true);
create policy "info_pages: admin update" on public.info_pages for update to authenticated using (public.is_admin());
