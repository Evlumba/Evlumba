"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "../lib/toast";
import {
  createCollection,
  getSavedCollectionsForDesign,
  loadCollections,
  toggleSaveToCollection,
  type Collection,
} from "../lib/collections";

export default function SaveModal({
  open,
  onClose,
  designId,
  designTitle,
}: {
  open: boolean;
  onClose: () => void;
  designId: string;
  designTitle: string;
}) {
  const [state, setState] = useState(() => loadCollections());
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (open) setState(loadCollections());
  }, [open]);

  const savedIn = useMemo(() => getSavedCollectionsForDesign(designId), [designId, state.collections.length]);

  function toggle(colId: string) {
    const next = toggleSaveToCollection(colId, designId);
    setState(next);
    toast("Kaydedildi ✅");
  }

  function createNew() {
    const name = newName.trim() || `Koleksiyon (${new Date().toLocaleDateString("tr-TR")})`;
    const c = createCollection(name);
    const next = toggleSaveToCollection(c.id, designId);
    setState(next);
    setNewName("");
    toast("Yeni koleksiyon oluşturuldu ✅");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <div className="text-sm text-gray-600">Kaydet</div>
            <div className="font-semibold">{designTitle}</div>
          </div>
          <button className="rounded-xl border px-3 py-1 text-sm" onClick={onClose}>
            Kapat
          </button>
        </div>

        <div className="p-4">
          <div className="text-sm font-semibold">Koleksiyon seç</div>

          <div className="mt-3 space-y-2">
            {state.collections.map((c: Collection) => {
              const checked = savedIn.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.itemIds.length} kayıt</div>
                  </div>

                  <div className={`rounded-full border px-3 py-1 text-xs ${checked ? "bg-black text-white border-black" : ""}`}>
                    {checked ? "Eklendi" : "Ekle"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border bg-gray-50 p-3">
            <div className="text-sm font-semibold">Yeni koleksiyon</div>
            <div className="mt-2 flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn: Salon Yenileme"
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <button className="rounded-xl bg-black px-4 py-2 text-sm text-white" onClick={createNew}>
                Oluştur
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Sonra paylaşılabilir yapıp WhatsApp’tan gönderebilirsin (profil/koleksiyonlar adımında).
            </div>
          </div>
        </div>

        <div className="border-t p-4 text-xs text-gray-500">
          İpucu: Kaydettikten sonra koleksiyon linkini kopyalama/WhatsApp paylaşımı bir sonraki adımda gelecek.
        </div>
      </div>
    </div>
  );
}
