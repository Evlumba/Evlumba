-- Candidate career jobs and applications tables

create table if not exists public.career_job_posts (
  id uuid primary key default gen_random_uuid(),
  position text,
  summary text,
  responsibilities text,
  requirements text,
  city text,
  work_mode text,
  status text not null default 'published' check (status in ('draft', 'published', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.career_job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.career_job_posts(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'applied',
  created_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index if not exists career_job_posts_status_created_idx
on public.career_job_posts (status, created_at desc);

create index if not exists career_job_applications_applicant_created_idx
on public.career_job_applications (applicant_id, created_at desc);

create index if not exists career_job_applications_job_created_idx
on public.career_job_applications (job_id, created_at desc);

create or replace function public.touch_career_job_posts_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists career_job_posts_touch_updated_at on public.career_job_posts;

create trigger career_job_posts_touch_updated_at
before update on public.career_job_posts
for each row
execute function public.touch_career_job_posts_updated_at();

alter table public.career_job_posts enable row level security;
alter table public.career_job_applications enable row level security;

drop policy if exists "career_job_posts: public read published" on public.career_job_posts;
drop policy if exists "career_job_applications: applicant can read own" on public.career_job_applications;
drop policy if exists "career_job_applications: applicant can insert own" on public.career_job_applications;

create policy "career_job_posts: public read published"
on public.career_job_posts for select
using (status = 'published');

create policy "career_job_applications: applicant can read own"
on public.career_job_applications for select
to authenticated
using (auth.uid() = applicant_id);

create policy "career_job_applications: applicant can insert own"
on public.career_job_applications for insert
to authenticated
with check (
  auth.uid() = applicant_id
  and exists (
    select 1
    from public.career_job_posts j
    where j.id = job_id
      and j.status = 'published'
  )
);

grant select on table public.career_job_posts to anon, authenticated;
grant select, insert on table public.career_job_applications to authenticated;
