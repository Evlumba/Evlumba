"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { designers } from "../../../lib/data";
import { getSession, setIntendedAction } from "../../../lib/storage";
import { toast } from "../../../lib/toast";

export default function ProfessionalProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = (params as any)?.id as string;

  const designer = useMemo(() => (designers as any[]).find((d) => d.id === id), [id]);
  const [tab, setTab] = useState<"projeler" | "tasarimlar" | "yorumlar">("projeler");

  if (!designer) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-lg font-semibold">Profesyonel bulunamadı</div>
        <div className="mt-3">
          <Link className="rounded-xl border px-4 py-2 text-sm" href="/professionals">
            Profesyonellere dön
          </Link>
        </div>
      </div>
    );
  }

  const cover = designer.projects?.[0]?.imageUrl ?? "https://picsum.photos/1200/800";

  function requireLogin(intended: any) {
    if (getSession()) return true;
    setIntendedAction({
      ...intended,
      returnTo: window.location.pathname + window.location.search,
    });
    toast("Devam etmek için giriş yapmalısın");
    router.push("/login");
    return false;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="aspect-[16/6] w-full bg-gray-100">
          <img src={cover} alt={designer.name} className="h-full w-full object-cover" />
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{designer.name}</h1>
              <div className="mt-1 text-sm text-gray-600">
                {designer.city} • {(designer.specialties?.join(" • ") ?? "İç Mimarlık")}
              </div>
              <p className="mt-3 text-gray-700">
                {designer.bio ?? "Bu profesyonelin öne çıkan işleri ve yaklaşımı burada."}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:min-w-[220px]">
              <button
                className="rounded-xl border px-4 py-2 text-sm"
                onClick={() => {
                  if (!requireLogin({ type: "toggleFollow", payload: { designerId: designer.id } })) return;
                  toast("Takip edildi ✅");
                }}
              >
                Takip Et
              </button>

              <button
                className="rounded-xl border px-4 py-2 text-sm"
                onClick={() => {
                  if (!requireLogin({ type: "saveDesigner", payload: { designerId: designer.id } })) return;
                  toast("Kaydedildi ✅");
                }}
              >
                Kaydet
              </button>

              <button
                className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                onClick={() => {
                  if (!requireLogin({ type: "offerRequest", payload: { designerId: designer.id } })) return;
                  toast("Teklif isteği (mesaj+bildirim) bir sonraki adım ✅");
                }}
              >
                Teklif Al
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {["Telefon Doğrulandı", "Instagram Doğrulandı", "Belge Yüklendi"].map((b) => (
              <span key={b} className="rounded-full border px-3 py-1 text-xs">
                {b}
              </span>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              className={`rounded-xl border px-4 py-2 text-sm ${
                tab === "projeler" ? "bg-black text-white border-black" : ""
              }`}
              onClick={() => setTab("projeler")}
            >
              Projeler
            </button>
            <button
              className={`rounded-xl border px-4 py-2 text-sm ${
                tab === "tasarimlar" ? "bg-black text-white border-black" : ""
              }`}
              onClick={() => setTab("tasarimlar")}
            >
              Tasarımlar
            </button>
            <button
              className={`rounded-xl border px-4 py-2 text-sm ${
                tab === "yorumlar" ? "bg-black text-white border-black" : ""
              }`}
              onClick={() => setTab("yorumlar")}
            >
              Yorumlar
            </button>
          </div>
        </div>
      </div>

      {tab === "projeler" ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(designer.projects ?? []).map((p: any) => (
            <Link
              key={p.pid}
              href={`/designers/${designer.id}/projects/${p.pid}`}
              className="overflow-hidden rounded-2xl border bg-white"
            >
              <div className="aspect-[4/3] w-full bg-gray-100">
                <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm text-gray-500">{p.room}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : tab === "tasarimlar" ? (
        <div className="mt-6 rounded-2xl border bg-white p-6 text-gray-600">
          Tasarımlar tab’ını bir sonraki adımda “design entity” ile dolduracağız.
          <div className="mt-3">
            <Link className="rounded-xl border px-4 py-2 text-sm" href="/designs">
              Tasarımlara git
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border bg-white p-6 text-gray-600">
          Yorumlar: sonraki adımda “tek yorum + edit” kuralını bağlayacağız.
        </div>
      )}
    </div>
  );
}
