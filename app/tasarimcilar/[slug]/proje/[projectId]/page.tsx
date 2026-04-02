// app/tasarimcilar/[slug]/proje/[projectId]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDesignerBySlug,
  getProjectById,
  getAdjacentProjects,
} from "../../../_data/designers";
import { loadLiveDesignerBySlug } from "../../../_data/liveDesigner";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, trimForDescription, toAbsoluteUrl } from "@/lib/seo";
import ProjectDetailClient from "./_components/ProjectDetailClient";

// export const dynamic = "force-dynamic"; // COST-FIX: removed
export const revalidate = 7200; // COST-FIX: 2 hour ISR cache

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}): Promise<Metadata> {
  const { slug, projectId } = await params;
  const designer = getDesignerBySlug(slug) ?? (await loadLiveDesignerBySlug(slug));
  if (!designer) return {};

  const project =
    getProjectById(slug, projectId) ??
    (designer.portfolio?.find((p) => p.id === projectId) ?? null);
  if (!project) return {};

  const designerName = designer.business?.name?.trim() || designer.name?.trim() || "Profesyonel";
  const projectTitle = project.title?.trim() || "Proje";
  const title = `${projectTitle} – ${designerName}`;

  const descBase = project.description?.trim()
    ? project.description.trim()
    : `${designerName} tarafından tasarlanan ${projectTitle} projesi. Evlumba'da iç mimarlık ilhamı keşfet.`;
  const description = trimForDescription(descBase);

  const ogImage = project.coverUrl?.trim() || project.images?.[0]?.trim() || DEFAULT_OG_IMAGE;
  const canonicalPath = `/tasarimcilar/${encodeURIComponent(slug)}/proje/${encodeURIComponent(projectId)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: ogImage,
    author: { "@type": "Person", name: designerName },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${canonicalPath}` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Tasarımcılar", item: `${SITE_URL}/tasarimcilar` },
        { "@type": "ListItem", position: 2, name: designerName, item: `${SITE_URL}/tasarimcilar/${encodeURIComponent(slug)}` },
        { "@type": "ListItem", position: 3, name: projectTitle, item: `${SITE_URL}${canonicalPath}` },
      ],
    },
  };

  return {
    title,
    description,
    keywords: [projectTitle, designerName, "iç mimar", "dekorasyon", "tasarım projesi", "Evlumba"],
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: toAbsoluteUrl(canonicalPath),
      siteName: SITE_NAME,
      type: "article",
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

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}) {
  const { slug, projectId } = await params;

  const designer = getDesignerBySlug(slug) ?? (await loadLiveDesignerBySlug(slug));
  if (!designer) return notFound();

  const project =
    getProjectById(slug, projectId) ??
    (designer.portfolio?.find((p) => p.id === projectId) ?? null);
  if (!project) return notFound();

  const { prev, next } = getDesignerBySlug(slug)
    ? getAdjacentProjects(slug, projectId)
    : (() => {
        const list = designer.portfolio ?? [];
        const index = list.findIndex((p) => p.id === projectId);
        return {
          prev: index > 0 ? list[index - 1] : null,
          next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
        };
      })();

  return (
    <ProjectDetailClient
      designer={designer}
      project={project}
      prevProject={prev}
      nextProject={next}
    />
  );
}
