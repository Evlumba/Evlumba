// app/tasarimcilar/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getDesignerBySlug } from "../_data/designers";

import ProfileHero from "./_components/ProfileHero";
import ProfileSectionNav from "./_components/ProfileSectionNav";
import AboutSection from "./_components/AboutSection";
import ProjectsSection from "./_components/ProjectsSection";
import BusinessSection from "./_components/BusinessSection";
import ReviewsSection from "./_components/ReviewsSection";

export default async function DesignerSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const designer = getDesignerBySlug(slug);
  if (!designer) return notFound();

  return (
    <main className="pb-16">
      <ProfileHero designer={designer} />

      {/* Sekmeler */}
      <ProfileSectionNav />

      {/* Hakkında */}
      <AboutSection designer={designer} />

      {/* Projeler */}
      <ProjectsSection designer={designer} />

      {/* İşletme */}
      <BusinessSection designer={designer} />

      {/* Yorumlar */}
      <ReviewsSection designer={designer} />
    </main>
  );
}
