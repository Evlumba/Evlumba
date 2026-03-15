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
  select coalesce(
    nullif(p.role, ''),
    nullif(u.raw_user_meta_data->>'role', ''),
    'homeowner'
  )
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = user_id
  limit 1;
$$;

grant execute on function public.get_profile_role(uuid) to authenticated;

drop function if exists public.can_message_pair(uuid, uuid);

create or replace function public.can_message_pair(homeowner_uuid uuid, designer_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    (
      public.get_profile_role(homeowner_uuid) = 'homeowner'
      and public.get_profile_role(designer_uuid) in ('designer', 'designer_pending')
    )
    or
    (
      public.get_profile_role(homeowner_uuid) in ('designer', 'designer_pending')
      and public.get_profile_role(designer_uuid) in ('designer', 'designer_pending')
    )
  );
$$;

grant execute on function public.can_message_pair(uuid, uuid) to authenticated;

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

create table if not exists public.designer_project_shop_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.designer_projects(id) on delete cascade,
  image_url text not null,
  pos_x numeric(5,2) not null check (pos_x >= 0 and pos_x <= 100),
  pos_y numeric(5,2) not null check (pos_y >= 0 and pos_y <= 100),
  product_url text not null,
  product_title text,
  product_image_url text,
  product_price text,
  created_at timestamptz not null default now()
);

create index if not exists designer_project_shop_links_project_idx
on public.designer_project_shop_links (project_id);

create table if not exists public.forum_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lumba_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists forum_members_lumba_name_unique_idx
on public.forum_members (lower(lumba_name));

create table if not exists public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  created_by uuid references public.forum_members(user_id) on delete set null,
  starter_body text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  last_post_at timestamptz not null default now()
);

alter table public.forum_topics
  add column if not exists is_pinned boolean not null default false,
  add column if not exists starter_body text;

create index if not exists forum_topics_last_post_idx
on public.forum_topics (last_post_at desc);

create index if not exists forum_topics_pin_last_post_idx
on public.forum_topics (is_pinned desc, last_post_at desc);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  author_id uuid not null references public.forum_members(user_id) on delete cascade,
  parent_post_id uuid references public.forum_posts(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.forum_posts
  add column if not exists updated_at timestamptz not null default now();

create index if not exists forum_posts_topic_created_idx
on public.forum_posts (topic_id, created_at);

create index if not exists forum_posts_parent_idx
on public.forum_posts (parent_post_id);

create or replace function public.touch_forum_members_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists forum_members_touch_updated_at on public.forum_members;

create trigger forum_members_touch_updated_at
before update on public.forum_members
for each row
execute function public.touch_forum_members_updated_at();

create or replace function public.touch_forum_topic_last_post_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.forum_topics
     set last_post_at = new.created_at
   where id = new.topic_id;

  return new;
end
$$;

create or replace function public.touch_forum_post_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create or replace function public.forum_parent_post_matches_topic(parent_id uuid, topic_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when parent_id is null then true
    else exists (
      select 1
      from public.forum_posts p
      where p.id = parent_id
        and p.topic_id = topic_uuid
    )
  end;
$$;

grant execute on function public.forum_parent_post_matches_topic(uuid, uuid) to authenticated;

drop trigger if exists forum_posts_touch_topic_last_post on public.forum_posts;
drop trigger if exists forum_posts_touch_updated_at on public.forum_posts;

create trigger forum_posts_touch_topic_last_post
after insert on public.forum_posts
for each row
execute function public.touch_forum_topic_last_post_at();

create trigger forum_posts_touch_updated_at
before update on public.forum_posts
for each row
execute function public.touch_forum_post_updated_at();

insert into public.forum_topics (slug, title, is_pinned, starter_body)
values
  (
    'evlumbada-nasil-para-kazanabilirim',
    'Evlumba''da nasıl para kazanabilirim',
    true,
    $$**Evlumba''da para kazanmanın iki güçlü yolu var:** görünürlükten müşteri kazanmak ve shopable linklerle satış ortaklığı geliri elde etmek.

1. **Projelerini sergileyerek ücretsiz şekilde müşteri kazanabilirsin.**
**Nasıl yapılır:** Profesyonel hesaba geç, profilini tamamla, Projelerim > Yeni Proje Ekle adımından başlık, açıklama, görseller, etiketler ve bütçe bilgilerini gir. Sonrasında projeyi yayınla ve görünürlüğünü artır.

2. **Projelerine ürün linki ekleyerek satış başına gelir elde edebilirsin.**
**Nasıl yapılır:** Projeni taslak veya düzenleme modunda aç, Ürün Ekle ile görsel üzerinde shopable etiket bırak, ürün linkini ekle ve kaydet. Affiliate/ticari ortaklık linki kullanıyorsan satış oldukça komisyon alırsın.
**Not:** Ürün fiyatı veya ürün bilgisi değişirse projeyi tekrar **Taslağa Al** ve shopable etikette **Bilgi Çek** yaparak fiyat/görsel bilgisini güncelle.$$
  ),
  (
    'nasil-proje-olusturabilirim',
    'Nasıl proje oluşturabilirim',
    true,
    $$1. **Profesyonel hesaba geç ve profilini tamamla.**
Önce hesap rolün profesyonel olmalı. Profilinde uzmanlık, şehir, açıklama ve iletişim bilgilerini doldurman güven oluşturur.

2. **Projelerim sayfasına girip "Yeni Proje Ekle" ile başla.**
Proje başlığı, proje türü, konum, bütçe seviyesi, etiketler ve proje hikayesi alanlarını net şekilde doldur.

3. **Kapak ve galeri görsellerini yükle.**
Önce güçlü bir kapak görseli seç, sonra projeyi anlatan farklı açılardan galeri görselleri ekle.

4. **Önce taslak kaydet, sonra kontrol edip yayınla.**
Yazım, etiket, görsel sırası ve açıklamayı kontrol et. Hazır olduğunda yayınla, daha sonra tekrar düzenleyebilirsin.

5. **İstersen shopable ürün linkleri ekle.**
Taslak/düzenleme modunda görsel üstüne ürün etiketi bırakıp link ekleyebilirsin. Ürün bilgisi değişirse projeyi tekrar **Taslağa Al** ve **Bilgi Çek** ile güncelle.

**İpucu:** Başlık + kısa hikaye + net görseller + doğru etiket kombinasyonu, projeni keşfette daha görünür yapar.$$
  ),
  (
    'evlumba-ucretli-mi',
    'Evlumba ücretli mi',
    true,
    $$**Kısa cevap: Evlumba şu an ücretsiz.**

1. **Ev sahipleri için:** Keşfetme, kaydetme ve tasarımcılarla iletişim kurma ücretsiz.
2. **Profesyoneller için:** Profil oluşturma, proje yayınlama ve görünürlük kazanma ücretsiz.
3. **Shopable özellik:** Projelere ürün linki eklemek ücretsizdir; gelir modeli bağlı olduğun satış/affiliate programının komisyon kurallarına göre çalışır.

**Not:** İleride ücretli bir özellik olursa önceden açık şekilde duyurulur.$$
  )
on conflict (slug) do update
set
  title = excluded.title,
  is_pinned = true,
  starter_body = coalesce(excluded.starter_body, public.forum_topics.starter_body);

update public.forum_topics
   set is_pinned = false
 where is_pinned = true
   and slug not in (
     'evlumbada-nasil-para-kazanabilirim',
     'nasil-proje-olusturabilirim',
     'evlumba-ucretli-mi'
   );

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_role text not null default 'homeowner',
  listing_type text not null check (listing_type in ('need_service', 'offer_service')),
  title text not null,
  description text not null,
  city text not null,
  district text,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  needed_professions text[] not null default '{}',
  tags text[] not null default '{}',
  needed_within text not null default 'hemen' check (needed_within in ('hemen', '1_ay', '3_ay', 'arastiriyorum')),
  status text not null default 'published' check (status in ('draft', 'published', 'closed')),
  is_urgent boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings
  add column if not exists needed_within text not null default 'hemen';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_needed_within_check'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_needed_within_check
      check (needed_within in ('hemen', '1_ay', '3_ay', 'arastiriyorum'));
  end if;
end
$$;

create table if not exists public.listing_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  price_quote text,
  timeline text,
  status text not null default 'pending' check (status in ('pending', 'shortlisted', 'rejected', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, applicant_id)
);

create table if not exists public.listing_bookmarks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

create index if not exists listings_status_created_idx
on public.listings (status, created_at desc);

create index if not exists listings_owner_created_idx
on public.listings (owner_id, created_at desc);

create index if not exists listings_city_idx
on public.listings (lower(city));

create index if not exists listings_needed_professions_gin_idx
on public.listings using gin (needed_professions);

create index if not exists listings_tags_gin_idx
on public.listings using gin (tags);

create index if not exists listing_applications_listing_idx
on public.listing_applications (listing_id, created_at desc);

create index if not exists listing_applications_applicant_idx
on public.listing_applications (applicant_id, created_at desc);

create index if not exists listing_bookmarks_user_idx
on public.listing_bookmarks (user_id, created_at desc);

create or replace function public.touch_listings_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create or replace function public.touch_listing_applications_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists listings_touch_updated_at on public.listings;
drop trigger if exists listing_applications_touch_updated_at on public.listing_applications;

create trigger listings_touch_updated_at
before update on public.listings
for each row
execute function public.touch_listings_updated_at();

create trigger listing_applications_touch_updated_at
before update on public.listing_applications
for each row
execute function public.touch_listing_applications_updated_at();

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

drop function if exists public.get_designer_rating_stats(uuid[]);

create or replace function public.get_designer_rating_stats(designer_ids uuid[])
returns table (
  designer_id uuid,
  average_rating numeric(3,2),
  review_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  with requested as (
    select distinct unnest(coalesce(designer_ids, '{}'::uuid[]))::uuid as designer_id
  )
  select
    req.designer_id,
    coalesce(round(avg(r.rating)::numeric, 2), 0::numeric(3,2)) as average_rating,
    count(r.id)::integer as review_count
  from requested req
  left join public.designer_reviews r on r.designer_id = req.designer_id
  group by req.designer_id;
$$;

grant execute on function public.get_designer_rating_stats(uuid[]) to anon, authenticated;

alter table public.designer_projects
  add column if not exists tags text[] not null default '{}',
  add column if not exists color_palette text[] not null default '{}',
  add column if not exists budget_level text,
  add column if not exists is_published boolean not null default false;

alter table public.designer_projects
  alter column is_published set default false;

create or replace function public.enforce_profile_contact_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  account_email text;
  resolved_role text;
begin
  resolved_role := coalesce(new.role, old.role, 'homeowner');

  select u.email
    into account_email
  from auth.users u
  where u.id = new.id;

  if resolved_role = 'homeowner' then
    new.contact_email := account_email;
  elsif new.contact_email is null or btrim(new.contact_email) = '' then
    new.contact_email := account_email;
  end if;

  return new;
end
$$;

drop trigger if exists profiles_enforce_contact_email on public.profiles;

create trigger profiles_enforce_contact_email
before insert or update of role, contact_email, id
on public.profiles
for each row
execute function public.enforce_profile_contact_email();

update public.profiles p
   set contact_email = u.email
  from auth.users u
 where p.id = u.id
   and (
     p.role = 'homeowner'
     or p.contact_email is null
     or btrim(p.contact_email) = ''
   );

alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.designer_projects enable row level security;
alter table public.designer_project_images enable row level security;
alter table public.designer_project_shop_links enable row level security;
alter table public.forum_members enable row level security;
alter table public.forum_topics enable row level security;
alter table public.forum_posts enable row level security;
alter table public.listings enable row level security;
alter table public.listing_applications enable row level security;
alter table public.listing_bookmarks enable row level security;
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
drop policy if exists "designer_project_shop_links: owner full access" on public.designer_project_shop_links;
drop policy if exists "forum_members: public read" on public.forum_members;
drop policy if exists "forum_members: professional can join" on public.forum_members;
drop policy if exists "forum_members: owner can update" on public.forum_members;
drop policy if exists "forum_members: owner can delete" on public.forum_members;
drop policy if exists "forum_topics: public read" on public.forum_topics;
drop policy if exists "forum_topics: members can insert" on public.forum_topics;
drop policy if exists "forum_posts: public read" on public.forum_posts;
drop policy if exists "forum_posts: members can insert" on public.forum_posts;
drop policy if exists "forum_posts: owner can edit within 5 min" on public.forum_posts;
drop policy if exists "listings: public read published or own" on public.listings;
drop policy if exists "listings: authenticated can insert" on public.listings;
drop policy if exists "listings: owner can update own" on public.listings;
drop policy if exists "listings: owner can delete own" on public.listings;
drop policy if exists "listing_applications: visible to participant" on public.listing_applications;
drop policy if exists "listing_applications: applicant can insert" on public.listing_applications;
drop policy if exists "listing_applications: applicant can update own" on public.listing_applications;
drop policy if exists "listing_applications: listing owner can update" on public.listing_applications;
drop policy if exists "listing_applications: applicant can delete own" on public.listing_applications;
drop policy if exists "listing_bookmarks: user full access" on public.listing_bookmarks;
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
  and public.can_message_pair(homeowner_id, designer_id)
);

create policy "conversations: participant can insert"
on public.conversations for insert
to authenticated
with check (
  auth.uid() = homeowner_id
  and homeowner_id <> designer_id
  and public.can_message_pair(homeowner_id, designer_id)
);

create policy "messages: participant can read"
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and public.can_message_pair(c.homeowner_id, c.designer_id)
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
      and public.can_message_pair(c.homeowner_id, c.designer_id)
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

create policy "designer_project_shop_links: owner full access"
on public.designer_project_shop_links for all
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

create policy "forum_members: public read"
on public.forum_members for select
to public
using (true);

create policy "forum_members: professional can join"
on public.forum_members for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.get_profile_role(auth.uid()) in ('designer', 'designer_pending')
  and char_length(btrim(lumba_name)) between 3 and 32
);

create policy "forum_members: owner can update"
on public.forum_members for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.get_profile_role(auth.uid()) in ('designer', 'designer_pending')
  and char_length(btrim(lumba_name)) between 3 and 32
);

create policy "forum_members: owner can delete"
on public.forum_members for delete
to authenticated
using (auth.uid() = user_id);

create policy "forum_topics: public read"
on public.forum_topics for select
to public
using (true);

create policy "forum_topics: members can insert"
on public.forum_topics for insert
to authenticated
with check (
  auth.uid() = created_by
  and exists (
    select 1
    from public.forum_members m
    where m.user_id = auth.uid()
  )
  and char_length(btrim(title)) between 3 and 160
  and char_length(btrim(slug)) between 3 and 180
);

create policy "forum_posts: public read"
on public.forum_posts for select
to public
using (true);

create policy "forum_posts: members can insert"
on public.forum_posts for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.forum_members m
    where m.user_id = author_id
  )
  and exists (
    select 1
    from public.forum_topics t
    where t.id = topic_id
  )
  and public.forum_parent_post_matches_topic(parent_post_id, topic_id)
  and char_length(btrim(body)) > 0
);

create policy "forum_posts: owner can edit within 5 min"
on public.forum_posts for update
to authenticated
using (
  auth.uid() = author_id
  and now() <= created_at + interval '5 minutes'
)
with check (
  auth.uid() = author_id
  and now() <= created_at + interval '5 minutes'
  and char_length(btrim(body)) > 0
);

grant select on table public.forum_members, public.forum_topics, public.forum_posts to anon, authenticated;
grant insert, update, delete on table public.forum_members to authenticated;
grant insert on table public.forum_topics, public.forum_posts to authenticated;
grant update on table public.forum_posts to authenticated;

create policy "listings: public read published or own"
on public.listings for select
to public
using (
  status = 'published'
  or auth.uid() = owner_id
);

create policy "listings: authenticated can insert"
on public.listings for insert
to authenticated
with check (
  auth.uid() = owner_id
  and public.get_profile_role(auth.uid()) in ('homeowner', 'designer', 'designer_pending')
  and listing_type in ('need_service', 'offer_service')
  and needed_within in ('hemen', '1_ay', '3_ay', 'arastiriyorum')
  and status in ('draft', 'published', 'closed')
  and char_length(btrim(title)) between 5 and 160
  and char_length(btrim(description)) between 10 and 5000
  and char_length(btrim(city)) between 2 and 120
);

create policy "listings: owner can update own"
on public.listings for update
to authenticated
using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and listing_type in ('need_service', 'offer_service')
  and needed_within in ('hemen', '1_ay', '3_ay', 'arastiriyorum')
  and status in ('draft', 'published', 'closed')
  and char_length(btrim(title)) between 5 and 160
  and char_length(btrim(description)) between 10 and 5000
  and char_length(btrim(city)) between 2 and 120
);

create policy "listings: owner can delete own"
on public.listings for delete
to authenticated
using (auth.uid() = owner_id);

create policy "listing_applications: visible to participant"
on public.listing_applications for select
to authenticated
using (
  auth.uid() = applicant_id
  or exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.owner_id = auth.uid()
  )
);

create policy "listing_applications: applicant can insert"
on public.listing_applications for insert
to authenticated
with check (
  auth.uid() = applicant_id
  and public.get_profile_role(auth.uid()) in ('designer', 'designer_pending')
  and char_length(btrim(message)) between 5 and 4000
  and exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.owner_id <> auth.uid()
      and l.listing_type = 'need_service'
      and l.status = 'published'
      and (l.expires_at is null or l.expires_at > now())
  )
);

create policy "listing_applications: applicant can update own"
on public.listing_applications for update
to authenticated
using (
  auth.uid() = applicant_id
  and status = 'pending'
)
with check (
  auth.uid() = applicant_id
  and status = 'pending'
  and char_length(btrim(message)) between 5 and 4000
);

create policy "listing_applications: listing owner can update"
on public.listing_applications for update
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.owner_id = auth.uid()
  )
  and status in ('pending', 'shortlisted', 'rejected', 'accepted')
  and char_length(btrim(message)) between 5 and 4000
);

create policy "listing_applications: applicant can delete own"
on public.listing_applications for delete
to authenticated
using (auth.uid() = applicant_id);

create policy "listing_bookmarks: user full access"
on public.listing_bookmarks for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select on table public.listings to anon, authenticated;
grant insert, update, delete on table public.listings to authenticated;
grant select on table public.listing_applications to authenticated;
grant insert, update, delete on table public.listing_applications to authenticated;
grant select, insert, update, delete on table public.listing_bookmarks to authenticated;

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
