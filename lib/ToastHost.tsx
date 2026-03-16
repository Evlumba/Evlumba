"use client";

import { useEffect, useState } from "react";

type T = { id: string; message: string };

export default function ToastHost() {
  const [toasts, setToasts] = useState<T[]>([]);

  useEffect(() => {
    function onToast(e: any) {
      const msg = e?.detail?.message ?? "";
      if (!msg) return;
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      setToasts((t) => [...t, { id, message: msg }]);
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 1600);
    }

    window.addEventListener("evlumba_toast", onToast as any);
    return () => window.removeEventListener("evlumba_toast", onToast as any);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(360px,calc(100%-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
