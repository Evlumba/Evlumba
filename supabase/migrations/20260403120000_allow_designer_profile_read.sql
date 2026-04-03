-- Allow authenticated users to read designer profiles (role = designer or designer_pending)
-- This is needed for: collections page (web), designers list (web+mobile), public profiles

drop policy if exists "profiles: public read for designers" on public.profiles;

create policy "profiles: public read for designers"
on public.profiles for select
to authenticated
using (role in ('designer', 'designer_pending'));
