"use client";

import { useMemo, useState } from "react";
import type { Designer, PortfolioItem } from "../../_data/designers";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

export default function PortfolioSection({ designer }: { designer: Designer }) {
  const items = useMemo(() => designer.portfolio ?? [], [designer.portfolio]);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<PortfolioItem | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const images = active?.images?.length ? active.images : active ? [active.coverUrl] : [];

  const openItem = (it: PortfolioItem) => {
    setActive(it);
    setImgIdx(0);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setActive(null);
  };

  const prev = () => setImgIdx((p) => (p - 1 + images.length) % images.length);
  const next = () => setImgIdx((p) => (p + 1) % images.length);

  if (!items.length) return null;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Portföy</h2>
          <p className="mt-1 text-sm text-slate-600">
            Projelerden seçmeler. (Detaylar MVP’de büyür)
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => openItem(it)}
            className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-left hover:border-slate-300"
          >
            <div className="relative h-48">
              <img
                src={it.coverUrl}
                alt={it.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>

            <div className="p-4">
              <div className="font-semibold text-slate-900">{it.title}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {it.room ? (
                  <span className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs text-slate-700">
                    {it.room}
                  </span>
                ) : null}
                {it.style ? (
                  <span className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs text-slate-700">
                    {it.style}
                  </span>
                ) : null}
                {it.budget ? (
                  <span className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs text-slate-700">
                    {it.budget}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {open && active ? (
        <div className="fixed inset-0 z-[80] bg-black/60 p-4 backdrop-blur-sm" onClick={close}>
          <div
            className="mx-auto mt-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={images[Math.min(imgIdx, images.length - 1)]}
                alt={active.title}
                className="h-[360px] w-full object-cover md:h-[520px]"
              />

              {images.length > 1 ? (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/75 p-3 text-slate-900 hover:bg-white"
                    aria-label="Önceki"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/75 p-3 text-slate-900 hover:bg-white"
                    aria-label="Sonraki"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}

              <button
                onClick={close}
                className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-slate-900 hover:bg-white"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-white/95 p-5">
              <div className="text-lg font-semibold text-slate-900">{active.title}</div>
              <div className="mt-2 text-sm text-slate-600">
                {[active.location, active.year, active.room, active.style].filter(Boolean).join(" • ")}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
