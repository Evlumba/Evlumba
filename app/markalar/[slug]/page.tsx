import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandDirectoryEntryBySlug } from "@/lib/brand-directory";
import { SITE_NAME, toAbsoluteUrl, trimForDescription } from "@/lib/seo";

type PageParams = {
  slug: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export const revalidate = 300;

function toSchemaJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandDirectoryEntryBySlug(slug);
  if (!brand) {
    return {
      title: "Marka bulunamadı",
      robots: { index: false, follow: false },
    };
  }

  const title = `${brand.name} dekorasyon ve mobilya rehberi`;
  const description = trimForDescription(
    `${brand.name} için dekorasyon, mobilya ve iç mekan tasarım ilhamı. ${SITE_NAME} ile iç mimar ve mimar eşleşmesini hızlandır.`
  );
  const canonicalPath = `/markalar/${brand.slug}`;

  return {
    title,
    description,
    keywords: [
      `${brand.name} dekorasyon`,
      `${brand.name} mobilya`,
      `${brand.name} iç mimar`,
      `${brand.name} mimar`,
      `${brand.name} tasarım`,
      "dekorasyon markaları",
      "mobilya markaları",
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: toAbsoluteUrl(canonicalPath),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const brand = await getBrandDirectoryEntryBySlug(slug);
  if (!brand) {
    notFound();
  }

  const canonicalPath = `/markalar/${brand.slug}`;
  const guideSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${brand.name} dekorasyon ve mobilya rehberi`,
    description: trimForDescription(
      `${brand.name} aramalarında iç mimar, mimar ve dekorasyon odaklı içerik rehberi.`
    ),
    mainEntityOfPage: toAbsoluteUrl(canonicalPath),
    about: [
      { "@type": "Thing", name: brand.name },
      { "@type": "Thing", name: "iç mimar" },
      { "@type": "Thing", name: "mimar" },
      { "@type": "Thing", name: "dekorasyon" },
      { "@type": "Thing", name: "tasarım" },
    ],
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Markalar",
        item: toAbsoluteUrl("/markalar"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: brand.name,
        item: toAbsoluteUrl(canonicalPath),
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-5xl py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toSchemaJson(guideSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toSchemaJson(breadcrumbSchema) }}
      />

      <Link href="/markalar" className="inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-900">
        ← Marka listesine dön
      </Link>

      <section className="mt-3 rounded-3xl border border-black/10 bg-white/85 p-6 shadow-[0_22px_55px_-40px_rgba(0,0,0,0.25)]">
        {brand.bannerImageUrl ? (
          <div className="mb-4 overflow-hidden rounded-2xl border border-black/10 bg-slate-100">
            <img
              src={brand.bannerImageUrl}
              alt={`${brand.name} banner`}
              className="h-44 w-full object-cover sm:h-56"
            />
          </div>
        ) : null}
        <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          {brand.category}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {brand.name} dekorasyon ve tasarım rehberi
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-700">{brand.summary}</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Bu sayfa, {brand.name} aramalarında dekorasyon ve mobilya niyeti taşıyan kullanıcılar için
          iç mimar ve mimar odaklı karar akışını hızlandırmak amacıyla hazırlanmıştır.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/tasarimcilar"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            {brand.name} tarzına uygun iç mimar/mimar bul →
          </Link>
          <Link
            href="/blog"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Blogdan uygulama örneklerini incele →
          </Link>
        </div>
      </section>
    </main>
  );
}
