-- Auto-generate slug for profiles on INSERT/UPDATE

create or replace function public.generate_profile_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  raw_name text;
  base_slug text;
  candidate text;
  counter int := 0;
begin
  -- Skip if slug already set and name didn't change
  if tg_op = 'UPDATE'
     and new.slug is not null
     and btrim(new.slug) <> ''
     and new.full_name is not distinct from old.full_name
     and new.business_name is not distinct from old.business_name
  then
    return new;
  end if;

  -- Pick display name: full_name > business_name > 'mimar'
  raw_name := coalesce(nullif(btrim(new.full_name), ''), nullif(btrim(new.business_name), ''), 'mimar');

  -- Slugify: Turkish chars, lowercase, only alphanum+hyphen
  base_slug := lower(raw_name);
  base_slug := replace(base_slug, 'ı', 'i');
  base_slug := replace(base_slug, 'ğ', 'g');
  base_slug := replace(base_slug, 'ü', 'u');
  base_slug := replace(base_slug, 'ş', 's');
  base_slug := replace(base_slug, 'ö', 'o');
  base_slug := replace(base_slug, 'ç', 'c');
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');

  if base_slug = '' then
    base_slug := 'mimar';
  end if;

  -- Find unique slug
  candidate := base_slug;
  loop
    if not exists (
      select 1 from public.profiles
      where slug = candidate and id <> new.id
    ) then
      new.slug := candidate;
      return new;
    end if;
    counter := counter + 1;
    candidate := base_slug || counter::text;
  end loop;
end
$$;

-- Drop old trigger if exists
drop trigger if exists profiles_auto_slug on public.profiles;

-- Create trigger: runs on INSERT and on UPDATE of name fields
create trigger profiles_auto_slug
before insert or update of full_name, business_name on public.profiles
for each row
execute function public.generate_profile_slug();

