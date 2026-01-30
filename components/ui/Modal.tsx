"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/cn";

export default function Modal({
  open,
  title,
  children,
  onClose,
  className,
}: {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      <div
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={cn("w-full max-w-lg rounded-3xl bg-white shadow-[0_30px_90px_rgba(0,0,0,0.45)]", className)}>
          <div className="flex items-center justify-between border-b border-black/5 p-4">
            <div className="text-base font-semibold">{title ?? ""}</div>
            <button className="rounded-xl px-3 py-1.5 text-sm hover:bg-black/[0.05]" onClick={onClose}>
              Kapat
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
