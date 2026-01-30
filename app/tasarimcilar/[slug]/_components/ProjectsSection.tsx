"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import type { Designer, PortfolioItem } from "../../_data/designers";

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPhotos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
    </svg>
  );
}

function ProjectCard({
  item,
  designerSlug,
}: {
  item: PortfolioItem;
  designerSlug: string;
}) {
  const photoCount = item.images?.length || 1;

  return (
    <Link
      href={`/tasarimcilar/${designerSlug}/proje/${item.id}`}
      className="group relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5 transition-all hover:ring-black/10 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      <Image
        src={item.coverUrl}
        alt={item.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <h3 className="text-sm font-semibold text-white line-clamp-1">
          {item.title}
        </h3>
        {(item.room || item.style) && (
          <p className="mt-1 text-xs text-white/80">
            {[item.room, item.style].filter(Boolean).join(" • ")}
          </p>
        )}
      </div>

      {/* Room tag - left */}
      {item.room && (
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-black/5 backdrop-blur">
            {item.room}
          </span>
        </div>
      )}

      {/* Photo count badge - right */}
      {photoCount > 1 && (
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <IconPhotos className="h-3 w-3" />
            {photoCount}
          </span>
        </div>
      )}
    </Link>
  );
}

const ITEMS_PER_PAGE = 9;

export default function ProjectsSection({ designer }: { designer: Designer }) {
  const portfolio = designer.portfolio ?? [];
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Kategorileri say ve sırala (en fazladan en aza)
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    portfolio.forEach((item) => {
      if (item.room) {
        counts[item.room] = (counts[item.room] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [portfolio]);

  // Filtrelenmiş projeler
  const filteredProjects = useMemo(() => {
    if (!activeFilter) return portfolio;
    return portfolio.filter((item) => item.room === activeFilter);
  }, [portfolio, activeFilter]);

  // Filtre değişince sayacı sıfırla
  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const visibleProjects = filteredProjects.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProjects.length;
  const remainingCount = filteredProjects.length - visibleCount;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredProjects.length));
  };

  if (portfolio.length === 0) {
    return (
      <section id="projeler" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 mt-8">
          <div className="rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.18)]">
            <div className="p-10 md:p-14">
              <div className="flex flex-col items-center justify-center text-center">
                {/* İllüstrasyon/İkon */}
                <div className="relative mb-6">
                  <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-9 w-9 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <path d="M14 17.5h7M17.5 14v7" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Başlık */}
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Henüz proje eklenmedi
                </h3>

                {/* Açıklama */}
                <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                  {designer.name} yakında projelerini burada paylaşacak.
                  Profili kaydet, yeni projeler eklendiğinde haberdar ol.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projeler" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 mt-8">
        <div className="rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.18)]">
          <div className="p-6 md:p-8">
            {/* Category Filters */}
            <div className="pb-6">
              <div className="flex items-center gap-6 overflow-x-auto">
                {/* Tümü */}
                <button
                  type="button"
                  onClick={() => handleFilterChange(null)}
                  className="group flex items-center gap-2 shrink-0"
                >
                  <span
                    className={[
                      "text-[15px] font-medium transition-colors",
                      activeFilter === null
                        ? "text-gray-900"
                        : "text-gray-400 group-hover:text-gray-600",
                    ].join(" ")}
                  >
                    Tümü
                  </span>
                  <span
                    className={[
                      "text-xs tabular-nums transition-colors",
                      activeFilter === null
                        ? "text-gray-900"
                        : "text-gray-300 group-hover:text-gray-500",
                    ].join(" ")}
                  >
                    {portfolio.length}
                  </span>
                  {activeFilter === null && (
                    <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
                  )}
                </button>

                {/* Kategori butonları */}
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleFilterChange(cat.name)}
                    className="group flex items-center gap-2 shrink-0"
                  >
                    <span
                      className={[
                        "text-[15px] font-medium transition-colors",
                        activeFilter === cat.name
                          ? "text-gray-900"
                          : "text-gray-400 group-hover:text-gray-600",
                      ].join(" ")}
                    >
                      {cat.name}
                    </span>
                    <span
                      className={[
                        "text-xs tabular-nums transition-colors",
                        activeFilter === cat.name
                          ? "text-gray-900"
                          : "text-gray-300 group-hover:text-gray-500",
                      ].join(" ")}
                    >
                      {cat.count}
                    </span>
                    {activeFilter === cat.name && (
                      <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProjects.map((item) => (
                <ProjectCard
                  key={item.id}
                  item={item}
                  designerSlug={designer.slug}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-6 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-100 hover:ring-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <IconPlus className="h-4 w-4" />
                  <span>
                    Daha fazla göster
                    <span className="ml-1 text-gray-400">
                      ({Math.min(remainingCount, ITEMS_PER_PAGE)})
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
