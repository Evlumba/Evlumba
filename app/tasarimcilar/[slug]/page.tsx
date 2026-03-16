// app/tasarimcilar/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getDesignerBySlug } from "../_data/designers";
import { loadLiveDesignerBySlug } from "../_data/liveDesigner";

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
