"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, setIntendedAction } from "@/lib/storage";
import { toast } from "@/lib/toast";

export default function Actions({ designerId }: { designerId: string }) {
  const router = useRouter();

  function gate(action: "follow" | "message" | "offer") {
    const session = getSession();
    if (session) return true;

    // intended action kaydet (login sonrası geri döndürmek için)
    setIntendedAction({
      type: action === "follow" ? "follow" : action === "offer" ? "offer" : "comment",
      targetId: designerId,
      returnTo: `/designers/${designerId}`,
    });

    toast("Bu işlem için giriş yapmalısın");
    router.push("/login");
    return false;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        className="rounded-xl bg-black px-4 py-2 text-sm text-white"
        onClick={() => {
          if (!gate("follow")) return;
          toast("Takip edildi ✅ (demo)");
        }}
      >
        Takip Et
      </button>

      <button
        className="rounded-xl border px-4 py-2 text-sm"
        onClick={() => {
          if (!gate("message")) return;
          toast("Mesajlar sayfasına gidiliyor…");
          router.push("/messages");
        }}
      >
        Mesaj At
      </button>

      <button
        className="rounded-xl border px-4 py-2 text-sm"
        onClick={() => {
          if (!gate("offer")) return;
          toast("Teklif isteği (demo) – mesajlara yönlendirildi");
          router.push("/messages");
        }}
      >
        Teklif Al
      </button>

      <Link
        href={`/designers/${designerId}/projects`}
        className="rounded-xl border px-4 py-2 text-sm"
      >
        Projeleri Gör
      </Link>
    </div>
  );
}
