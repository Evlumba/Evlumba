import Link from "next/link";
import * as data from "@/lib/data";
import SaveProjectQuick from "../SaveProjectQuick";

type Params = { id: string; pid: string };

function isPromise<T>(v: any): v is Promise<T> {
  return v && typeof v === "object" && typeof v.then === "function";
}

export default async function DesignerProjectPage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  // ✅ Next.js 16: params bazen Promise geliyor
  const resolved = isPromise<Params>(params) ? await params : params;
  const id = resolved.id;
  const pid = resolved.pid;

  const anyData: any = data;

  const designers: any[] =
    (Array.isArray(anyData.designers) && anyData.designers) ||
    (Array.isArray(anyData.professionals) && anyData.professionals) ||
    [];

  const designer =
    designers.find((d) => String(d?.id) === String(id)) ||
    designers.find((d) => String(d?.slug) === String(id)) ||
    null;

  const projects: any[] =
    (Array.isArray(designer?.projects) && designer.projects) ||
    (Array.isArray(anyData.projects) && anyData.projects) ||
    [];

  const project =
    projects.find((p) => String(p?.id) === String(pid)) ||
    projects.find((p) => String(p?.pid) === String(pid)) ||
    projects.find((p) => String(p?.slug) === String(pid)) ||
    null;

  const title = String(project?.title || project?.name || "Proje");
  const cover =
    String(
      project?.coverUrl ||
        project?.imageUrl ||
        (Array.isArray(project?.images) ? project.images[0] : "") ||
        "/placeholder.png"
    ) || "/placeholder.png";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">
            <Link className="underline" href={`/designers/${id}`}>
              Profesyonel
            </Link>{" "}
            /{" "}
            <Link className="underline" href={`/designers/${id}/projects`}>
              Projeler
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
          <div className="mt-1 text-sm text-gray-600">
            {designer ? `${designer.name || designer.fullName || "Profesyonel"}` : "Profesyonel"}
          </div>
        </div>

        <SaveProjectQuick designId={String(pid)} title={title} />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="aspect-[16/9] bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={title} className="h-full w-full object-cover" />
        </div>

        <div className="p-4">
          {project?.description ? (
            <p className="text-sm text-gray-700">{project.description}</p>
          ) : (
            <p className="text-sm text-gray-500">
              Bu proje için demo açıklama (seed data).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
