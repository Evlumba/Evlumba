"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { getSession, setIntendedAction } from "@/lib/storage";

const SAVED_PROJECTS_KEY = "evlumba_saved_projects_v1";

function getSavedMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SAVED_PROJECTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function setSavedMap(next: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(next));
}

export default function SaveProjectQuick({ designId, title }: { designId: string; title: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const map = getSavedMap();
    setSaved(!!map[designId]);
  }, [designId]);

  function toggle() {
    const session = getSession();
    if (!session) {
      setIntendedAction({
        type: "save",
        targetId: designId,
        returnTo: typeof window !== "undefined" ? window.location.pathname : "/",
      });
      toast("Kaydetmek için giriş yapmalısın");
      return;
    }

    const map = getSavedMap();
    const next = { ...map, [designId]: !map[designId] };
    setSavedMap(next);
    setSaved(!!next[designId]);

    toast(next[designId] ? `Kaydedildi ✅ (${title})` : "Kayıttan kaldırıldı");
  }

  return (
    <button
      className={`rounded-xl border px-4 py-2 text-sm ${saved ? "bg-black text-white" : "bg-white"}`}
      onClick={toggle}
    >
      {saved ? "Kaydedildi" : "Kaydet"}
    </button>
  );
}
