"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "../lib/toast";
import {
  createCollection,
  loadCollections,
  toggleSaveToCollection,
  type Collection,
  type CollectionsState,
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
  const [state, setState] = useState<CollectionsState>({ collections: [] });
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBusy(true);
    void loadCollections()
      .then((next) => {
        setState(next);
        // İlk koleksiyon oluşturulacaksa varsayılan isim ver.
        // En az bir koleksiyon varsa input boş kalsın.
        setNewName(next.collections.length === 0 ? "Favorilerim" : "");
      })
      .finally(() => setBusy(false));
  }, [open]);

  const savedIn = useMemo(
    () => state.collections.filter((c) => c.itemIds.includes(designId)).map((c) => c.id),
    [designId, state.collections]
  );

  async function toggle(colId: string) {
    setBusy(true);
    try {
      const next = await toggleSaveToCollection(colId, designId);
      setState(next);
      toast("Kaydedildi ✅");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Kaydetme başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function createNew() {
    const name =
      newName.trim() ||
      (state.collections.length === 0
        ? "Favorilerim"
        : `Koleksiyon (${new Date().toLocaleDateString("tr-TR")})`);
    setBusy(true);
    try {
      const c = await createCollection(name);
      const next = await toggleSaveToCollection(c.id, designId);
      setState(next);
      setNewName("");
      toast("Yeni koleksiyon oluşturuldu ✅");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Koleksiyon oluşturulamadı");
    } finally {
      setBusy(false);
    }
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
                  disabled={busy}
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
              <button className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-60" onClick={createNew} disabled={busy}>
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
