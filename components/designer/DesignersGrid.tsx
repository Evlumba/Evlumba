// components/designer/DesignersGrid.tsx
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, ArrowUpRight } from "lucide-react";

type Designer = {
  id: string;
  name: string;
  city: string;
  rating: number;
  reviews: number;
  tags: string[];
  startingFrom: string;
  heroImage: string;
};

const designers: Designer[] = [
  {
    id: "1",
    name: "Ece Karaman Studio",
    city: "İstanbul",
    rating: 4.9,
    reviews: 132,
    tags: ["Modern", "Minimal", "Küçük alan"],
    startingFrom: "₺₺",
    heroImage:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "2",
    name: "Atölye Noya",
    city: "Kadıköy",
    rating: 4.8,
    reviews: 98,
    tags: ["Japandi", "Sakin", "Ahşap tonlar"],
    startingFrom: "₺₺₺",
    heroImage:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "3",
    name: "Linea Interiors",
    city: "Beşiktaş",
    rating: 4.7,
    reviews: 76,
    tags: ["Klasik", "Zamansız", "Detay"],
    startingFrom: "₺₺₺",
    heroImage:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "4",
    name: "Mimo Works",
    city: "Ataşehir",
    rating: 4.9,
    reviews: 54,
    tags: ["Ekletik", "Renk", "Konsept"],
    startingFrom: "₺₺",
    heroImage:
      "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "5",
    name: "Form & Function",
    city: "Üsküdar",
    rating: 4.8,
    reviews: 110,
    tags: ["Modern", "Fonksiyon", "Mutfak"],
    startingFrom: "₺₺₺",
    heroImage:
      "https://images.unsplash.com/photo-1527030280862-64139fba04ca?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "6",
    name: "Studio Terra",
    city: "Şişli",
    rating: 4.6,
    reviews: 61,
    tags: ["Japandi", "Doğal", "Aydınlık"],
    startingFrom: "₺₺",
    heroImage:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function DesignersGrid() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" id="tasarimcilar">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Önerilen tasarımcılar</div>
          <div className="mt-1 text-sm text-slate-600">
            Düzenli, sade, “seç ve devam et” hissi.
          </div>
        </div>

        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
          Toplam <span className="ml-1 font-semibold text-slate-900">{designers.length}</span> profil
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {designers.map((d) => (
          <div
            key={d.id}
            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-[0_12px_30px_rgba(2,6,23,0.10)]"
          >
            <div className="relative h-36 w-full overflow-hidden">
              <Image
                src={d.heroImage}
                alt={d.name}
                fill
                unoptimized
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/35 to-transparent" />
              <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-900 shadow-sm">
                <Star className="h-3.5 w-3.5" />
                {d.rating} <span className="text-slate-500">({d.reviews})</span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{d.name}</div>
                  <div className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600">
                    <MapPin className="h-4 w-4" />
                    {d.city}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  Başlangıç: <span className="font-semibold text-slate-900">{d.startingFrom}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {d.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <Link
                  href={`/tasarimcilar/${d.id}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                >
                  Profili gör <ArrowUpRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 text-xs text-slate-500">
        Demo: Profil sayfaları için şimdilik route iskeleti yoksa, linkler 404 verebilir. İstersen bir sonraki adımda
        `/tasarimcilar/[id]` profil sayfasını da “premium” şekilde kurayım.
      </div>
    </div>
  );
}
