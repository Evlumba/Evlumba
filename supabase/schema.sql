-- Run in Supabase SQL Editor.
-- This creates a minimal production-ready foundation for Evlumba.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'homeowner',
  avatar_url text,
  business_name text,
  specialty text,
  city text,
  about text,
  phone text,
  contact_email text,
  address text,
  website text,
  instagram text,
  facebook text,
  linkedin text,
  cover_photo_url text,
  tags text[] not null default '{}',
  response_time text,
  starting_from text,
  about_details jsonb not null default '{}'::jsonb,
  business_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists business_name text,
  add column if not exists specialty text,
  add column if not exists city text,
  add column if not exists about text,
  add column if not exists phone text,
  add column if not exists contact_email text,
  add column if not exists address text,
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists linkedin text,
  add column if not exists cover_photo_url text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists response_time text,
  add column if not exists starting_from text,
  add column if not exists about_details jsonb not null default '{}'::jsonb,
  add column if not exists business_details jsonb not null default '{}'::jsonb;

create or replace function public.get_profile_role(user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = user_id
  limit 1;
$$;

grant execute on function public.get_profile_role(uuid) to authenticated;

drop function if exists public.get_profile_briefs(uuid[]);

create or replace function public.get_profile_briefs(user_ids uuid[])
returns table (
  id uuid,
  full_name text,
  business_name text,
  avatar_url text,
  role text
)
language sql
stable
security definer
set search_path = public
as $$
  with requested as (
    select unnest(user_ids)::uuid as id
  )
  select
    req.id,
    coalesce(
      nullif(p.full_name, ''),
      nullif(u.raw_user_meta_data->>'full_name', ''),
      nullif(u.raw_user_meta_data->>'name', ''),
      nullif(split_part(coalesce(u.email, ''), '@', 1), '')
    ) as full_name,
    p.business_name,
    coalesce(
      nullif(p.avatar_url, ''),
      nullif(u.raw_user_meta_data->>'avatar_url', '')
    ) as avatar_url,
    coalesce(
      p.role,
      nullif(u.raw_user_meta_data->>'role', ''),
      'homeowner'
    ) as role
  from requested req
  left join public.profiles p on p.id = req.id
  left join auth.users u on u.id = req.id
  where p.id is not null or u.id is not null;
$$;

grant execute on function public.get_profile_briefs(uuid[]) to authenticated;

create or replace function public.get_profile_brief(user_id uuid)
returns table (
  id uuid,
  full_name text,
  business_name text,
  avatar_url text,
  role text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(p.id, u.id) as id,
    coalesce(
      nullif(p.full_name, ''),
      nullif(u.raw_user_meta_data->>'full_name', ''),
      nullif(u.raw_user_meta_data->>'name', ''),
      nullif(split_part(coalesce(u.email, ''), '@', 1), '')
    ) as full_name,
    p.business_name,
    coalesce(
      nullif(p.avatar_url, ''),
      nullif(u.raw_user_meta_data->>'avatar_url', '')
    ) as avatar_url,
    coalesce(
      p.role,
      nullif(u.raw_user_meta_data->>'role', ''),
      'homeowner'
    ) as role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = user_id
  limit 1;
$$;

grant execute on function public.get_profile_brief(uuid) to authenticated;

create or replace function public.get_unread_message_count()
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_uid uuid := auth.uid();
  unread_count integer := 0;
begin
  if current_uid is null then
    return 0;
  end if;

  select count(*)
    into unread_count
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where (c.homeowner_id = current_uid or c.designer_id = current_uid)
    and m.sender_id <> current_uid
    and m.read_at is null;

  return coalesce(unread_count, 0);
end
$$;

grant execute on function public.get_unread_message_count() to authenticated;

create or replace function public.mark_conversation_read(conversation_uuid uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  current_uid uuid := auth.uid();
  updated_count integer := 0;
begin
  if current_uid is null or conversation_uuid is null then
    return 0;
  end if;

  if not exists (
    select 1
    from public.conversations c
    where c.id = conversation_uuid
      and (c.homeowner_id = current_uid or c.designer_id = current_uid)
  ) then
    return 0;
  end if;

  update public.messages m
     set read_at = now()
   where m.conversation_id = conversation_uuid
     and m.sender_id <> current_uid
     and m.read_at is null;

  get diagnostics updated_count = row_count;
  return coalesce(updated_count, 0);
end
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  design_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  homeowner_id uuid not null references auth.users(id) on delete cascade,
  designer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages
  add column if not exists read_at timestamptz;

create index if not exists conversations_homeowner_idx
on public.conversations (homeowner_id);

create index if not exists conversations_designer_idx
on public.conversations (designer_id);

create index if not exists messages_conversation_created_idx
on public.messages (conversation_id, created_at);

create index if not exists messages_unread_idx
on public.messages (conversation_id, read_at)
where read_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_homeowner_designer_different'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_homeowner_designer_different
      check (homeowner_id <> designer_id);
  end if;
end
$$;

create table if not exists public.designer_projects (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  project_type text,
  location text,
  description text,
  tags text[] not null default '{}',
  color_palette text[] not null default '{}',
  budget_level text,
  is_published boolean not null default false,
  cover_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.designer_project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.designer_projects(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.designer_reviews (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null references auth.users(id) on delete cascade,
  homeowner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.designer_projects(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  work_quality_rating numeric(2,1),
  communication_rating numeric(2,1),
  value_rating numeric(2,1),
  review_text text not null,
  reply_text text,
  helpful_count int not null default 0,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_designers (
  id uuid primary key default gen_random_uuid(),
  homeowner_id uuid not null references auth.users(id) on delete cascade,
  designer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (homeowner_id, designer_id)
);

alter table public.designer_projects
  add column if not exists tags text[] not null default '{}',
  add column if not exists color_palette text[] not null default '{}',
  add column if not exists budget_level text,
  add column if not exists is_published boolean not null default false;

alter table public.designer_projects
  alter column is_published set default false;

alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.designer_projects enable row level security;
alter table public.designer_project_images enable row level security;
alter table public.designer_reviews enable row level security;
alter table public.saved_designers enable row level security;

drop policy if exists "profiles: owner can read own row" on public.profiles;
drop policy if exists "profiles: owner can update own row" on public.profiles;
drop policy if exists "profiles: owner can insert own row" on public.profiles;
drop policy if exists "collections: owner full access" on public.collections;
drop policy if exists "collection_items: owner full access" on public.collection_items;
drop policy if exists "conversations: participant can read" on public.conversations;
drop policy if exists "conversations: participant can insert" on public.conversations;
drop policy if exists "messages: participant can read" on public.messages;
drop policy if exists "messages: participant can insert" on public.messages;
drop policy if exists "designer_projects: owner full access" on public.designer_projects;
drop policy if exists "designer_project_images: owner full access" on public.designer_project_images;
drop policy if exists "designer_reviews: homeowners can insert" on public.designer_reviews;
drop policy if exists "designer_reviews: public read" on public.designer_reviews;
drop policy if exists "designer_reviews: designer can reply pin" on public.designer_reviews;
drop policy if exists "designer_reviews: homeowner can update own" on public.designer_reviews;
drop policy if exists "designer_reviews: homeowner can delete own" on public.designer_reviews;
drop policy if exists "saved_designers: homeowner full access" on public.saved_designers;

create policy "profiles: owner can read own row"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "profiles: owner can update own row"
on public.profiles for update
to authenticated
using (auth.uid() = id);

create policy "profiles: owner can insert own row"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "collections: owner full access"
on public.collections for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "collection_items: owner full access"
on public.collection_items for all
to authenticated
using (
  exists (
    select 1
    from public.collections c
    where c.id = collection_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.collections c
    where c.id = collection_id
      and c.user_id = auth.uid()
  )
);

create policy "conversations: participant can read"
on public.conversations for select
to authenticated
using (
  (auth.uid() = homeowner_id or auth.uid() = designer_id)
  and public.get_profile_role(homeowner_id) = 'homeowner'
  and public.get_profile_role(designer_id) in ('designer', 'designer_pending')
);

create policy "conversations: participant can insert"
on public.conversations for insert
to authenticated
with check (
  auth.uid() = homeowner_id
  and homeowner_id <> designer_id
  and public.get_profile_role(homeowner_id) = 'homeowner'
  and public.get_profile_role(designer_id) in ('designer', 'designer_pending')
);

create policy "messages: participant can read"
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and public.get_profile_role(c.homeowner_id) = 'homeowner'
      and public.get_profile_role(c.designer_id) in ('designer', 'designer_pending')
      and (c.homeowner_id = auth.uid() or c.designer_id = auth.uid())
  )
);

create policy "messages: participant can insert"
on public.messages for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and public.get_profile_role(c.homeowner_id) = 'homeowner'
      and public.get_profile_role(c.designer_id) in ('designer', 'designer_pending')
      and (c.homeowner_id = auth.uid() or c.designer_id = auth.uid())
  )
);

create policy "designer_projects: owner full access"
on public.designer_projects for all
to authenticated
using (auth.uid() = designer_id)
with check (auth.uid() = designer_id);

create policy "designer_project_images: owner full access"
on public.designer_project_images for all
to authenticated
using (
  exists (
    select 1
    from public.designer_projects p
    where p.id = project_id
      and p.designer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.designer_projects p
    where p.id = project_id
      and p.designer_id = auth.uid()
  )
);

create policy "designer_reviews: homeowners can insert"
on public.designer_reviews for insert
to authenticated
with check (auth.uid() = homeowner_id);

create policy "designer_reviews: public read"
on public.designer_reviews for select
to authenticated
using (true);

create policy "designer_reviews: designer can reply pin"
on public.designer_reviews for update
to authenticated
using (auth.uid() = designer_id)
with check (auth.uid() = designer_id);

create policy "designer_reviews: homeowner can update own"
on public.designer_reviews for update
to authenticated
using (auth.uid() = homeowner_id)
with check (auth.uid() = homeowner_id);

create policy "designer_reviews: homeowner can delete own"
on public.designer_reviews for delete
to authenticated
using (auth.uid() = homeowner_id);

create policy "saved_designers: homeowner full access"
on public.saved_designers for all
to authenticated
using (auth.uid() = homeowner_id)
with check (auth.uid() = homeowner_id);
