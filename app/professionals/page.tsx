"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { designers } from "../../lib/data";

type Filters = {
  city: string;
  onlyRemote: boolean;
};

const cities = ["Tümü", "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"];

export default function ProfessionalsPage() {
  const [draft, setDraft] = useState<Filters>({ city: "Tümü", onlyRemote: false });
  const [applied, setApplied] = useState<Filters>({ city: "Tümü", onlyRemote: false });

  const activeChips = useMemo(() => {
    const chips: string[] = [];
    if (applied.city !== "Tümü") chips.push(applied.city);
    if (applied.onlyRemote) chips.push("Uzaktan");
    return chips;
  }, [applied]);

  const list = useMemo(() => {
    return (designers as any[]).filter((d) => {
      const cityOk = applied.city === "Tümü" ? true : d.city === applied.city;
      const remoteOk = applied.onlyRemote ? !!d.remote : true;
      return cityOk && remoteOk;
    });
  }, [applied]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profesyoneller</h1>
          <p className="mt-2 text-gray-600">
            Profil → projeler → mesaj/teklif akışına gidecek şekilde kuruyoruz.
          </p>
        </div>

        <div className="flex gap-3">
          <Link className="rounded-xl border px-4 py-2 text-sm" href="/designs">
            Tasarımlar
          </Link>
          <Link className="rounded-xl bg-black px-4 py-2 text-sm text-white" href="/ai">
            İlham AI
          </Link>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="text-sm text-gray-600">Şehir</div>
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={draft.city}
              onChange={(e) => setDraft((x) => ({ ...x, city: e.target.value }))}
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.onlyRemote}
                onChange={(e) =>
                  setDraft((x) => ({ ...x, onlyRemote: e.target.checked }))
                }
              />
              Uzaktan
            </label>
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-xl border px-4 py-2 text-sm"
              onClick={() => {
                setDraft({ city: "Tümü", onlyRemote: false });
                setApplied({ city: "Tümü", onlyRemote: false });
              }}
            >
              Temizle
            </button>
            <button
              className="rounded-xl bg-black px-4 py-2 text-sm text-white"
              onClick={() => setApplied(draft)}
            >
              Uygula
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">{list.length} sonuç</span>
          {activeChips.map((c) => (
            <span key={c} className="rounded-full border px-3 py-1 text-xs">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d: any) => {
          const cover = d.projects?.[0]?.imageUrl ?? "https://picsum.photos/600/400";
          return (
            <div key={d.id} className="overflow-hidden rounded-2xl border bg-white">
              <Link href={`/professional/${d.id}`} className="block">
                <div className="aspect-[4/3] w-full bg-gray-100">
                  <img src={cover} alt={d.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-sm text-gray-500">
                    {d.city} • {(d.specialties?.join(" • ") ?? "İç Mimarlık")}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {d.bio ?? "Detaylı profil ve projeler için görüntüle."}
                  </div>
                </div>
              </Link>

              <div className="border-t p-3">
                <Link
                  className="block w-full rounded-xl border px-3 py-2 text-center text-sm"
                  href={`/professional/${d.id}`}
                >
                  Görüntüle
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
