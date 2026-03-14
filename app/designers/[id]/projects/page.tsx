import Link from "next/link";
import * as data from "@/lib/data";

function s(v: any) {
  return v == null ? "" : String(v);
}

export default async function DesignerProjectsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const anyData: any = data;
  const designers: any[] = Array.isArray(anyData.designers) ? anyData.designers : [];

  // designs/feedItems/items hangisi varsa oradan beslen
  const allItems: any[] =
    (Array.isArray(anyData.designs) && anyData.designs) ||
    (Array.isArray(anyData.feedItems) && anyData.feedItems) ||
    (Array.isArray(anyData.items) && anyData.items) ||
    [];

  const designer = designers.find((d) => s(d.id) === s(id));

  if (!designer) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">Profesyonel bulunamadı</h1>
        <p className="mt-2 text-gray-600">Bu ID seed data’da olmayabilir.</p>
        <div className="mt-4 flex gap-2">
          <Link href="/designers" className="rounded-xl bg-black px-4 py-2 text-sm text-white">
            Profesyonellere Dön
          </Link>
          <Link href="/designs" className="rounded-xl border px-4 py-2 text-sm">
            Tasarımlar
          </Link>
        </div>
      </div>
    );
  }

  // Bu profesyonele ait tasarımları çek
  const itemsForDesigner = allItems.filter((x) => s(x.designerId ?? x.designer?.id) === s(id));

  // pid / projectId üzerinden projeleri grupla
  const map = new Map<
    string,
    { pid: string; title: string; coverUrl: string; count: number; room?: string; style?: string }
  >();

  for (const x of itemsForDesigner) {
    const pid = s(x.pid ?? x.projectId ?? x.project?.id ?? x.id); // pid yoksa design id'yi proje gibi kullan
    if (!pid) continue;

    const title =
      s(x.projectTitle) ||
      s(x.project?.title) ||
      s(x.title) ||
      `Proje #${pid}`;

    const coverUrl =
      s(x.coverUrl) ||
      s(x.imageUrl) ||
      s(x.project?.coverUrl) ||
      s(designer.coverUrl) ||
      s(designer.cover) ||
      "";

    const existing = map.get(pid);
    if (existing) {
      existing.count += 1;
      // ilk değeri koru
    } else {
      map.set(pid, {
        pid,
        title,
        coverUrl,
        count: 1,
        room: s(x.room || x.roomType) || undefined,
        style: s(x.style || x.styleTag) || undefined,
      });
    }
  }

  const projects = Array.from(map.values()).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{designer.name || "Profesyonel"} • Projeler</h1>
            <p className="mt-1 text-gray-600">
              {projects.length} proje • {itemsForDesigner.length} tasarım
            </p>
          </div>

          <div className="flex gap-2">
            <Link href={`/designers/${designer.id}`} className="rounded-xl border px-4 py-2 text-sm">
              Profesyonel Profili
            </Link>
            <Link href="/designs" className="rounded-xl bg-black px-4 py-2 text-sm text-white">
              Tasarımlar
            </Link>
          </div>
        </div>
      </div>

      {projects.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.pid}
              href={`/designers/${designer.id}/projects/${p.pid}`}
              className="overflow-hidden rounded-2xl border bg-white hover:shadow-sm transition"
            >
              <div className="aspect-[16/9] bg-gray-100">
                {p.coverUrl ? (
                  <img src={p.coverUrl} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Görsel yok
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="font-semibold">{p.title}</div>
                <div className="mt-1 text-sm text-gray-600">
                  {p.count} tasarım
                  {p.room ? ` • ${p.room}` : ""}
                  {p.style ? ` • ${p.style}` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-6 text-gray-600">
          Bu profesyonel için proje/tasarım bulunamadı (seed data).
        </div>
      )}
    </div>
  );
}
