export const designers = [
  {
    id: "d1",
    name: "Mina Interiors",
    slug: "mina-interiors",
    city: "İstanbul",
    coverUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    tags: ["Modern", "Minimal", "Küçük Ev"],
    style: "Modern",
    budget: "Orta",
    projects: [
      {
        pid: "p1",
        title: "Kompakt Salon Dönüşümü",
        room: "Salon",
        imageUrl:
          "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80",
      },
      {
        pid: "p2",
        title: "Aydınlık Mutfak – Beyaz & Ahşap",
        room: "Mutfak",
        imageUrl:
          "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1600&q=75",
      },
      {
        pid: "p3",
        title: "Yatak Odasında Minimal Dokunuş",
        room: "Yatak Odası",
        imageUrl:
          "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80",
      },
      {
        pid: "p4",
        title: "Küçük Banyo, Büyük Etki",
        room: "Banyo",
        imageUrl:
          "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    id: "d2",
    name: "Ege Studio",
    slug: "ege-studio",
    city: "İzmir",
    coverUrl:
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=80",
    tags: ["Akdeniz", "Doğal", "Ahşap"],
    style: "Akdeniz",
    budget: "Orta",
    projects: [
      {
        pid: "p1",
        title: "Akdeniz Esintili Teras",
        room: "Teras",
        imageUrl:
          "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1200&q=80",
      },
      {
        pid: "p2",
        title: "Doğal Işıklı Oturma Alanı",
        room: "Salon",
        imageUrl:
          "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      },
      {
        pid: "p3",
        title: "Ahşap Detaylı Mutfak",
        room: "Mutfak",
        imageUrl:
          "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?auto=format&fit=crop&w=1200&q=80",
      },
      {
        pid: "p4",
        title: "Sıcak Tonlu Çalışma Köşesi",
        room: "Çalışma",
        imageUrl:
          "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    id: "d3",
    name: "Anka Design",
    slug: "anka-design",
    city: "Ankara",
    coverUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
    tags: ["Loft", "Endüstriyel", "Kontrast"],
    style: "Endüstriyel",
    budget: "Premium",
    projects: [
      {
        pid: "p1",
        title: "Loft Salon – Tuğla & Metal",
        room: "Salon",
        imageUrl:
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
      },
      {
        pid: "p2",
        title: "Koyu Tonlu Mutfak",
        room: "Mutfak",
        imageUrl:
          "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&w=1200&q=80",
      },
      {
        pid: "p3",
        title: "Kontrast Yatak Odası",
        room: "Yatak Odası",
        imageUrl:
          "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80",
      },
      {
        pid: "p4",
        title: "Beton Dokulu Banyo",
        room: "Banyo",
        imageUrl:
          "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
];

export const filterOptions = {
  cities: ["İstanbul", "İzmir", "Ankara"],
  styles: ["Modern", "Akdeniz", "Endüstriyel"],
  budgets: ["Uygun", "Orta", "Premium"],
};
// ✅ EK: Ideas (tasarımlar) + /kesfet için filtre datası
export type RoomGroup = {
  id: string; // "Mutfak" gibi
  label: string;
  coverUrl: string;
  subs: string[];
};

export type Idea = {
  id: string;
  title: string;
  room: string;      // "Mutfak", "Banyo"...
  subRoom?: string;  // "Powder Room" gibi
  imageUrl: string;

  designerId: string;
  designerName: string;
  designerSlug: string; // Profil sayfasına yönlendirme için
  designerCity: string;
  designerStyle: string;
  designerBudget: string;

  desc: string;       // 1-2 satırlık kısa açıklama
  colors: string[];   // filtreleme demo
  popularity: number; // stable "popüler" sıralama
  createdAt: number;  // "yeni" ihtimali için (şimdilik popüler kullanacağız)
};

export const roomGroups: RoomGroup[] = [
  {
    id: "Mutfak",
    label: "Mutfak",
    coverUrl:
      "https://images.unsplash.com/photo-1556912167-f556f1f39faa?auto=format&fit=crop&w=800&q=80",
    subs: ["Mutfak", "Ada", "Dolap", "Tezgah", "Backsplash"],
  },
  {
    id: "Banyo",
    label: "Banyo",
    coverUrl:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80",
    subs: ["Banyo", "Master Bath", "Powder Room", "Duş", "Küvet"],
  },
  {
    id: "Salon",
    label: "Salon",
    coverUrl:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80",
    subs: ["Salon", "TV Ünitesi", "Koltuk", "Duvar", "Aydınlatma"],
  },
  {
    id: "Yatak Odası",
    label: "Yatak Odası",
    coverUrl:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
    subs: ["Yatak Odası", "Gardırop", "Başlık", "Komodin", "Tekstil"],
  },
  {
    id: "Antre",
    label: "Antre",
    coverUrl:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80",
    subs: ["Antre", "Vestiyer", "Ayna", "Ayakkabılık"],
  },
  {
    id: "Teras",
    label: "Teras",
    coverUrl:
      "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=800&q=80",
    subs: ["Teras", "Balkon", "Bahçe", "Oturma", "Bitki"],
  },
];

export const budgetOptions = [
  { id: "Ekonomik", label: "Ekonomik", icon: "₺" },
  { id: "Orta", label: "Orta", icon: "₺₺" },
  { id: "Üst", label: "Üst", icon: "₺₺₺" },
  { id: "Premium", label: "Premium", icon: "✦" },
];

export const colorOptions = ["Beyaz", "Bej", "Ahşap", "Siyah", "Yeşil", "Mavi"];

function hash01(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 1000) / 1000;
}

function pickColors(seed: string) {
  const a = Math.floor(hash01(seed) * colorOptions.length);
  const b = Math.floor(hash01(seed + "_x") * colorOptions.length);
  const c1 = colorOptions[a];
  const c2 = colorOptions[b];
  return c1 === c2 ? [c1] : [c1, c2];
}

function inferSubRoom(room: string, title: string) {
  const t = title.toLowerCase();
  if (room === "Banyo") {
    if (t.includes("master")) return "Master Bath";
    if (t.includes("powder")) return "Powder Room";
    if (t.includes("duş") || t.includes("shower")) return "Duş";
    if (t.includes("küvet") || t.includes("tub")) return "Küvet";
    return "Banyo";
  }
  if (room === "Mutfak") {
    if (t.includes("ada") || t.includes("island")) return "Ada";
    if (t.includes("tezgah") || t.includes("counter")) return "Tezgah";
    if (t.includes("dolap") || t.includes("cabinet")) return "Dolap";
    return "Mutfak";
  }
  return room;
}

function makeDesc(room: string, title: string) {
  // 1-2 satır, premium/temiz
  if (room === "Mutfak") return "Net hatlar, temiz tezgah dili ve doğru ışık dengesi.";
  if (room === "Banyo") return "Minimal detaylarla daha ferah ve ‘otel’ hissi veren kurgu.";
  if (room === "Salon") return "Konfor + estetik dengesi; küçük dokunuşlarla büyük etki.";
  if (room === "Yatak Odası") return "Sakin palet, dokular ve ışıkla daha ‘rahat’ atmosfer.";
  if (room === "Teras") return "Dış mekânda sıcak tonlar ve pratik yerleşim çözümü.";
  return "Uygulanabilir, karar odaklı ilham kurgusu.";
}

export const ideas: Idea[] = designers.flatMap((d: any) =>
  (d.projects ?? []).map((p: any, idx: number) => {
    const id = `${d.id}-${p.pid}`;
    const room = p.room ?? "Salon";
    const subRoom = inferSubRoom(room, p.title ?? "");
    const popularity = Math.floor(hash01(id) * 100000);

    // designer budget'ı 4 seviyeye oturt
    const budgetMap: Record<string, string> = {
      Uygun: "Ekonomik",
      Orta: "Orta",
      Premium: "Premium",
      Üst: "Üst",
    };
    const normalizedBudget = budgetMap[d.budget] ?? (d.budget === "Premium" ? "Premium" : "Orta");

    return {
      id,
      title: p.title,
      room,
      subRoom,
      imageUrl: p.imageUrl,
      designerId: d.id,
      designerName: d.name,
      designerSlug: d.slug,
      designerCity: d.city,
      designerStyle: d.style,
      designerBudget: normalizedBudget,
      desc: makeDesc(room, p.title),
      colors: pickColors(id),
      popularity,
      createdAt: Date.now() - idx * 1000 * 60 * 60 * 24,
    } as Idea;
  })
);
// --- EK: /kesfet (Ideas) datası + filtre şeması ---

export type ExploreRoomId =
  | "mutfak"
  | "banyo"
  | "salon"
  | "yatak-odasi"
  | "cocuk"
  | "ev-ofisi"
  | "balkon"
  | "antre";

export type ExploreIdea = {
  id: string;
  title: string;
  roomId: ExploreRoomId;
  roomLabel: string;
  subLabel?: string;

  style: string;
  color: string;

  // filtrede var, kartta göstermiyoruz
  budget: "Uygun" | "Orta" | "Premium" | "Lüks";

  city: string;

  imageUrl: string;
  designerId: string;
  designerName: string;
  designerSlug: string; // Profil sayfasına yönlendirme için
  designerAvatarUrl: string;
  designerRating: number; // Yıldız puanı
  designerReviews: number; // Yorum sayısı

  description: string;
  popularity: number; // default sıralama
  tags: string[]; // zevk sıralama için
};

export const exploreRooms: Array<{
  id: ExploreRoomId;
  label: string;
  coverUrl: string;
  sub?: string[];
}> = [
  {
    id: "mutfak",
    label: "Mutfak",
    coverUrl:
      "https://images.unsplash.com/photo-1556912167-f556f1f39faa?auto=format&fit=crop&w=1200&q=80",
    sub: ["Ada Mutfak", "U Tipi", "L Tipi", "Dolap", "Tezgah", "Aydınlatma"],
  },
  {
    id: "banyo",
    label: "Banyo",
    coverUrl:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80",
    sub: ["Master", "Küçük Banyo", "Duş", "Lavabo", "Depolama", "Ayna/Işık"],
  },
  {
    id: "salon",
    label: "Salon",
    coverUrl:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80",
    sub: ["TV Ünitesi", "Koltuk", "HalI", "Aydınlatma", "Duvar", "Düzen"],
  },
  {
    id: "yatak-odasi",
    label: "Yatak Odası",
    coverUrl:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80",
    sub: ["Gardırop", "Başlık", "Aydınlatma", "Renk", "Minimal", "Sıcak"],
  },
  {
    id: "cocuk",
    label: "Bebek & Çocuk",
    coverUrl:
      "https://images.unsplash.com/photo-1549648247-7d0d1d8b0b7a?auto=format&fit=crop&w=1200&q=80",
    sub: ["Bebek", "Okul", "Oyun", "Depolama", "Renk"],
  },
  {
    id: "ev-ofisi",
    label: "Ev Ofisi",
    coverUrl:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    sub: ["Masa", "Raf", "Işık", "Minimal", "Akustik"],
  },
  {
    id: "balkon",
    label: "Balkon",
    coverUrl:
      "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1200&q=80",
    sub: ["Mini Balkon", "Oturma", "Bitki", "Işık"],
  },
  {
    id: "antre",
    label: "Antre",
    coverUrl:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    sub: ["Askılık", "Ayakkabılık", "Ayna", "Depolama", "Dar Antre"],
  },
];

export const exploreFilterOptions = {
  styles: ["Modern", "Akdeniz", "Endüstriyel", "İskandinav", "Japandi", "Klasik"],
  colors: ["Beyaz", "Bej", "Ahşap", "Gri", "Siyah", "Yeşil", "Mavi"],
  budgets: ["Uygun", "Orta", "Premium", "Lüks"] as const,
  cities: ["İstanbul", "İzmir", "Ankara"],
};

// Basit seed “ideas” — kartların altına temiz designer + açıklama koyuyoruz
export const exploreIdeas: ExploreIdea[] = [
  {
    id: "i1",
    title: "Beyaz & Ahşap Mutfak — ferah düzen",
    roomId: "mutfak",
    roomLabel: "Mutfak",
    subLabel: "Tezgah",
    style: "Modern",
    color: "Ahşap",
    budget: "Orta",
    city: "İstanbul",
    imageUrl:
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1600&q=75",
    designerId: "d1",
    designerName: "Mina Interiors",
    designerSlug: "nora-interiors",
    designerAvatarUrl:
      "https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=256&q=80",
    designerRating: 4.9,
    designerReviews: 47,
    description:
      "Küçük mutfakta alanı açan beyaz yüzeyler + sıcak ahşap. Saklama hissi 'şık' görünürken kaybolmuyor.",
    popularity: 98,
    tags: ["Modern", "Beyaz", "Ahşap", "Minimal", "Ferah"],
  },
  {
    id: "i2",
    title: "Küçük Banyoda büyük etki",
    roomId: "banyo",
    roomLabel: "Banyo",
    subLabel: "Küçük Banyo",
    style: "Japandi",
    color: "Bej",
    budget: "Uygun",
    city: "İzmir",
    imageUrl:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1400&q=80",
    designerId: "d2",
    designerName: "Ege Studio",
    designerSlug: "linea-atelier",
    designerAvatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    designerRating: 4.8,
    designerReviews: 32,
    description:
      "Bej ton + sade çizgiler: küçük banyoda 'premium' hissi veren en hızlı kombinasyon. Işık doğru yerde.",
    popularity: 95,
    tags: ["Japandi", "Bej", "Sade", "Işık", "Düzen"],
  },
  {
    id: "i3",
    title: "Salon: sıcak minimal, net odak",
    roomId: "salon",
    roomLabel: "Salon",
    subLabel: "Aydınlatma",
    style: "İskandinav",
    color: "Gri",
    budget: "Orta",
    city: "Ankara",
    imageUrl:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1400&q=80",
    designerId: "d3",
    designerName: "Anka Design",
    designerSlug: "studio-arc",
    designerAvatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
    designerRating: 5.0,
    designerReviews: 89,
    description:
      "Koltuk + halı + ışık üçlüsünü 'tek' hikâyeye bağlayan düzen. Kalabalık değil; net ve rahat.",
    popularity: 93,
    tags: ["İskandinav", "Gri", "Sıcak", "Minimal", "Rahat"],
  },
  {
    id: "i4",
    title: "Yatak odasında ‘sessiz’ premium",
    roomId: "yatak-odasi",
    roomLabel: "Yatak Odası",
    subLabel: "Başlık",
    style: "Modern",
    color: "Bej",
    budget: "Premium",
    city: "İstanbul",
    imageUrl:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1400&q=80",
    designerId: "d1",
    designerName: "Mina Interiors",
    designerSlug: "nora-interiors",
    designerAvatarUrl:
      "https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=256&q=80",
    designerRating: 4.9,
    designerReviews: 47,
    description:
      "Başlık dokusu + yumuşak tonlar: gece modu gibi. Göz yormuyor ama 'pahalı' duruyor.",
    popularity: 90,
    tags: ["Modern", "Bej", "Premium", "Yumuşak", "Sessiz"],
  },
  {
    id: "i5",
    title: "Ev ofisi: minimal ama üretken",
    roomId: "ev-ofisi",
    roomLabel: "Ev Ofisi",
    subLabel: "Masa",
    style: "Japandi",
    color: "Ahşap",
    budget: "Orta",
    city: "İzmir",
    imageUrl:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80",
    designerId: "d2",
    designerName: "Ege Studio",
    designerSlug: "linea-atelier",
    designerAvatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    designerRating: 4.8,
    designerReviews: 32,
    description:
      "Masa üstünü boş bırakıp raf düzeniyle 'tam kararında' doluluk. Konsantrasyon hissi net.",
    popularity: 89,
    tags: ["Japandi", "Ahşap", "Düzen", "Minimal", "Ofis"],
  },
];
