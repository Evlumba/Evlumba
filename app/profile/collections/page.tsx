"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "../../../lib/toast";
import {
  deleteCollection,
  loadCollections,
  renameCollection,
  createCollection,
  toggleSaveToCollection,
  fetchProjectCardsByIds,
  type Collection,
  type CollectionsState,
  type ProjectCard,
} from "../../../lib/collections";

export default function CollectionsPage() {
  const [state, setState] = useState<CollectionsState>({ collections: [] });
  const [loading, setLoading] = useState(true);
  const [projectCards, setProjectCards] = useState<Map<string, ProjectCard>>(new Map());
  const [newColName, setNewColName] = useState("");
  const [showNewCol, setShowNewCol] = useState(false);

  const allItemIds = useMemo(() => {
    const ids = new Set<string>();
    state.collections.forEach((c) => c.itemIds.forEach((id) => ids.add(id)));
    return [...ids];
  }, [state.collections]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await loadCollections();
      setState(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (allItemIds.length === 0) return;
    fetchProjectCardsByIds(allItemIds).then(setProjectCards);
  }, [allItemIds.join(",")]);

  async function handleCreateCollection() {
    const name = newColName.trim();
    if (!name) return;
    await createCollection(name);
    setNewColName("");
    setShowNewCol(false);
    await refresh();
    toast("Koleksiyon oluşturuldu ✅");
  }

  async function handleRemoveItem(collectionId: string, itemId: string) {
    await toggleSaveToCollection(collectionId, itemId);
    await refresh();
    toast("Kaldırıldı");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Koleksiyonlarım</h1>
            <p className="mt-1 text-sm text-gray-500">Kaydettiğin projeler burada listelenir.</p>
          </div>
          <button
            onClick={() => setShowNewCol(true)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Koleksiyon
          </button>
        </div>

        {/* Yeni koleksiyon formu */}
        {showNewCol && (
          <div className="mt-4 flex items-center gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Koleksiyon adı (ör. Mutfak, Banyo…)"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            <button
              onClick={handleCreateCollection}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Oluştur
            </button>
            <button
              onClick={() => { setShowNewCol(false); setNewColName(""); }}
              className="rounded-xl border px-4 py-2 text-sm text-gray-600"
            >
              İptal
            </button>
          </div>
        )}
      </div>

      {/* Collections */}
      {loading ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">Yükleniyor…</div>
      ) : state.collections.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="text-gray-500">Henüz kaydedilmiş proje yok.</p>
          <Link href="/kesfet" className="mt-4 inline-block rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white">
            Projeleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {state.collections.map((c: Collection) => (
            <CollectionCard
              key={c.id}
              collection={c}
              projectCards={projectCards}
              onRename={async () => {
                const name = prompt("Yeni koleksiyon adı", c.name);
                if (!name?.trim()) return;
                await renameCollection(c.id, name.trim());
                await refresh();
                toast("Güncellendi ✅");
              }}
              onDelete={async () => {
                if (!confirm(`"${c.name}" silinsin mi?`)) return;
                await deleteCollection(c.id);
                await refresh();
                toast("Silindi");
              }}
              onRemoveItem={(itemId) => handleRemoveItem(c.id, itemId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({
  collection,
  projectCards,
  onRename,
  onDelete,
  onRemoveItem,
}: {
  collection: Collection;
  projectCards: Map<string, ProjectCard>;
  onRename: () => void;
  onDelete: () => void;
  onRemoveItem: (id: string) => void;
}) {
  const items = collection.itemIds
    .map((id) => projectCards.get(id))
    .filter(Boolean) as ProjectCard[];

  const coverImage = items[0]?.coverImageUrl ?? null;

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      {/* Kapak görseli */}
      {coverImage ? (
        <div className="relative h-36 w-full bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt={collection.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <p className="text-lg font-bold text-white drop-shadow">{collection.name}</p>
            <p className="text-xs text-white/80">{collection.itemIds.length} proje</p>
          </div>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center bg-slate-50">
          <div>
            <p className="text-base font-semibold text-gray-700">{collection.name}</p>
            <p className="text-center text-xs text-gray-400">{collection.itemIds.length} proje</p>
          </div>
        </div>
      )}

      {/* Proje ızgarası */}
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Bu koleksiyon boş.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.slice(0, 6).map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-xl bg-gray-100">
                <Link href={`/projects/${p.id}`}>
                  {p.coverImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.coverImageUrl}
                      alt={p.title}
                      className="aspect-square h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="aspect-square flex items-center justify-center text-xs text-gray-400">
                      Görsel yok
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => onRemoveItem(p.id)}
                  className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white group-hover:flex"
                  title="Kaldır"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {items.length > 6 && (
              <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-100 text-sm font-semibold text-gray-500">
                +{items.length - 6}
              </div>
            )}
          </div>
        )}

        {/* Aksiyonlar */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onRename}
            className="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            Yeniden Adlandır
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}
