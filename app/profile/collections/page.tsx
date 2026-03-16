"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "../../../lib/toast";
import { buildFeedUniverse } from "../../../lib/reco";
import { designers as allDesigners } from "../../../lib/data";
import { loadState } from "../../../lib/storage";
import {
  deleteCollection,
  loadCollections,
  renameCollection,
  setCollectionShareable,
  type Collection,
  type CollectionsState,
} from "../../../lib/collections";

function relShareUrl(shareId: string) {
  return `/collection/${shareId}`;
}

function absShareUrl(shareId: string) {
  if (typeof window === "undefined") return relShareUrl(shareId);
  return `${window.location.origin}${relShareUrl(shareId)}`;
}

export default function CollectionsPage() {
  const [state, setState] = useState<CollectionsState>({ collections: [] });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void refresh();
  }, []);

  const universe = useMemo(() => buildFeedUniverse(), []);
  const byId = useMemo(() => {
    const m = new Map<string, { id: string; designerId: string; pid: string; imageUrl: string; title: string }>();
    universe.forEach((x) => m.set(x.id, x));
    return m;
  }, [universe]);

  const followedDesigners = useMemo(() => {
    const follows = loadState().follows ?? {};
    const ids = Object.entries(follows)
      .filter(([, active]) => Boolean(active))
      .map(([id]) => id);
    return allDesigners.filter((d) => ids.includes(d.id));
  }, [state.collections.length]);

  async function refresh() {
    setLoading(true);
    try {
      setState(await loadCollections());
    } finally {
      setLoading(false);
    }
  }

  function copyShare(shareId: string) {
    const url = absShareUrl(shareId);
    try {
      navigator.clipboard.writeText(url);
      toast("Link kopyalandı ✅");
    } catch {
      toast("Kopyalama başarısız (tarayıcı izni)");
    }
  }

  function shareWhatsApp(shareId: string) {
    const url = absShareUrl(shareId);
    const msg = `Evlumba koleksiyonuma bak: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Koleksiyonlarım</h1>
            <p className="mt-1 text-gray-600">
              Kaydettiğin tasarımlar burada. Paylaşımı açarsan link/WhatsApp ile gönderebilirsin.
            </p>
          </div>
          <Link href="/designs" className="rounded-xl bg-black px-4 py-2 text-sm text-white">
            Tasarımlara Git
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Beğendiğim Mimarlar</h2>
        {followedDesigners.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">Henüz beğendiğin mimar yok.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {followedDesigners.map((d) => (
              <Link key={d.id} href={`/designers/${d.id}`} className="rounded-xl border p-3 hover:bg-gray-50">
                <div className="text-sm font-semibold">{d.name}</div>
                <div className="text-xs text-gray-500">{d.city}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-gray-600">Koleksiyonlar yükleniyor…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {state.collections.map((c: Collection) => {
            const expanded = expandedId === c.id;

            return (
              <div key={c.id} className="rounded-2xl border bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{c.name}</div>
                    <div className="mt-1 text-sm text-gray-600">{c.itemIds.length} kayıt</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="rounded-xl border px-3 py-2 text-sm"
                      onClick={() => setExpandedId(expanded ? null : c.id)}
                    >
                      {expanded ? "Kapat" : "Aç"}
                    </button>

                    <button
                      className="rounded-xl border px-3 py-2 text-sm"
                      onClick={async () => {
                        const name = prompt("Koleksiyon adını güncelle", c.name);
                        if (!name) return;
                        await renameCollection(c.id, name.trim());
                        refresh();
                        toast("Güncellendi ✅");
                      }}
                    >
                      Adlandır
                    </button>

                    <button
                      className="rounded-xl border px-3 py-2 text-sm"
                      onClick={async () => {
                        if (!confirm("Koleksiyon silinsin mi?")) return;
                        await deleteCollection(c.id);
                        refresh();
                        toast("Silindi");
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border bg-gray-50 p-3">
                  <div>
                    <div className="text-sm font-semibold">Paylaş</div>
                    <div className="text-xs text-gray-600">Açık olursa linkten herkes görüntüleyebilir.</div>
                  </div>

                  <button
                    className={`rounded-xl px-4 py-2 text-sm ${c.isShareable ? "bg-black text-white" : "border"}`}
                    onClick={async () => {
                      await setCollectionShareable(c.id, !c.isShareable);
                      refresh();
                      toast(c.isShareable ? "Paylaşım kapatıldı" : "Paylaşım açıldı ✅");
                    }}
                  >
                    {c.isShareable ? "Açık" : "Kapalı"}
                  </button>
                </div>

                {c.isShareable && c.shareId ? (
                  <div className="mt-3 rounded-2xl border p-3">
                    <div className="text-xs text-gray-500">Paylaşım Linki</div>
                    {/* ✅ SSR/CSR aynı olsun diye RELATIVE gösteriyoruz */}
                    <div className="mt-1 break-all text-sm font-medium">{relShareUrl(c.shareId)}</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => copyShare(c.shareId!)}>
                        Linki Kopyala
                      </button>
                      <button
                        className="rounded-xl bg-green-600 px-3 py-2 text-sm text-white"
                        onClick={() => shareWhatsApp(c.shareId!)}
                      >
                        WhatsApp Paylaş
                      </button>
                      <Link className="rounded-xl border px-3 py-2 text-sm" href={relShareUrl(c.shareId)}>
                        Public Görünüm
                      </Link>
                    </div>
                  </div>
                ) : null}

                {expanded ? (
                  <div className="mt-4">
                    {c.itemIds.length ? (
                      <div className="grid grid-cols-2 gap-3">
                        {c.itemIds.slice(0, 6).map((id) => {
                          const d = byId.get(id);
                          if (!d) return null;
                          return (
                            <Link
                              key={id}
                              href={`/designers/${d.designerId}/projects/${d.pid}`}
                              className="overflow-hidden rounded-xl border hover:shadow-sm transition"
                            >
                              <div className="aspect-[4/3] bg-gray-100">
                                <img src={d.imageUrl} alt={d.title} className="h-full w-full object-cover" />
                              </div>
                              <div className="p-2 text-xs font-medium">{d.title}</div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
                        Bu koleksiyon boş. /designs sayfasından “Kaydet” ile ekleyebilirsin.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
