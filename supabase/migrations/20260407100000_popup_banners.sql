-- Popup banner system

create table if not exists public.popup_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  link_url text,
  is_active boolean not null default false,
  max_impressions_per_user int not null default 3,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.popup_banners enable row level security;

-- Everyone can read active popups
drop policy if exists "popup_banners: public read active" on public.popup_banners;
create policy "popup_banners: public read active"
on public.popup_banners for select
using (
  is_active = true
  and start_date <= now()
  and (end_date is null or end_date >= now())
);

grant select on table public.popup_banners to anon, authenticated;
