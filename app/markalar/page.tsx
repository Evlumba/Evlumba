import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import { SITE_NAME, toAbsoluteUrl, trimForDescription } from "@/lib/seo";

const title = "Mobilya ve Dekorasyon Markaları";
const description = trimForDescription(
  "Mobilya, dekorasyon, aydınlatma ve ev tekstili markalarını keşfet. Evlumba üzerinde markalara göre ilham ve profesyonel eşleşme akışını başlat."
);

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "mobilya markaları",
    "dekorasyon markaları",
    "ev tekstili markaları",
    "aydınlatma markaları",
    "iç mimar dekorasyon markaları",
    "mimar mobilya markaları",
  ],
  alternates: {
    canonical: "/markalar",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: toAbsoluteUrl("/markalar"),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

function toSchemaJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function BrandsPage() {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} marka rehberi`,
    itemListElement: BRANDS.map((brand, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: brand.name,
      url: toAbsoluteUrl(`/markalar/${brand.slug}`),
    })),
  };

  return (
    <main className="mx-auto w-full max-w-6xl py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toSchemaJson(itemListSchema) }}
      />

      <section className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-[0_22px_55px_-40px_rgba(0,0,0,0.25)]">
        <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          Marka Rehberi
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Mobilya ve dekorasyon markaları
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Marka aramalarında doğru içerik sinyali oluşturmak için hazırladığımız rehber alanı.
          Buradan marka bazlı ilhamı açabilir, ardından iç mimar ve mimar eşleşmesine geçebilirsin.
        </p>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BRANDS.map((brand) => (
          <Link
            key={brand.slug}
            href={`/markalar/${brand.slug}`}
            className="rounded-2xl border border-black/10 bg-white/80 p-4 transition hover:bg-white"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {brand.category}
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">{brand.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{brand.summary}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
