"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  isProjectSaved,
  setIntendedAction,
  toggleProjectSave,
} from "../../../lib/storage";
import { toast } from "../../../lib/toast";

export default function SaveButton({
  designerId,
  projectId,
}: {
  designerId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isProjectSaved(designerId, projectId));
  }, [designerId, projectId]);

  function handleClick() {
    if (!getSession()) {
      setIntendedAction({
        type: "toggleProjectSave",
        payload: { designerId, pid: projectId },
        returnTo: window.location.pathname,
      });
      toast("Proje kaydetmek için giriş yap");
      router.push("/login");
      return;
    }
    const v = toggleProjectSave(designerId, projectId);
    setSaved(v);
    toast(v ? "Proje kaydedildi ✅" : "Proje kaydı kaldırıldı");
  }

  return (
    <button
      onClick={handleClick}
      className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
        saved
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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
