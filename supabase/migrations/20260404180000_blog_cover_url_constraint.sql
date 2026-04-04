-- Replace the old 3M-char constraint with a strict URL-only check.
-- This prevents base64 data URIs from being stored in cover_image_url.

do $$
begin
  -- Drop old constraint
  if exists (
    select 1
    from pg_constraint
    where conname = 'blog_posts_cover_image_url_max_len'
      and conrelid = 'public.blog_posts'::regclass
  ) then
    alter table public.blog_posts drop constraint blog_posts_cover_image_url_max_len;
  end if;

  -- Add new constraint: HTTPS URL only, max 2048 chars
  if not exists (
    select 1
    from pg_constraint
    where conname = 'blog_posts_cover_image_url_valid'
      and conrelid = 'public.blog_posts'::regclass
  ) then
    alter table public.blog_posts
      add constraint blog_posts_cover_image_url_valid
      check (
        cover_image_url is null
        or (
          char_length(cover_image_url) <= 2048
          and cover_image_url like 'https://%'
        )
      );
  end if;
end
$$;
