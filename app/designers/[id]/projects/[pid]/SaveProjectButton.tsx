"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  isProjectSaved,
  setIntendedAction,
  toggleProjectSave,
} from "../../../../../lib/storage";
import { toast } from "../../../../../lib/toast";

export default function SaveProjectButton({
  designerId,
  pid,
}: {
  designerId: string;
  pid: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isProjectSaved(designerId, pid));
  }, [designerId, pid]);

  function requireLogin(): boolean {
    if (!getSession()) {
      setIntendedAction({
        type: "toggleProjectSave",
        payload: { designerId, pid },
        returnTo: window.location.pathname + window.location.search,
      });
      toast("Proje kaydetmek için giriş yap");
      router.push("/login");
      return false;
    }
    return true;
  }

  return (
    <button
      className={`mt-4 rounded-xl px-4 py-2 text-sm border ${
        saved ? "bg-black text-white border-black" : "bg-white"
      }`}
      onClick={() => {
        if (!requireLogin()) return;
        const v = toggleProjectSave(designerId, pid);
        setSaved(v);
        toast(v ? "Proje kaydedildi ✅" : "Proje kaydı kaldırıldı");
      }}
    >
      {saved ? "Kaydedildi" : "Projeyi Kaydet"}
    </button>
  );
}
