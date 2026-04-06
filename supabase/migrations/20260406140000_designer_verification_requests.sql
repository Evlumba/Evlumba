-- Designer verification requests table

create table if not exists public.designer_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  evlumba_url text not null,
  email text not null,
  petition text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists designer_verification_requests_status_idx
on public.designer_verification_requests (status, created_at desc);

alter table public.designer_verification_requests enable row level security;

-- Add is_verified column to profiles if not exists
alter table public.profiles add column if not exists is_verified boolean not null default false;
