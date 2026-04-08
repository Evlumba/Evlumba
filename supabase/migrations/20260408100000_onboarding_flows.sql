-- Onboarding flows for post-login walkthroughs

create table if not exists public.onboarding_flows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_role text not null default 'homeowner' check (target_role in ('homeowner', 'designer', 'all')),
  is_active boolean not null default false,
  max_impressions_per_user int not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.onboarding_flows(id) on delete cascade,
  step_order int not null default 0,
  title text not null,
  body text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists onboarding_steps_flow_order_idx
on public.onboarding_steps (flow_id, step_order);

alter table public.onboarding_flows enable row level security;
alter table public.onboarding_steps enable row level security;

-- Public read for active flows
drop policy if exists "onboarding_flows: public read active" on public.onboarding_flows;
create policy "onboarding_flows: public read active"
on public.onboarding_flows for select
using (is_active = true);

drop policy if exists "onboarding_steps: public read" on public.onboarding_steps;
create policy "onboarding_steps: public read"
on public.onboarding_steps for select
using (true);

grant select on table public.onboarding_flows to anon, authenticated;
grant select on table public.onboarding_steps to anon, authenticated;
