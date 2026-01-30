"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "../lib/storage";

export default function TopStatusBar() {
  const [status, setStatus] = useState<"pending" | "rejected" | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) return;
    if (s.role === "designer" && (s.designerStatus === "pending" || s.designerStatus === "rejected")) {
      setStatus(s.designerStatus);
    } else {
      setStatus(null);
    }
  }, []);

  if (!status) return null;

  const text =
    status === "pending"
      ? "Profesyonel başvurun inceleniyor (Beklemede)"
      : "Profesyonel başvurun reddedildi (Demo)";

  return (
    <div className="border-b bg-gray-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 text-sm">
        <span className="text-gray-700">{text}</span>
        <Link className="underline" href="/profil">
          Durumu gör
        </Link>
      </div>
    </div>
  );
}
