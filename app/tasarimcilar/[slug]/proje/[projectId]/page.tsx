// app/tasarimcilar/[slug]/proje/[projectId]/page.tsx
import { notFound } from "next/navigation";
import {
  getDesignerBySlug,
  getProjectById,
  getAdjacentProjects,
} from "../../../_data/designers";
import ProjectDetailClient from "./_components/ProjectDetailClient";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}) {
  const { slug, projectId } = await params;

  const designer = getDesignerBySlug(slug);
  if (!designer) return notFound();

  const project = getProjectById(slug, projectId);
  if (!project) return notFound();

  const { prev, next } = getAdjacentProjects(slug, projectId);

  return (
    <ProjectDetailClient
      designer={designer}
      project={project}
      prevProject={prev}
      nextProject={next}
    />
  );
}
