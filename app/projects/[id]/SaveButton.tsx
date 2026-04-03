"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession, setIntendedAction } from "../../../lib/storage";
import {
  loadCollections,
  createCollection,
  toggleSaveToCollection,
  getSavedCollectionsForDesign,
  type Collection,
} from "../../../lib/collections";
import { toast } from "../../../lib/toast";

export default function SaveButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedInIds, setSavedInIds] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const checkSaved = useCallback(async () => {
    if (!getSession()) return;
    try {
      const ids = await getSavedCollectionsForDesign(projectId);
      setSaved(ids.length > 0);
      setSavedInIds(ids);
    } catch {}
  }, [projectId]);

  useEffect(() => { checkSaved(); }, [checkSaved]);

  // Picker dışına tıklanınca kapat
  useEffect(() => {
    if (!showPicker) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  async function handleClick() {
    if (!getSession()) {
      setIntendedAction({
        type: "save",
        targetId: projectId,
        returnTo: window.location.pathname,
      });
      toast("Kaydetmek için giriş yap");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const state = await loadCollections();
      const cols = state.collections;

      if (cols.length === 0) {
        // Hiç koleksiyon yok → doğrudan "Kaydedilenler" oluştur ve kaydet
        const col = await createCollection("Kaydedilenler");
        await toggleSaveToCollection(col.id, projectId);
        setSaved(true);
        setSavedInIds([col.id]);
        toast("Kaydedildi ✅");
      } else {
        // Koleksiyonlar var → picker göster
        setCollections(cols);
        const ids = await getSavedCollectionsForDesign(projectId);
        setSavedInIds(ids);
        setShowPicker(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleCollection(col: Collection) {
    await toggleSaveToCollection(col.id, projectId);
    const ids = await getSavedCollectionsForDesign(projectId);
    setSavedInIds(ids);
    setSaved(ids.length > 0);
    toast(ids.includes(col.id) ? `"${col.name}" koleksiyonuna eklendi ✅` : "Koleksiyondan çıkarıldı");
  }

  async function handleCreateAndSave() {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    try {
      const col = await createCollection(name);
      await toggleSaveToCollection(col.id, projectId);
      const ids = await getSavedCollectionsForDesign(projectId);
      setSavedInIds(ids);
      setSaved(true);
      setCollections((prev) => [...prev, col]);
      setNewName("");
      toast(`"${name}" oluşturuldu ve kaydedildi ✅`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
          saved
            ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
            : "bg-white/80 text-gray-600 ring-1 ring-black/10 hover:bg-white"
        }`}
      >
        <svg
          className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : "text-gray-400"}`}
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {saved ? "Kaydedildi" : "Kaydet"}
      </button>

      {/* Koleksiyon Picker */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute right-0 top-10 z-50 w-64 rounded-2xl border bg-white shadow-xl"
        >
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Koleksiyona Kaydet</p>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {collections.map((col) => {
              const isSaved = savedInIds.includes(col.id);
              return (
                <button
                  key={col.id}
                  onClick={() => toggleCollection(col)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50"
                >
                  <span className="text-gray-800">{col.name}</span>
                  {isSaved && (
                    <svg className="h-4 w-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Yeni koleksiyon */}
          <div className="border-t px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Yeni koleksiyon…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateAndSave()}
                className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-teal-500"
              />
              <button
                onClick={handleCreateAndSave}
                disabled={!newName.trim() || loading}
                className="rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
