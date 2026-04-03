import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import SaveButton from "./SaveButton";
import AppBanner from "./AppBanner";

export const revalidate = 3600;

type Params = { id: string };

async function fetchProject(id: string) {
  const supabase = getSupabaseAdminClient();
  const { data: project } = await supabase
    .from("designer_projects")
    .select(
      "id, designer_id, title, project_type, location, description, tags, budget_level, cover_image_url, created_at, designer_project_images(image_url, sort_order)"
    )
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!project) return null;

  const { data: designer } = await supabase
    .from("profiles")
    .select("id, full_name, business_name, avatar_url, specialty, city")
    .eq("id", project.designer_id)
    .single();

  return { project, designer };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchProject(id);
  if (!result) return {};

  const { project, designer } = result;
  const designerName =
    (designer as any)?.business_name || (designer as any)?.full_name || "Tasarımcı";
  const title = `${project.title} – ${designerName} | ${SITE_NAME}`;
  const description =
    (project.description as string)?.slice(0, 155) ||
    `${designerName} tarafından tasarlanan ${project.title} projesi. Evlumba'da keşfet.`;
  const ogImage =
    (project.cover_image_url as string) ||
    ((project.designer_project_images as any[])?.[0]?.image_url ?? "");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/projects/${id}`,
      siteName: SITE_NAME,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

const BUDGET_LABELS: Record<string, string> = {
  low: "₺",
  medium: "₺₺",
  high: "₺₺₺",
  pro: "₺₺₺ Pro",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const result = await fetchProject(id);
  if (!result) return notFound();

  const { project, designer } = result;

  const images: string[] = (
    (project.designer_project_images as any[]) ?? []
  )
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((i: any) => i.image_url)
    .filter(Boolean);

  if (project.cover_image_url && !images.includes(project.cover_image_url as string)) {
    images.unshift(project.cover_image_url as string);
  }

  const coverImage = images[0] ?? null;
  const tags: string[] = (project.tags as string[]) ?? [];
  const designerName =
    (designer as any)?.business_name || (designer as any)?.full_name || "Tasarımcı";
  const budgetLabel = BUDGET_LABELS[project.budget_level as string] ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight text-teal-600"
          >
            Evlumba
          </Link>
          <div className="flex items-center gap-2">
            <SaveButton projectId={project.id as string} />
            <Link
              href="/kesfet"
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Keşfet
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sol: Görseller */}
          <div className="flex-1">
            {coverImage && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src={coverImage}
                  alt={project.title as string}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.slice(1, 9).map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-xl"
                  >
                    <Image
                      src={url}
                      alt={`${project.title} - ${i + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sağ: Bilgiler */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              {/* Başlık + Bütçe */}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-gray-900 leading-snug">
                  {project.title as string}
                </h1>
                {budgetLabel && (
                  <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
                    {budgetLabel}
                  </span>
                )}
              </div>

              {/* Konum */}
              {project.location && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {project.location as string}
                </p>
              )}

              {/* Etiketler */}
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Açıklama */}
              {project.description && (
                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Proje Hakkında
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                    {project.description as string}
                  </p>
                </div>
              )}

              {/* Tasarımcı */}
              {designer && (
                <>
                  <div className="my-5 h-px bg-slate-100" />
                  <Link
                    href={`/tasarimcilar/supa_${(designer as any).id}`}
                    className="flex items-center gap-3 rounded-xl p-2 -mx-2 transition hover:bg-slate-50"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow">
                      {(designer as any).avatar_url ? (
                        <Image
                          src={(designer as any).avatar_url}
                          alt={designerName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-teal-100 text-teal-600 text-lg font-bold">
                          {designerName[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {designerName}
                      </p>
                      {(designer as any).specialty && (
                        <p className="truncate text-xs text-gray-500">
                          {(designer as any).specialty}
                        </p>
                      )}
                    </div>
                    <svg className="h-5 w-5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </>
              )}

              {/* CTA */}
              <Link
                href={designer ? `/tasarimcilar/supa_${(designer as any).id}` : "/kesfet"}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)",
                }}
              >
                Tasarımcıyla İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </main>
      <AppBanner projectId={project.id as string} />
    </div>
  );
}
