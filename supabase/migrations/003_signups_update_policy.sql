-- Allow users to update their own signups (needed for plus_guests counter)
create policy "signups: update own" on public.activity_signups
  for update to authenticated using (auth.uid() = user_id);
