import Link from "next/link";
import { designers } from "../../lib/data";

export default function DesignersPage() {
  const list = Array.isArray(designers) ? designers : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">Profesyoneller</h1>
        <p className="mt-1 text-gray-600">
          Türkiye-first ilham & profesyonel keşfi. Kartlara tıklayıp profil detayına gidebilirsin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d: any) => (
          <div key={String(d.id)} className="overflow-hidden rounded-2xl border bg-white">
            <div className="aspect-[16/9] bg-gray-100">
              <img
                src={d.coverUrl || d.cover || d.imageUrl || "/placeholder.png"}
                alt={d.name || "Profesyonel"}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                  <img
                    src={d.avatarUrl || d.avatar || d.photoUrl || "/placeholder.png"}
                    alt={d.name || "Profil"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{d.name || "İsimsiz Profesyonel"}</div>
                  <div className="text-sm text-gray-600">
                    {(d.city || d.location || "—")} • ⭐ {d.rating ?? d.score ?? "—"}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(d.specialties || d.tags || []).slice(0, 3).map((t: any) => (
                  <span key={String(t)} className="rounded-full border px-2 py-1 text-xs text-gray-700">
                    {String(t)}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/designers/${d.id}`}
                  className="flex-1 rounded-xl bg-black px-3 py-2 text-center text-sm text-white"
                >
                  Görüntüle
                </Link>
                <Link
                  href={`/designers/${d.id}`}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  Teklif Al
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!list.length ? (
        <div className="rounded-2xl border bg-white p-6 text-gray-600">
          Şu an liste boş görünüyor. (Seed data yüklenmemiş olabilir.)
        </div>
      ) : null}
    </div>
  );
}
