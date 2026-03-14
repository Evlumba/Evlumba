// app/tasarimcilar/[slug]/proje/[projectId]/page.tsx
import { notFound } from "next/navigation";
import {
  getDesignerBySlug,
  getProjectById,
  getAdjacentProjects,
} from "../../../_data/designers";
import { loadLiveDesignerBySlug } from "../../../_data/liveDesigner";
import ProjectDetailClient from "./_components/ProjectDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
