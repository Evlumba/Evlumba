// lib/promatch.ts
export const PROMATCH = {
 // lib/promatch.ts içindeki PROMATCH.images kısmını bununla değiştir
images: {
    // varsa diğerleri kalsın (rooms, proAvatar vs)
    rooms: [
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=1800&q=85",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=85",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1800&q=85",
    ],
    proAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=85",

    // ✅ yeni: tasarımcı aramayı anlatan hero görseli (istersen değiştir)
    bannerHero:
      "https://images.pexels.com/photos/7734586/pexels-photo-7734586.jpeg?cs=srgb&dl=pexels-mikhail-nilov-7734586.jpg&fm=jpg",
  },


  copy: {
    badgeLeft: "ProMatch",
    badgeRight: "3 soru → doğru profesyonel",
    headlineA: "Tarzını yakala.",
    headlineB: "Doğru tasarımcıyla eşleş.",
    sub:
      "Beğenilerin ve 3 kısa soruyla “tarz izi” çıkarırız. Sonra portföy + yorum + bütçe uyumu ile en doğru profesyonelleri tek listede sunarız.",
    ctaPrimary: "ProMatch’i Başlat",
    ctaSecondary: "Örnek Profilleri Gör",
    trust1: "Kredi kartı gerekmez",
    trust2: "2 dk’da başla",
    scoreTitle: "Tarz Uyum Skoru",
    scoreTags: "Japandi • sıcak minimal",
    scoreNote: "AI hesapladı",
    proTitle: "İç Mimar",
    proMeta: "24s dönüş",
    proRating: "4.9",
    proReviews: "120 yorum",
  },
} as const;
