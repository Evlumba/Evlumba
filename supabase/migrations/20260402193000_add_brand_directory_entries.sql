create table if not exists public.brand_directory_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('mobilya', 'dekorasyon', 'aydınlatma', 'tekstil', 'yapı-market')),
  summary text not null,
  banner_image_url text,
  sort_order integer not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_directory_entries_sort_idx
  on public.brand_directory_entries (sort_order asc, name asc);

alter table public.brand_directory_entries enable row level security;

drop policy if exists "brand_directory_entries: public read" on public.brand_directory_entries;
create policy "brand_directory_entries: public read"
on public.brand_directory_entries
for select
using (true);

drop policy if exists "brand_directory_entries: admin write" on public.brand_directory_entries;
create policy "brand_directory_entries: admin write"
on public.brand_directory_entries
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role in ('admin', 'super_admin')
  )
);

insert into public.brand_directory_entries (slug, name, category, summary, sort_order)
select
  v.slug,
  v.name,
  v.category,
  v.summary,
  v.row_no
from (
  values
    (1, 'ikea','IKEA','mobilya','Modüler mobilya ve depolama çözümleri.'),
    (2, 'koctas','Koçtaş','yapı-market','Ev geliştirme ve dekorasyon ürünleri.'),
    (3, 'tepe-home','Tepe Home','mobilya','Modern mobilya ve yaşam alanı koleksiyonları.'),
    (4, 'vivense','Vivense','mobilya','Online mobilya ve dekorasyon ürünleri.'),
    (5, 'enzahome','Enza Home','mobilya','Salon, yatak odası ve tamamlayıcı ürünler.'),
    (6, 'bellona','Bellona','mobilya','Ev mobilyası ve uyku ürünleri.'),
    (7, 'istikbal','İstikbal','mobilya','Mobilya, baza ve tekstil çözümleri.'),
    (8, 'dogtas','Doğtaş','mobilya','Yaşam alanı odaklı mobilya koleksiyonları.'),
    (9, 'kelebek','Kelebek Mobilya','mobilya','Fonksiyonel mobilya ve depolama.'),
    (10, 'mondi','Mondi Home','mobilya','Oturma grubu, yemek odası ve yatak odası ürünleri.'),
    (11, 'lazzoni','Lazzoni','mobilya','Premium mobilya ve iç mekan ürünleri.'),
    (12, 'mudo-concept','Mudo Concept','dekorasyon','Dekoratif ürünler ve ev yaşam koleksiyonları.'),
    (13, 'english-home','English Home','tekstil','Ev tekstili ve dekoratif aksesuarlar.'),
    (14, 'madame-coco','Madame Coco','tekstil','Ev tekstili ve mutfak ürünleri.'),
    (15, 'karaca-home','Karaca Home','tekstil','Ev tekstili ve sofra ürünleri.'),
    (16, 'linens','Linens','tekstil','Nevresim, perde ve ev tekstili ürünleri.'),
    (17, 'chakra','Chakra','tekstil','Doğal ev tekstili ve banyo ürünleri.'),
    (18, 'zara-home','Zara Home','dekorasyon','Dekorasyon ve ev yaşam ürünleri.'),
    (19, 'h-m-home','H&M Home','dekorasyon','Ev aksesuarı ve tekstil koleksiyonları.'),
    (20, 'jysk','JYSK','mobilya','İskandinav tarzı mobilya ve ev ürünleri.'),
    (21, 'evidea','Evidea','dekorasyon','Ev düzenleme, mutfak ve dekorasyon ürünleri.'),
    (22, 'home-sweet-home','Home Sweet Home','tekstil','Perde ve ev tekstili çözümleri.'),
    (23, 'icf','ICF','mobilya','Ofis ve yaşam alanı mobilya ürünleri.'),
    (24, 'hamm-design','Hamm Design','dekorasyon','Dekoratif obje ve ev aksesuarları.'),
    (25, 'westwing','Westwing','dekorasyon','Dekorasyon ve lifestyle ürünleri.'),
    (26, 'crate-and-barrel','Crate & Barrel','dekorasyon','Modern ev dekorasyonu ve mobilya.'),
    (27, 'pottery-barn','Pottery Barn','mobilya','Klasik-modern mobilya ve ev dekorasyonu.'),
    (28, 'bo-concept','BoConcept','mobilya','Modern Danimarka mobilya çözümleri.'),
    (29, 'kartell','Kartell','mobilya','Tasarım odaklı çağdaş mobilya ürünleri.'),
    (30, 'vitra','Vitra','mobilya','Tasarım ve ergonomi odaklı mobilya.'),
    (31, 'isiklar','Işıklar','aydınlatma','Dekoratif aydınlatma ürünleri.'),
    (32, 'philips-lighting','Philips Lighting','aydınlatma','Akıllı ve fonksiyonel aydınlatma çözümleri.'),
    (33, 'eglo','EGLO','aydınlatma','İç mekan ve dış mekan aydınlatma ürünleri.'),
    (34, 'avonni','Avonni','aydınlatma','Dekoratif avize ve aydınlatma koleksiyonları.'),
    (35, 'nordmende','Nordmende Lighting','aydınlatma','Minimal ve modern aydınlatma ürünleri.'),
    (36, 'fuga-mobilya','Fuga Mobilya','mobilya','Modern çizgide yaşam alanı mobilyaları.'),
    (37, 'bykepi','ByKepi','dekorasyon','Dekoratif tamamlayıcı ve aksesuar ürünleri.'),
    (38, 'tefal-home','Tefal Home','dekorasyon','Mutfak ve ev içi fonksiyonel ürünler.'),
    (39, 'nurus','Nurus','mobilya','Ofis ve ev için tasarım odaklı mobilya.'),
    (40, 'koleksiyon','Koleksiyon','mobilya','Mimari ve mobilya tasarım çözümleri.'),
    (41, 'hazeran','Hazeran','dekorasyon','Doğal malzeme odaklı dekorasyon ürünleri.'),
    (42, 'paulmark','Paulmark','mobilya','Mutfak ve yaşam alanı mobilya çözümleri.'),
    (43, 'sahrai','Sahrai','dekorasyon','Premium halı ve zemin dekorasyon çözümleri.'),
    (44, 'saray-hali','Saray Halı','dekorasyon','Halı ve zemin ürünleri.'),
    (45, 'merinos','Merinos','dekorasyon','Halı ve ev tekstili ürünleri.'),
    (46, 'yatas-bedding','Yataş Bedding','mobilya','Uyku ürünleri ve yatak çözümleri.'),
    (47, 'almila','Almila','mobilya','Genç odası ve fonksiyonel mobilya çözümleri.'),
    (48, 'idconline','IDCONline','dekorasyon','Dekoratif obje ve ev yaşam ürünleri.'),
    (49, 'kiwi-home','Kiwi Home','dekorasyon','Ev düzenleme ve küçük dekoratif ürünler.')
) as v(row_no, slug, name, category, summary)
where not exists (
  select 1
  from public.brand_directory_entries existing
  where existing.slug = v.slug
);
