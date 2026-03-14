// app/tasarimcilar/_data/designers.ts

export type PortfolioItem = {
  id: string;
  title: string;
  coverUrl: string;
  room?: string;
  style?: string;
  location?: string;
  year?: string;
  budget?: string;
  images?: string[];
  // Detay sayfası için ek alanlar
  description?: string;
  area?: string; // m²
  duration?: string; // "3 ay" gibi
  materials?: string[];
  colors?: string[];
  beforeAfter?: { before: string; after: string }[];
  tags?: string[];
  shopLinks?: Array<{
    id: string;
    imageUrl: string;
    x: number;
    y: number;
    productUrl: string;
    productTitle?: string;
    productImageUrl?: string;
    productPrice?: string;
  }>;
};

export type ReviewItem = {
  id: string;
  homeownerId?: string;
  author: string;
  authorCity?: string;
  avatarUrl?: string;
  rating: number; // 1-5 genel puan
  date: string; // "2025-11" gibi
  text: string;
  project?: string;
  // Detaylı puanlama
  ratings?: {
    workQuality?: number; // İş Kalitesi
    communication?: number; // İletişim
    value?: number; // Fiyat/Değer
  };
  // Proje fotoğrafları
  images?: string[];
  // Tasarımcı yanıtı
  reply?: {
    text: string;
    date: string;
  };
  // Öne çıkarılan yorum mu?
  pinned?: boolean;
  // Faydalı bulunma sayısı
  helpfulCount?: number;
};

export type Designer = {
  slug: string;
  liveDesignerId?: string;
  name: string;
  title: string;
  city: string;
  rating: number;
  reviews: number;

  verified?: boolean;
  pinnedReview?: string;
  pinnedBy?: string;

  tags: string[];
  coverUrl: string;

  response?: string;
  startingFrom?: string;
  portfolioCount?: number;
  projectTypes?: string[];
  services?: string[];

  // new (opsiyonel)
  avatarUrl?: string;
  gallery?: string[];
  about?: {
    headline?: string;
    bio?: string;
    specialties?: string[];
    serviceAreas?: string[];
    languages?: string[];
    teamSize?: string;
    availability?: string;
  };

  portfolio?: PortfolioItem[];
  reviewsList?: ReviewItem[];

  // İşletme bilgileri
  business?: {
    name?: string; // İşletme adı (farklıysa)
    phone?: string;
    email?: string;
    website?: string;
    address?: {
      street?: string;
      district?: string;
      city?: string;
      postalCode?: string;
    };
    typicalJobCost?: {
      min?: string;
      max?: string;
    };
    founded?: string; // Kuruluş yılı
    employees?: string; // Çalışan sayısı
    license?: string; // Lisans/Sicil no
    insurance?: boolean;
    followers?: number;
    socials?: {
      instagram?: string;
      pinterest?: string;
      linkedin?: string;
      twitter?: string;
      youtube?: string;
    };
    workingHours?: {
      weekdays?: string;
      saturday?: string;
      sunday?: string;
    };
  };
};

export const FEATURED_DESIGNERS: Designer[] = [
  {
    slug: "studio-arc",
    name: "Studio Arc",
    title: "İç Mimar",
    city: "İstanbul",
    rating: 4.9,
    reviews: 132,
    verified: true,
    pinnedReview:
      "İlk görüşmeden itibaren çok netti; bütçeyi zorlamadan mutfağı baştan yarattı.",
    pinnedBy: "Ece • Beşiktaş",
    tags: ["Japandi", "Sıcak minimal", "Hızlı dönüş"],
    response: "24s dönüş",
    startingFrom: "₺12K+",
    portfolioCount: 48,
    projectTypes: ["Komple yenileme", "Mutfak dönüşümü"],
    services: ["Danışmanlık", "3D/Render", "Uygulama"],
    coverUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80",

    avatarUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1800&q=80",
    ],
    about: {
      headline: "Sıcak minimal + net planlama. Hızlı karar, temiz uygulama.",
      bio:
        "Evlere ‘fotoğraf gibi’ değil ‘yaşanır gibi’ bakarım. Önce akış + ışık + depolama, sonra stil. Karar yorgunluğunu azaltan net bir süreçle ilerleriz.",
      specialties: [
        "Mutfak dönüşümü",
        "Komple yenileme",
        "Küçük metrekare optimizasyonu",
      ],
      serviceAreas: ["İstanbul", "Kocaeli", "Bursa"],
      languages: ["TR", "EN"],
      teamSize: "3 kişilik ekip",
      availability: "Bu hafta 2 slot açık",
    },
    portfolio: [
      {
        id: "p1",
        title: "Kadıköy • Japandi Mutfak",
        coverUrl:
          "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1600&q=80",
        room: "Mutfak",
        style: "Japandi",
        location: "İstanbul",
        budget: "₺250K",
        year: "2024",
        area: "18 m²",
        duration: "2.5 ay",
        description: "Kadıköy'de 1970'lerden kalma bir apartman dairesinin mutfağını tamamen yeniledik. Japandi stilinin sıcaklığını modern fonksiyonellikle birleştirdik. Doğal meşe ahşap, mat siyah armatürler ve minimalist çizgiler ana tasarım dili oldu.",
        images: [
          "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1556909190-6a3e6a176e37?auto=format&fit=crop&w=1600&q=80",
        ],
        materials: ["Meşe ahşap", "Granit tezgah", "Mat siyah armatür"],
        colors: ["Bej", "Siyah", "Doğal ahşap"],
        tags: ["Japandi", "Mutfak", "Yenileme"],
      },
      {
        id: "p2",
        title: "Beşiktaş • Sıcak Minimal Salon",
        coverUrl:
          "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1600&q=80",
        room: "Salon",
        style: "Minimal",
        location: "İstanbul",
        year: "2024",
        area: "35 m²",
        duration: "1.5 ay",
        description: "Boğaz manzaralı bu salonda, manzarayı ön plana çıkaran minimal bir tasarım tercih ettik. Nötr tonlar ve doğal dokular ile huzurlu bir yaşam alanı oluşturduk.",
        images: [
          "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80",
        ],
        materials: ["Keten kumaş", "Traverten", "Pirinç detaylar"],
        colors: ["Krem", "Bej", "Altın"],
        tags: ["Minimal", "Salon", "Lüks"],
      },
      {
        id: "p3",
        title: "Ataşehir • Kompakt Depolama",
        coverUrl:
          "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1600&q=80",
        room: "Antre",
        style: "Fonksiyon",
        location: "İstanbul",
        year: "2024",
        area: "8 m²",
        description: "Küçük bir giriş alanını maksimum depolama kapasitesiyle donattık. Gizli dolaplar ve akıllı çözümlerle her santimetreyi değerlendirdik.",
        materials: ["Lake MDF", "Ayna", "LED aydınlatma"],
        tags: ["Depolama", "Kompakt", "Akıllı çözüm"],
      },
      {
        id: "p4",
        title: "Şişli • Modern Yatak Odası",
        coverUrl:
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1600&q=80",
        room: "Yatak Odası",
        style: "Modern",
        location: "İstanbul",
        year: "2024",
        area: "22 m²",
        tags: ["Modern", "Yatak Odası"],
      },
      {
        id: "p5",
        title: "Üsküdar • Bohem Oturma Alanı",
        coverUrl:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80",
        room: "Salon",
        style: "Bohem",
        location: "İstanbul",
        year: "2023",
        tags: ["Bohem", "Renkli", "Eklektik"],
      },
      {
        id: "p6",
        title: "Levent • Executive Ofis",
        coverUrl:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
        room: "Ofis",
        style: "Corporate",
        location: "İstanbul",
        year: "2023",
        budget: "₺180K",
        tags: ["Ofis", "Kurumsal", "Modern"],
      },
      {
        id: "p7",
        title: "Moda • Sahil Evi Banyosu",
        coverUrl:
          "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1600&q=80",
        room: "Banyo",
        style: "Coastal",
        location: "İstanbul",
        year: "2023",
        tags: ["Banyo", "Sahil", "Beyaz"],
      },
      {
        id: "p8",
        title: "Etiler • Minimalist Mutfak",
        coverUrl:
          "https://images.unsplash.com/photo-1556909114-44e3e70034e2?auto=format&fit=crop&w=1600&q=80",
        room: "Mutfak",
        style: "Minimal",
        location: "İstanbul",
        year: "2023",
        budget: "₺320K",
        tags: ["Mutfak", "Minimal", "Lüks"],
      },
      {
        id: "p9",
        title: "Caddebostan • Çocuk Odası",
        coverUrl:
          "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=80",
        room: "Çocuk Odası",
        style: "Playful",
        location: "İstanbul",
        year: "2023",
        tags: ["Çocuk Odası", "Renkli", "Eğlenceli"],
      },
      {
        id: "p10",
        title: "Nişantaşı • Butik Mağaza",
        coverUrl:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
        room: "Ticari",
        style: "Butik",
        location: "İstanbul",
        year: "2023",
        budget: "₺450K",
        tags: ["Ticari", "Butik", "Retail"],
      },
      {
        id: "p11",
        title: "Bebek • Teras Düzenlemesi",
        coverUrl:
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80",
        room: "Teras",
        style: "Outdoor",
        location: "İstanbul",
        year: "2022",
        tags: ["Teras", "Dış Mekan", "Yeşil"],
      },
      {
        id: "p12",
        title: "Florya • Villa Girişi",
        coverUrl:
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
        room: "Giriş",
        style: "Lüks",
        location: "İstanbul",
        year: "2022",
        budget: "₺200K",
        tags: ["Villa", "Giriş", "Lüks"],
      },
    ],
    reviewsList: [
      {
        id: "r1",
        author: "Ece Yılmaz",
        authorCity: "Beşiktaş",
        rating: 5,
        date: "2025-12",
        text:
          "Bizi yormadan seçenekleri daralttı. Render → uygulama geçişi birebir oldu. Süreç boyunca hep kontrollü hissettik. İlk görüşmeden itibaren çok netti; bütçeyi zorlamadan mutfağı baştan yarattı. Ekip çok profesyonel ve işlerini zamanında teslim ettiler.",
        project: "Mutfak dönüşümü",
        pinned: true,
        ratings: {
          workQuality: 5,
          communication: 5,
          value: 4.8,
        },
        images: [
          "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80",
        ],
        reply: {
          text: "Ece Hanım, güzel yorumunuz için çok teşekkürler! Sizinle çalışmak bizim için de keyifliydi. Mutfağınızın tadını çıkarın!",
          date: "2025-12",
        },
        helpfulCount: 12,
      },
      {
        id: "r2",
        author: "Can Özdemir",
        authorCity: "Kadıköy",
        rating: 5,
        date: "2025-11",
        text:
          "Küçük evde depolama mucizesi yaptı. 'Şu dolap şart' gibi net yönlendirmeler çok iyiydi. 55 metrekarelik dairemizi sanki 80 metrekare gibi kullanıyoruz artık. Her köşe değerlendirilmiş.",
        project: "Komple yenileme",
        ratings: {
          workQuality: 5,
          communication: 5,
          value: 5,
        },
        reply: {
          text: "Can Bey, teşekkürler! Küçük alanları verimli kullanmak bizim uzmanlık alanımız. Yeni evinizin keyfini çıkarın.",
          date: "2025-11",
        },
        helpfulCount: 8,
      },
      {
        id: "r3",
        author: "Ayşe Kara",
        authorCity: "Şişli",
        rating: 5,
        date: "2025-10",
        text:
          "Laura ile çalışmak harikaydı. Enerjisi, sabrı ve detaylara gösterdiği özen takdire şayan. Salon ve yemek odamızın renovasyonunda bize yardımcı oldu. Mobilya seçiminde de çok yardımcı oldu.",
        project: "Salon yenileme",
        ratings: {
          workQuality: 5,
          communication: 5,
          value: 4.5,
        },
        images: [
          "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=400&q=80",
        ],
        helpfulCount: 5,
      },
      {
        id: "r4",
        author: "Natalya Petrova",
        authorCity: "Etiler",
        rating: 4,
        date: "2025-09",
        text:
          "Studio Arc ile çalışmak bize mutfak renovasyonunu tamamlamamız için gereken itici gücü verdi. Sonuçtan çok memnunuz - mutfak yenilenmiş görünüyor ve artık vakit geçirmek için harika bir yer.",
        project: "Mutfak renovasyonu",
        ratings: {
          workQuality: 4,
          communication: 4,
          value: 4,
        },
        reply: {
          text: "Yorumunuz için teşekkürler. Sizinle çalışmaktan ve vizyonunuzu hayata geçirmekten keyif aldık!",
          date: "2025-09",
        },
        helpfulCount: 3,
      },
      {
        id: "r5",
        author: "Mehmet Aksoy",
        authorCity: "Bebek",
        rating: 5,
        date: "2025-08",
        text:
          "Yeni evimizin renovasyonunda Studio Arc ile çalıştım ve deneyimden daha mutlu olamazdım. Ekip inanılmaz derecede yardımsever, karar verme sürecinde değerli rehberlik sundu.",
        project: "Villa renovasyonu",
        ratings: {
          workQuality: 5,
          communication: 5,
          value: 4.8,
        },
        images: [
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=400&q=80",
        ],
        helpfulCount: 7,
      },
      {
        id: "r6",
        author: "Zeynep Demir",
        authorCity: "Caddebostan",
        rating: 5,
        date: "2025-07",
        text:
          "Çocuk odası projemizde harika bir iş çıkardılar. Hem eğlenceli hem de fonksiyonel bir alan yarattılar. Kızım odasına bayıldı!",
        project: "Çocuk odası",
        ratings: {
          workQuality: 5,
          communication: 5,
          value: 5,
        },
        helpfulCount: 4,
      },
    ],
    business: {
      name: "Studio Arc İç Mimarlık",
      phone: "+90 212 555 0123",
      email: "merhaba@studioarc.com.tr",
      website: "www.studioarc.com.tr",
      address: {
        street: "Vişnezade Mah. Süleyman Seba Cad. No:48/3",
        district: "Beşiktaş",
        city: "İstanbul",
        postalCode: "34357",
      },
      typicalJobCost: {
        min: "₺50.000",
        max: "₺500.000",
      },
      founded: "2018",
      employees: "3-5",
      license: "İTO-2018-İM-4521",
      insurance: true,
      followers: 2847,
      socials: {
        instagram: "studioarc.tr",
        pinterest: "studioarcdesign",
        linkedin: "studio-arc-istanbul",
      },
      workingHours: {
        weekdays: "09:00 - 18:00",
        saturday: "10:00 - 14:00",
        sunday: "Kapalı",
      },
    },
  },

  {
    slug: "nora-interiors",
    name: "Nora Interiors",
    title: "İç Mimarlık Ofisi",
    city: "Ankara",
    rating: 4.8,
    reviews: 98,
    verified: true,
    pinnedReview:
      "Render’lar çok gerçekçiydi; karar vermek kolaylaştı ve uygulamada sürpriz yaşamadık.",
    pinnedBy: "Mert • Çankaya",
    tags: ["Modern", "Soft tones", "Bütçe uyumu"],
    response: "12s dönüş",
    startingFrom: "₺9K+",
    portfolioCount: 36,
    projectTypes: ["Tek oda", "Stil yenileme"],
    services: ["Danışmanlık", "3D/Render"],
    coverUrl:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1800&q=80",

    avatarUrl:
      "https://images.unsplash.com/photo-1520975958225-8d3b4a3f66f7?auto=format&fit=crop&w=600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1800&q=80",
    ],
    about: {
      headline: "Modern çizgi, ölçülü bütçe, risksiz uygulama.",
      bio:
        "Tasarımı ‘güzel görünsün’ diye değil, ‘günlük hayatı kolaylaştırsın’ diye yapıyoruz. Tek oda dönüşümlerinde hızlı sonuç alırız.",
      specialties: ["Tek oda dönüşüm", "Stil yenileme", "Render ile karar kolaylığı"],
      serviceAreas: ["Ankara"],
      languages: ["TR"],
      teamSize: "2 kişilik ekip",
      availability: "Yeni proje: 1-2 hafta",
    },
    portfolio: [
      {
        id: "n1",
        title: "Çankaya • Soft Tones Yatak Odası",
        coverUrl:
          "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1600&q=80",
        room: "Yatak Odası",
        style: "Soft tones",
        location: "Ankara",
      },
      {
        id: "n2",
        title: "Ümitköy • Modern Salon",
        coverUrl:
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
        room: "Salon",
        style: "Modern",
        location: "Ankara",
      },
    ],
    reviewsList: [
      {
        id: "nr1",
        author: "Mert",
        authorCity: "Çankaya",
        rating: 5,
        date: "2025-10",
        text:
          "Render’lar çok gerçekçiydi. Uygulamada ‘böyle hayal etmemiştik’ durumu yaşamadık.",
        project: "Stil yenileme",
      },
    ],
  },

  {
    slug: "linea-atelier",
    name: "Linea Atelier",
    title: "İç Mekan Tasarımcısı",
    city: "İzmir",
    rating: 4.7,
    reviews: 76,
    verified: false,
    tags: ["Scandi", "Fonksiyon", "Planlama"],
    response: "48s dönüş",
    startingFrom: "₺15K+",
    portfolioCount: 28,
    projectTypes: ["Komple yenileme", "Planlama"],
    services: ["Danışmanlık", "Uygulama"],
    coverUrl:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=80",

    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    about: {
      headline: "Fonksiyon önce gelir. Sonra ‘scandi’ tatlılığı.",
      bio:
        "Planı doğru kurarsak, ev zaten güzel olur. İyi bir depolama + doğru aydınlatma ile en küçük alan bile ferahlar.",
      specialties: ["Planlama", "Aydınlatma", "Uygulama takibi"],
      serviceAreas: ["İzmir"],
      languages: ["TR", "EN"],
      teamSize: "Freelance",
      availability: "Yoğun",
    },
  },
];

/**
 * İstersen başka dosyalarda `import designers from ...` diye kullan diye:
 * default export = FEATURED_DESIGNERS
 */
export default FEATURED_DESIGNERS;

export function getDesignerBySlug(slug: string) {
  return FEATURED_DESIGNERS.find((d) => d.slug === slug);
}

export function getProjectById(designerSlug: string, projectId: string) {
  const designer = getDesignerBySlug(designerSlug);
  if (!designer?.portfolio) return null;
  return designer.portfolio.find((p) => p.id === projectId) ?? null;
}

export function getAdjacentProjects(designerSlug: string, projectId: string) {
  const designer = getDesignerBySlug(designerSlug);
  if (!designer?.portfolio) return { prev: null, next: null };

  const index = designer.portfolio.findIndex((p) => p.id === projectId);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: index > 0 ? designer.portfolio[index - 1] : null,
    next: index < designer.portfolio.length - 1 ? designer.portfolio[index + 1] : null,
  };
}
