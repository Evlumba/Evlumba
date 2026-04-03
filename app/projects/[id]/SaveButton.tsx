"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession, setIntendedAction } from "../../../lib/storage";
import {
  loadCollections,
  createCollection,
  toggleSaveToCollection,
  getSavedCollectionsForDesign,
} from "../../../lib/collections";
import { toast } from "../../../lib/toast";

export default function SaveButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkSaved = useCallback(async () => {
    if (!getSession()) return;
    try {
      const cols = await getSavedCollectionsForDesign(projectId);
      setSaved(cols.length > 0);
    } catch {}
  }, [projectId]);

  useEffect(() => {
    checkSaved();
  }, [checkSaved]);

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
      let collection = state.collections.find((c) => c.name === "Kaydedilenler");
      if (!collection) {
        collection = await createCollection("Kaydedilenler");
      }
      await toggleSaveToCollection(collection.id, projectId);
      const next = !saved;
      setSaved(next);
      toast(next ? "Projeye kaydedildi ✅" : "Kaydedilenden çıkarıldı");
    } catch {
      toast("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}
