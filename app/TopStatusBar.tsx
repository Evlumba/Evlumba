"use client";

import Link from "next/link";
import { getSession } from "../lib/storage";

export default function TopStatusBar() {
  const s = getSession();
  const status =
    s?.role === "designer" && (s.designerStatus === "pending" || s.designerStatus === "rejected")
      ? s.designerStatus
      : null;

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
