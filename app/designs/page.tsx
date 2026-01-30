"use client";

import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";

import SaveModal from "../../components/SaveModal";
import { getSession } from "../../lib/storage";
import { buildFeedUniverse, rankByStyleVector } from "../../lib/reco";
import { toast } from "../../lib/toast";
import {
  DEFAULT_FILTERS,
  type DesignFilters,
  type FilterChip,
  toChips,
} from "../../lib/filters";

type SortKey = "recommended" | "new" | "popular" | "personal";

function DesignCard({
  title,
  imageUrl,
  subtitle,
  href,
  tags,
}: {
  title: string;
  imageUrl: string;
  subtitle: string;
  href: string;
  tags: string[];
}) {
  return (
    <Link
      href={href}
      className="overflow-hidden rounded-2xl border bg-white hover:shadow-sm transition"
    >
      <div className="aspect-[4/3] w-full bg-gray-100">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="font-semibold">{title}</div>
        <div className="mt-1 text-sm text-gray-600">{subtitle}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.slice(0, 4).map((t: string) => (
            <span key={t} className="rounded-full border px-3 py-1 text-xs">
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function DesignsPage() {
  const session: any = getSession?.();
  const styleVector: string[] = session?.styleVector ?? [];
  const completed = !!session?.style_swipe_completed;

  const all = useMemo(() => buildFeedUniverse(), []);

  const withMeta = useMemo<any[]>(() => {
    return (all as any[]).map((x: any, i: number) => ({
      ...x,
      createdAt: Date.now() - i * 1000 * 60 * 60 * 24,
      likes: (x.tags?.length ?? 0) * 7 + (i % 13),
      city: ["İstanbul", "Ankara", "İzmir", "Bursa"][i % 4],
      budgetK: 80 + (i % 8) * 25,
      vibe: ["Sıcak Ton", "Soğuk Ton", "Açık Ton", "Koyu Ton"][i % 4],
    }));
  }, [all]);

  // Filters
  const [draft, setDraft] = useState<DesignFilters>({ ...DEFAULT_FILTERS });
  const [applied, setApplied] = useState<DesignFilters>({ ...DEFAULT_FILTERS });

  // Sorting
  const [sort, setSort] = useState<SortKey>("recommended");

  // Save modal state
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTarget, setSaveTarget] = useState<{ id: string; title: string } | null>(null);

  const chips = useMemo<FilterChip[]>(() => toChips(applied), [applied]);

  const filtered = useMemo<any[]>(() => {
    let items: any[] = [...withMeta];

    if (applied.room) items = items.filter((x) => x.room === applied.room);
    if (applied.city) items = items.filter((x) => x.city === applied.city);
    if (applied.vibe) items = items.filter((x) => x.vibe === applied.vibe);

    if (applied.budgetMax && applied.budgetMax > 0) {
      items = items.filter((x) => x.budgetK <= Number(applied.budgetMax));
    }

    if (applied.onlyPopular) items = items.filter((x) => x.likes >= 18);

    if (sort === "new") items.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === "popular") items.sort((a, b) => b.likes - a.likes);

    if (sort === "personal") {
      items = rankByStyleVector(items as any, styleVector) as any;
    }

    if (sort === "recommended") {
      items.sort(
        (a, b) =>
          b.likes * 2 + b.createdAt / 1e12 - (a.likes * 2 + a.createdAt / 1e12)
      );
    }

    return items;
  }, [withMeta, applied, sort, styleVector]);

  function applyFilters() {
    setApplied({ ...draft });
    toast("Filtreler uygulandı ✅");
  }

  function clearFilters() {
    setDraft({ ...DEFAULT_FILTERS });
    setApplied({ ...DEFAULT_FILTERS });
    toast("Filtreler temizlendi");
  }

  function removeChip(key: string) {
    const nextApplied: any = { ...applied };
    const nextDraft: any = { ...draft };

    if (key === "onlyPopular") {
      nextApplied.onlyPopular = false;
      nextDraft.onlyPopular = false;
    } else if (key === "budgetMax") {
      nextApplied.budgetMax = 0;
      nextDraft.budgetMax = 0;
    } else {
      nextApplied[key] = "";
      nextDraft[key] = "";
    }

    setApplied(nextApplied);
    setDraft(nextDraft);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Tasarımlar</h1>
            <p className="mt-1 text-gray-600">
              Filtreleri seç, sonra “Uygula” ile sonuçları güncelle.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">Sırala</div>
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={sort}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSort(e.target.value as SortKey)
              }
            >
              <option value="recommended">Önerilen</option>
              <option value="new">En Yeni</option>
              <option value="popular">En Popüler</option>
              <option value="personal" disabled={!completed}>
                Sana Özel {completed ? "" : "(Tarzını keşfet gerekli)"}
              </option>
            </select>

            {!completed ? (
              <Link
                href="/style-swipe"
                className="rounded-xl bg-black px-3 py-2 text-sm text-white"
              >
                Tarzını Keşfet
              </Link>
            ) : null}
          </div>
        </div>

        {/* Chips */}
        {chips.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip: FilterChip) => (
              <button
                key={chip.key}
                onClick={() => removeChip(chip.key)}
                className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
                title="Kaldır"
              >
                {chip.label} ✕
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-500">Aktif filtre yok.</div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Filter panel */}
          <div className="rounded-2xl border p-4 lg:col-span-4">
            <div className="text-sm font-semibold">Filtreler</div>

            <div className="mt-3">
              <div className="text-sm text-gray-600">Oda Tipi</div>
              <select
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                value={draft.room || ""}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setDraft((prev: DesignFilters) => ({
                    ...prev,
                    room: e.target.value,
                  }))
                }
              >
                <option value="">Tümü</option>
                <option value="Salon">Salon</option>
                <option value="Mutfak">Mutfak</option>
                <option value="Yatak Odası">Yatak Odası</option>
                <option value="Banyo">Banyo</option>
                <option value="Teras">Teras</option>
                <option value="Çalışma">Çalışma</option>
              </select>
            </div>

            <div className="mt-3">
              <div className="text-sm text-gray-600">Şehir</div>
              <select
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                value={draft.city || ""}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setDraft((prev: DesignFilters) => ({
                    ...prev,
                    city: e.target.value,
                  }))
                }
              >
                <option value="">Tümü</option>
                <option value="İstanbul">İstanbul</option>
                <option value="Ankara">Ankara</option>
                <option value="İzmir">İzmir</option>
                <option value="Bursa">Bursa</option>
              </select>
            </div>

            <div className="mt-3">
              <div className="text-sm text-gray-600">Renk Hissi</div>
              <select
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                value={draft.vibe || ""}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setDraft((prev: DesignFilters) => ({
                    ...prev,
                    vibe: e.target.value as any,
                  }))
                }
              >
                <option value="">Tümü</option>
                <option value="Sıcak Ton">Sıcak Ton</option>
                <option value="Soğuk Ton">Soğuk Ton</option>
                <option value="Açık Ton">Açık Ton</option>
                <option value="Koyu Ton">Koyu Ton</option>
              </select>
            </div>

            <div className="mt-3">
              <div className="text-sm text-gray-600">Bütçe (K)</div>
              <input
                type="range"
                min={0}
                max={300}
                step={25}
                value={draft.budgetMax || 0}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDraft((prev: DesignFilters) => ({
                    ...prev,
                    budgetMax: Number(e.target.value),
                  }))
                }
                className="mt-2 w-full"
              />
              <div className="mt-1 text-xs text-gray-500">
                {draft.budgetMax && draft.budgetMax > 0
                  ? `≤ ${draft.budgetMax}K`
                  : "Sınırsız"}
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!draft.onlyPopular}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDraft((prev: DesignFilters) => ({
                    ...prev,
                    onlyPopular: e.target.checked,
                  }))
                }
              />
              Popüler olanlar
            </label>

            <div className="mt-4 flex gap-2">
              <button
                className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white"
                onClick={applyFilters}
              >
                Uygula
              </button>
              <button
                className="w-full rounded-xl border px-4 py-2 text-sm"
                onClick={clearFilters}
              >
                Temizle
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">{filtered.length} sonuç</div>
              <button
                className="rounded-xl border px-3 py-2 text-sm"
                onClick={() => toast("Bir sonraki adım: Like kalıcı + login gate + koleksiyon paylaş")}
              >
                Hızlı Not
              </button>
            </div>

            {filtered.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filtered.map((x: any) => (
                  <div key={x.id} className="relative">
                    <div className="absolute right-3 top-3 z-10 flex gap-2">
                      <button
                        className="rounded-xl bg-white/90 border px-3 py-1 text-xs"
                        onClick={() => toast("Beğenildi ❤️")}
                      >
                        Beğen
                      </button>
                      <button
                        className="rounded-xl bg-black text-white px-3 py-1 text-xs"
                        onClick={() => {
                          setSaveTarget({ id: x.id, title: x.title });
                          setSaveOpen(true);
                        }}
                      >
                        Kaydet
                      </button>
                    </div>

                    <DesignCard
                      title={x.title}
                      subtitle={`${x.room} • ${x.city} • ${x.likes} beğeni • ~${x.budgetK}K`}
                      imageUrl={x.imageUrl}
                      tags={x.tags || []}
                      href={`/designers/${x.designerId}/projects/${x.pid}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border bg-white p-6 text-gray-600">
                Sonuç yok. Filtreleri genişletmeyi dene.
                <div className="mt-3">
                  <button
                    className="rounded-xl border px-4 py-2 text-sm"
                    onClick={clearFilters}
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SaveModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        designId={saveTarget?.id || ""}
        designTitle={saveTarget?.title || "Tasarım"}
      />
    </div>
  );
}
