-- Add email to profiles (for admin visibility) and let admins update any profile.

-- ============================================================
-- 1. email column, backfilled from auth.users
-- ============================================================
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- ============================================================
-- 2. keep email populated on new signups
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  colors text[] := array['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6',
                          '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16','#a855f7'];
  color  text   := colors[1 + floor(random() * array_length(colors,1))::int];
begin
  insert into public.profiles (id, name, email, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_color', color)
  );
  return new;
end;
$$;

-- ============================================================
-- 3. let admins update any profile (regular users still edit only their own)
-- ============================================================
create policy "profiles: admin update" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
