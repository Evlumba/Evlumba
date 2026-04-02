export type BrandEntry = {
  slug: string;
  name: string;
  category: "mobilya" | "dekorasyon" | "aydınlatma" | "tekstil" | "yapı-market";
  summary: string;
};

export const BRANDS: BrandEntry[] = [
  { slug: "ikea", name: "IKEA", category: "mobilya", summary: "Modüler mobilya ve depolama çözümleri." },
  { slug: "koctas", name: "Koçtaş", category: "yapı-market", summary: "Ev geliştirme ve dekorasyon ürünleri." },
  { slug: "tepe-home", name: "Tepe Home", category: "mobilya", summary: "Modern mobilya ve yaşam alanı koleksiyonları." },
  { slug: "vivense", name: "Vivense", category: "mobilya", summary: "Online mobilya ve dekorasyon ürünleri." },
  { slug: "enzahome", name: "Enza Home", category: "mobilya", summary: "Salon, yatak odası ve tamamlayıcı ürünler." },
  { slug: "bellona", name: "Bellona", category: "mobilya", summary: "Ev mobilyası ve uyku ürünleri." },
  { slug: "istikbal", name: "İstikbal", category: "mobilya", summary: "Mobilya, baza ve tekstil çözümleri." },
  { slug: "dogtas", name: "Doğtaş", category: "mobilya", summary: "Yaşam alanı odaklı mobilya koleksiyonları." },
  { slug: "kelebek", name: "Kelebek Mobilya", category: "mobilya", summary: "Fonksiyonel mobilya ve depolama." },
  { slug: "mondi", name: "Mondi Home", category: "mobilya", summary: "Oturma grubu, yemek odası ve yatak odası ürünleri." },
  { slug: "lazzoni", name: "Lazzoni", category: "mobilya", summary: "Premium mobilya ve iç mekan ürünleri." },
  { slug: "mudo-concept", name: "Mudo Concept", category: "dekorasyon", summary: "Dekoratif ürünler ve ev yaşam koleksiyonları." },
  { slug: "english-home", name: "English Home", category: "tekstil", summary: "Ev tekstili ve dekoratif aksesuarlar." },
  { slug: "madame-coco", name: "Madame Coco", category: "tekstil", summary: "Ev tekstili ve mutfak ürünleri." },
  { slug: "karaca-home", name: "Karaca Home", category: "tekstil", summary: "Ev tekstili ve sofra ürünleri." },
  { slug: "linens", name: "Linens", category: "tekstil", summary: "Nevresim, perde ve ev tekstili ürünleri." },
  { slug: "chakra", name: "Chakra", category: "tekstil", summary: "Doğal ev tekstili ve banyo ürünleri." },
  { slug: "zara-home", name: "Zara Home", category: "dekorasyon", summary: "Dekorasyon ve ev yaşam ürünleri." },
  { slug: "h-m-home", name: "H&M Home", category: "dekorasyon", summary: "Ev aksesuarı ve tekstil koleksiyonları." },
  { slug: "jysk", name: "JYSK", category: "mobilya", summary: "İskandinav tarzı mobilya ve ev ürünleri." },
  { slug: "evidea", name: "Evidea", category: "dekorasyon", summary: "Ev düzenleme, mutfak ve dekorasyon ürünleri." },
  { slug: "home-sweet-home", name: "Home Sweet Home", category: "tekstil", summary: "Perde ve ev tekstili çözümleri." },
  { slug: "icf", name: "ICF", category: "mobilya", summary: "Ofis ve yaşam alanı mobilya ürünleri." },
  { slug: "hamm-design", name: "Hamm Design", category: "dekorasyon", summary: "Dekoratif obje ve ev aksesuarları." },
  { slug: "westwing", name: "Westwing", category: "dekorasyon", summary: "Dekorasyon ve lifestyle ürünleri." },
  { slug: "crate-and-barrel", name: "Crate & Barrel", category: "dekorasyon", summary: "Modern ev dekorasyonu ve mobilya." },
  { slug: "pottery-barn", name: "Pottery Barn", category: "mobilya", summary: "Klasik-modern mobilya ve ev dekorasyonu." },
  { slug: "bo-concept", name: "BoConcept", category: "mobilya", summary: "Modern Danimarka mobilya çözümleri." },
  { slug: "kartell", name: "Kartell", category: "mobilya", summary: "Tasarım odaklı çağdaş mobilya ürünleri." },
  { slug: "vitra", name: "Vitra", category: "mobilya", summary: "Tasarım ve ergonomi odaklı mobilya." },
  { slug: "isiklar", name: "Işıklar", category: "aydınlatma", summary: "Dekoratif aydınlatma ürünleri." },
  { slug: "philips-lighting", name: "Philips Lighting", category: "aydınlatma", summary: "Akıllı ve fonksiyonel aydınlatma çözümleri." },
  { slug: "eglo", name: "EGLO", category: "aydınlatma", summary: "İç mekan ve dış mekan aydınlatma ürünleri." },
  { slug: "avonni", name: "Avonni", category: "aydınlatma", summary: "Dekoratif avize ve aydınlatma koleksiyonları." },
  { slug: "nordmende", name: "Nordmende Lighting", category: "aydınlatma", summary: "Minimal ve modern aydınlatma ürünleri." },
  { slug: "fuga-mobilya", name: "Fuga Mobilya", category: "mobilya", summary: "Modern çizgide yaşam alanı mobilyaları." },
  { slug: "bykepi", name: "ByKepi", category: "dekorasyon", summary: "Dekoratif tamamlayıcı ve aksesuar ürünleri." },
  { slug: "tefal-home", name: "Tefal Home", category: "dekorasyon", summary: "Mutfak ve ev içi fonksiyonel ürünler." },
  { slug: "nurus", name: "Nurus", category: "mobilya", summary: "Ofis ve ev için tasarım odaklı mobilya." },
  { slug: "koleksiyon", name: "Koleksiyon", category: "mobilya", summary: "Mimari ve mobilya tasarım çözümleri." },
  { slug: "hazeran", name: "Hazeran", category: "dekorasyon", summary: "Doğal malzeme odaklı dekorasyon ürünleri." },
  { slug: "paulmark", name: "Paulmark", category: "mobilya", summary: "Mutfak ve yaşam alanı mobilya çözümleri." },
  { slug: "sahrai", name: "Sahrai", category: "dekorasyon", summary: "Premium halı ve zemin dekorasyon çözümleri." },
  { slug: "saray-hali", name: "Saray Halı", category: "dekorasyon", summary: "Halı ve zemin ürünleri." },
  { slug: "merinos", name: "Merinos", category: "dekorasyon", summary: "Halı ve ev tekstili ürünleri." },
  { slug: "yatas-bedding", name: "Yataş Bedding", category: "mobilya", summary: "Uyku ürünleri ve yatak çözümleri." },
  { slug: "almila", name: "Almila", category: "mobilya", summary: "Genç odası ve fonksiyonel mobilya çözümleri." },
  { slug: "idconline", name: "IDCONline", category: "dekorasyon", summary: "Dekoratif obje ve ev yaşam ürünleri." },
  { slug: "kiwi-home", name: "Kiwi Home", category: "dekorasyon", summary: "Ev düzenleme ve küçük dekoratif ürünler." },
];

export function getBrandBySlug(slug: string) {
  return BRANDS.find((brand) => brand.slug === slug) || null;
}
