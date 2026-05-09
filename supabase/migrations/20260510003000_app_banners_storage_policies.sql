-- App banner table and storage policies for admin uploads.

create table if not exists public.app_banners (
  slot integer primary key,
  image_url text,
  updated_at timestamptz not null default now()
);

alter table public.app_banners add column if not exists image_url text;
alter table public.app_banners add column if not exists updated_at timestamptz not null default now();

create unique index if not exists app_banners_slot_key
  on public.app_banners (slot);

alter table public.app_banners enable row level security;

drop policy if exists "app_banners: public read" on public.app_banners;
create policy "app_banners: public read"
on public.app_banners
for select
using (true);

drop policy if exists "app_banners: admin write" on public.app_banners;
create policy "app_banners: admin write"
on public.app_banners
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin', 'super_admin')
  )
);

grant select on table public.app_banners to anon, authenticated;
grant insert, update, delete on table public.app_banners to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-banners',
  'app-banners',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "app-banners: public read" on storage.objects;
create policy "app-banners: public read"
on storage.objects
for select
using (bucket_id = 'app-banners');

drop policy if exists "app-banners: admin insert" on storage.objects;
create policy "app-banners: admin insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'app-banners'
  and exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin', 'super_admin')
  )
);

drop policy if exists "app-banners: admin update" on storage.objects;
create policy "app-banners: admin update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'app-banners'
  and exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin', 'super_admin')
  )
)
with check (
  bucket_id = 'app-banners'
  and exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin', 'super_admin')
  )
);

drop policy if exists "app-banners: admin delete" on storage.objects;
create policy "app-banners: admin delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'app-banners'
  and exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin', 'super_admin')
  )
);
