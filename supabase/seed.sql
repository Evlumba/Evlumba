-- Optional demo seed (run after schema.sql)
-- Requires the two auth users to exist.
-- Demo users used by the script:
--   demo.homeowner@evlumba.com
--   demo.designer@evlumba.com

insert into public.profiles (id, full_name, role)
select u.id, 'Demo Ev Sahibi', 'homeowner'
from auth.users u
where u.email = 'demo.homeowner@evlumba.com'
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role;

insert into public.profiles (id, full_name, role)
select u.id, 'Demo Profesyonel', 'designer'
from auth.users u
where u.email = 'demo.designer@evlumba.com'
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role;

with ids as (
  select
    (select id from auth.users where email = 'demo.homeowner@evlumba.com' limit 1) as homeowner_id,
    (select id from auth.users where email = 'demo.designer@evlumba.com' limit 1) as designer_id
), conv as (
  insert into public.conversations (homeowner_id, designer_id)
  select homeowner_id, designer_id
  from ids
  where homeowner_id is not null and designer_id is not null
  on conflict do nothing
  returning id
), selected_conv as (
  select id from conv
  union all
  select c.id
  from public.conversations c
  join ids i on c.homeowner_id = i.homeowner_id and c.designer_id = i.designer_id
  limit 1
)
insert into public.messages (conversation_id, sender_id, body)
select sc.id, i.homeowner_id, 'Merhaba, salon yenilemesi için teklif almak istiyorum.'
from selected_conv sc
cross join ids i
where i.homeowner_id is not null
  and not exists (
    select 1 from public.messages m
    where m.conversation_id = sc.id
  )
union all
select sc.id, i.designer_id, 'Merhaba, memnuniyetle yardımcı olurum. Metrekare ve bütçe paylaşabilir misiniz?'
from selected_conv sc
cross join ids i
where i.designer_id is not null
  and not exists (
    select 1 from public.messages m
    where m.conversation_id = sc.id
  );
