import Link from "next/link";
import { designers } from "../../../lib/data";
import Actions from "./Actions";

export default async function DesignerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const designer = designers.find((d) => d.id === id);

  if (!designer) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Profil bulunamadı</h1>
        <p className="mt-2 text-gray-600">Bu iç mimar kaydı yok.</p>
        <Link className="mt-4 inline-block underline" href="/designers">
          Listeye dön
        </Link>
      </div>
    );
  }

  const previewProjects = designer.projects.slice(0, 3);

  return (
    <div>
      <Link className="underline text-sm" href="/designers">
        ← İç mimarlara dön
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border bg-white">
        <div className="aspect-[16/9] w-full bg-gray-100">
          <img
            src={designer.coverUrl}
            alt={designer.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{designer.name}</h1>
              <p className="mt-1 text-gray-600">{designer.city}</p>
            </div>

            <Link
              href={`/designers/${designer.id}/projects`}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              Tüm projeler
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {designer.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Login required butonlar */}
          <Actions designerId={designer.id} />

          {/* Son Projeler */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Son Projeler</h2>
              <Link className="underline text-sm" href={`/designers/${designer.id}/projects`}>
                Hepsini gör →
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {previewProjects.map((p) => (
                <Link
                  key={p.pid}
                  href={`/designers/${designer.id}/projects/${p.pid}`}
                  className="block overflow-hidden rounded-2xl border bg-white hover:shadow-sm"
                >
                  <div className="aspect-[4/3] w-full bg-gray-100">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold">{p.title}</div>
                    <div className="text-xs text-gray-500">{p.room}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
            Profil + proje galerisi çalışıyor ✅
          </div>
        </div>
      </div>
    </div>
  );
}
