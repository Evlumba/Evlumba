"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "../../../lib/toast";
import { buildFeedUniverse } from "../../../lib/reco";
import { createCollectionWithItems, getCollectionByShareId, type Collection } from "../../../lib/collections";

export default function PublicCollectionPage() {
  const params = useParams<{ shareId: string }>();
  const shareId = params?.shareId;

  const [col, setCol] = useState<Collection | null>(null);
  const [cloned, setCloned] = useState(false);
  const [loading, setLoading] = useState(true);

  const universe = useMemo(() => buildFeedUniverse(), []);
  const byId = useMemo(() => {
    const m = new Map<string, { id: string; designerId: string; pid: string; imageUrl: string; title: string; room: string }>();
    universe.forEach((x) => m.set(x.id, x));
    return m;
  }, [universe]);

  useEffect(() => {
    if (!shareId) return;
    setLoading(true);
    void getCollectionByShareId(shareId)
      .then(setCol)
      .finally(() => setLoading(false));
  }, [shareId]);

  if (!shareId) return <div className="rounded-2xl border bg-white p-6">Geçersiz link.</div>;

  if (loading) {
    return <div className="rounded-2xl border bg-white p-6 text-gray-600">Koleksiyon yükleniyor…</div>;
  }

  if (!col) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-xl font-semibold">Koleksiyon bulunamadı</div>
          <div className="mt-1 text-gray-600">Link yanlış olabilir veya paylaşım kapatılmış olabilir.</div>
          <div className="mt-4">
            <Link className="rounded-xl bg-black px-4 py-2 text-sm text-white" href="/designs">
              Tasarımlara dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = col.itemIds
    .map((id) => byId.get(id))
    .filter(
      (
        x
      ): x is { id: string; designerId: string; pid: string; imageUrl: string; title: string; room: string } =>
        Boolean(x)
    );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-gray-600">Paylaşılan Koleksiyon</div>
            <h1 className="text-2xl font-semibold">{col.name}</h1>
            <div className="mt-1 text-gray-600">{items.length} tasarım</div>
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-xl bg-black px-4 py-2 text-sm text-white"
              disabled={cloned}
              onClick={async () => {
                try {
                  await createCollectionWithItems(`Kopya: ${col.name}`, col.itemIds);
                  setCloned(true);
                  toast("Koleksiyon hesabına kopyalandı ✅");
                } catch (error) {
                  toast(error instanceof Error ? error.message : "Kopyalama başarısız");
                }
              }}
            >
              {cloned ? "Kopyalandı" : "Bu koleksiyonu kaydet"}
            </button>
            <Link className="rounded-xl border px-4 py-2 text-sm" href="/designs">
              Tasarımlar
            </Link>
          </div>
        </div>
      </div>

      {items.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <Link
              key={d.id}
              href={`/designers/${d.designerId}/projects/${d.pid}`}
              className="overflow-hidden rounded-2xl border bg-white hover:shadow-sm transition"
            >
              <div className="aspect-4/3 bg-gray-100">
                <img src={d.imageUrl} alt={d.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <div className="font-semibold">{d.title}</div>
                <div className="mt-1 text-sm text-gray-600">{d.room}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-6 text-gray-600">Bu koleksiyon boş.</div>
      )}
    </div>
  );
}
