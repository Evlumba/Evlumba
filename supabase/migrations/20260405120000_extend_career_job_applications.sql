-- Extend career applications with candidate form fields and optional CV uploads.

alter table public.career_job_applications
  add column if not exists full_name text,
  add column if not exists linkedin_url text,
  add column if not exists employment_status text,
  add column if not exists consent_approved boolean default false,
  add column if not exists cv_file_path text,
  add column if not exists cv_file_name text,
  add column if not exists cv_content_type text,
  add column if not exists cv_size_bytes bigint;

update public.career_job_applications
set consent_approved = false
where consent_approved is null;

alter table public.career_job_applications
  alter column consent_approved set default false;

alter table public.career_job_applications
  alter column consent_approved set not null;

alter table public.career_job_applications
  drop constraint if exists career_job_applications_employment_status_check;

alter table public.career_job_applications
  add constraint career_job_applications_employment_status_check
  check (
    employment_status is null
    or employment_status in ('öğrenci', 'mezun', 'tam zamanlı', 'yarı zamanlı', 'iş sahibi', 'diğer')
  );

drop policy if exists "career_job_applications: applicant can insert own" on public.career_job_applications;

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
  and nullif(trim(full_name), '') is not null
  and nullif(trim(linkedin_url), '') is not null
  and linkedin_url ~* '^https?://.+$'
  and employment_status in ('öğrenci', 'mezun', 'tam zamanlı', 'yarı zamanlı', 'iş sahibi', 'diğer')
  and consent_approved is true
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'career-cvs',
  'career-cvs',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "career_cvs: applicants upload own" on storage.objects;
drop policy if exists "career_cvs: applicants view own" on storage.objects;
drop policy if exists "career_cvs: applicants delete own" on storage.objects;

create policy "career_cvs: applicants upload own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'career-cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "career_cvs: applicants view own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'career-cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "career_cvs: applicants delete own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'career-cvs'
  and auth.uid()::text = (storage.foldername(name))[1]
);
