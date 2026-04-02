// app/tasarimcilar/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDesignerBySlug } from "../_data/designers";
import { loadLiveDesignerBySlug } from "../_data/liveDesigner";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, trimForDescription, toAbsoluteUrl } from "@/lib/seo";

import ProfileHero from "./_components/ProfileHero";
import ProfileSectionNav from "./_components/ProfileSectionNav";
import AboutSection from "./_components/AboutSection";
import ProjectsSection from "./_components/ProjectsSection";
import SocialMediaSection from "./_components/SocialMediaSection";
import BusinessSection from "./_components/BusinessSection";
import ReviewsSection from "./_components/ReviewsSection";
import BlogSection from "./_components/BlogSection";

// export const dynamic = "force-dynamic"; // COST-FIX: removed
export const revalidate = 3600; // COST-FIX: 1 hour ISR cache

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const designer = getDesignerBySlug(slug) ?? (await loadLiveDesignerBySlug(slug));
  if (!designer) return {};

  const displayName = designer.business?.name?.trim() || designer.name?.trim() || "Profesyonel";
  const specialty = designer.title?.trim() || "İç Mimar";
  const city = designer.city?.trim() || "";
  const bio = designer.about?.bio?.trim() || designer.about?.headline?.trim() || "";

  const title = city
    ? `${displayName} | ${specialty} – ${city}`
    : `${displayName} | ${specialty}`;

  const descriptionBase = bio
    ? bio
    : `${displayName}, Evlumba'da yer alan ${specialty.toLowerCase()} profili.${city ? ` ${city} merkezli çalışmalar.` : ""}`;
  const description = trimForDescription(descriptionBase);

  const ogImage =
    designer.coverUrl?.trim() ||
    designer.avatarUrl?.trim() ||
    designer.gallery?.[0]?.trim() ||
    DEFAULT_OG_IMAGE;

  const canonicalPath = `/tasarimcilar/${encodeURIComponent(slug)}`;

  const keywords = [
    displayName,
    specialty,
    city,
    "iç mimar",
    "dekorasyon",
    "tasarım",
    "Evlumba",
  ].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: displayName,
    description,
    url: `${SITE_URL}${canonicalPath}`,
    image: ogImage,
    ...(city ? { address: { "@type": "PostalAddress", addressLocality: city, addressCountry: "TR" } } : {}),
    ...(designer.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: designer.rating, reviewCount: designer.reviews || 1, bestRating: 5 } } : {}),
  };

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: toAbsoluteUrl(canonicalPath),
      siteName: SITE_NAME,
      type: "profile",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
    },
  };
}

export default async function DesignerSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const designer = getDesignerBySlug(slug) ?? (await loadLiveDesignerBySlug(slug));
  if (!designer) return notFound();
  const hasInstagram = Boolean(designer.business?.socials?.instagram?.trim());

  return (
    <main className="pb-16">
      <ProfileHero designer={designer} />

      {/* Sekmeler */}
      <ProfileSectionNav showSocialMedia={hasInstagram} />

      {/* Hakkında */}
      <AboutSection designer={designer} />

      {/* Projeler */}
      <ProjectsSection designer={designer} />

      {/* Sosyal Medya */}
      {hasInstagram ? <SocialMediaSection designer={designer} /> : null}

      {/* İşletme */}
      <BusinessSection designer={designer} />

      {/* Yorumlar */}
      <ReviewsSection designer={designer} />

      {/* Blog */}
      <BlogSection designer={designer} />
    </main>
  );
}
