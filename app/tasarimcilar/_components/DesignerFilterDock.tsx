"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  MapPin,
  Home,
  Briefcase,
  BadgeCheck,
  ChevronDown,
} from "lucide-react";

type Options = {
  cities: string[];
  projects: string[];
  services: string[];
};

const glass = {
  background: "rgba(255,255,255,0.72)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 18px 55px rgba(15,23,42,0.08)",
  backdropFilter: "blur(16px)",
} as const;

const field = {
  background: "rgba(255,255,255,0.86)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.08)",
  backdropFilter: "blur(14px)",
} as const;

function buildUrl(pathname: string, current: string, patch: Record<string, string>) {
  const params = new URLSearchParams(current);
  for (const [k, v] of Object.entries(patch)) {
    if (!v) params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ""}#liste`;
}

function clearAllUrl(pathname: string, current: string) {
  const params = new URLSearchParams(current);
  ["q", "city", "project", "service", "verified", "page"].forEach((k) => params.delete(k));
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ""}#liste`;
}

export default function DesignerFilterDock({
  options,
  anchorId = "liste",
}: {
  options: Options;
  anchorId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);

  // ✅ sadece liste alanına gelince göster
  const [visible, setVisible] = useState(false);

  const qs = sp.toString();
  const q = sp.get("q") || "";
  const city = sp.get("city") || "";
  const project = sp.get("project") || "";
  const service = sp.get("service") || "";
  const verified = sp.get("verified") || "";

  const activeCount = useMemo(() => {
    let c = 0;
    if (q) c++;
    if (city) c++;
    if (project) c++;
    if (service) c++;
    if (verified === "1") c++;
    return c;
  }, [q, city, project, service, verified]);

  const isMobile = () => (typeof window !== "undefined" ? window.innerWidth < 768 : false);

  // ✅ filtre değişince page=1
  const replaceFilter = (patch: Record<string, string>) => {
    const url = buildUrl(pathname, qs, { ...patch, page: "1" });
    startTransition(() => router.replace(url, { scroll: false }));
    if (isMobile()) setOpen(false);
  };

  const clearAll = () => {
    const url = clearAllUrl(pathname, qs);
    startTransition(() => router.replace(url, { scroll: false }));
    if (isMobile()) setOpen(false);
  };

  // ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // body lock (mobil)
  useEffect(() => {
    if (!open) return;
    if (!isMobile()) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ✅ IntersectionObserver: #liste görünür olunca buton görünür
  useEffect(() => {
    const el = document.getElementById(anchorId);
    if (!el) {
      // fallback
      const onScroll = () => {
        const y = window.scrollY || 0;
        setVisible(y > 400);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const obs = new IntersectionObserver(
      (entries) => {
        setVisible(entries[0]?.isIntersecting ?? false);
      },
      {
        root: null,
        // listeye yaklaşınca da tetiklesin
        rootMargin: "-10% 0px -60% 0px",
        threshold: 0.01,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [anchorId]);

  // ✅ panelin web’de sola yapışmaması için container hizası
  // max-w-6xl = 72rem => yarısı 36rem
  const desktopLeft = "max(24px, calc(50% - 36rem + 16px))"; // 16px = px-4

  return (
    <>
      {/* FLOATING BUTTON — sadece visible iken */}
      {visible ? (
        <div className="fixed bottom-5 left-5 z-40 md:bottom-6 md:left-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-px active:translate-y-0"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(99,102,241,0.12) 55%, rgba(255,255,255,0.82) 100%)",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.10), 0 18px 50px rgba(15,23,42,0.16)",
              color: "rgba(15,23,42,0.88)",
              backdropFilter: "blur(12px)",
            }}
            aria-busy={isPending}
          >
            <SlidersHorizontal className="h-4 w-4 opacity-75" />
            Filtrele
            {activeCount > 0 ? (
              <span
                className="ml-1 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-semibold"
                style={{
                  background: "rgba(15,23,42,0.08)",
                  boxShadow: "0 0 0 1px rgba(15,23,42,0.12)",
                }}
                title="Aktif filtre sayısı"
              >
                {activeCount}
              </span>
            ) : null}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </button>
        </div>
      ) : null}

      {/* PANEL */}
      {open ? (
        <div className="fixed inset-0 z-50" onMouseDown={() => setOpen(false)} aria-hidden="true">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

          <div
            className="absolute inset-x-4 bottom-6 max-h-[72vh] overflow-auto rounded-3xl p-4
                       md:bottom-auto md:top-28 md:w-[560px] md:max-h-[80vh]"
            style={{
              ...glass,
              // mobil: inset-x-4 zaten düzgün
              // desktop: container hizasına oturt + soldan biraz nefes
              left: undefined,
              right: undefined,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* desktop positioning via style hack */}
            <style>{`
              @media (min-width: 768px) {
                [data-filter-panel="1"] {
                  left: ${desktopLeft};
                }
              }
            `}</style>

            <div data-filter-panel="1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#0f172a]">Filtreler</div>
                  <div className="mt-1 text-xs text-[rgba(15,23,42,0.55)]">
                    Seçtikçe URL güncellenir ve liste anında filtrelenir.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeCount > 0 ? (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition hover:opacity-95"
                      style={{
                        background: "rgba(255,255,255,0.82)",
                        boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
                        color: "rgba(15,23,42,0.78)",
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      Temizle
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition hover:opacity-95"
                    style={{
                      background: "rgba(255,255,255,0.82)",
                      boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
                      color: "rgba(15,23,42,0.78)",
                    }}
                  >
                    Kapat
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-[rgba(15,23,42,0.72)]">Şehir</div>
                  <div className="mt-2 rounded-2xl px-3 py-2" style={field}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 opacity-60" />
                      <select
                        value={city}
                        onChange={(e) => replaceFilter({ city: e.target.value })}
                        className="w-full bg-transparent text-sm text-[rgba(15,23,42,0.82)] outline-none"
                      >
                        <option value="">Tümü</option>
                        {options.cities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[rgba(15,23,42,0.72)]">Proje tipi</div>
                  <div className="mt-2 rounded-2xl px-3 py-2" style={field}>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 opacity-60" />
                      <select
                        value={project}
                        onChange={(e) => replaceFilter({ project: e.target.value })}
                        className="w-full bg-transparent text-sm text-[rgba(15,23,42,0.82)] outline-none"
                      >
                        <option value="">Tümü</option>
                        {options.projects.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[rgba(15,23,42,0.72)]">Hizmet</div>
                  <div className="mt-2 rounded-2xl px-3 py-2" style={field}>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 opacity-60" />
                      <select
                        value={service}
                        onChange={(e) => replaceFilter({ service: e.target.value })}
                        className="w-full bg-transparent text-sm text-[rgba(15,23,42,0.82)] outline-none"
                      >
                        <option value="">Tümü</option>
                        {options.services.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[rgba(15,23,42,0.72)]">Doğrulama</div>
                  <div className="mt-2 rounded-2xl px-3 py-2" style={field}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[rgba(15,23,42,0.78)]">
                      <input
                        type="checkbox"
                        checked={verified === "1"}
                        onChange={(e) =>
                          replaceFilter({ verified: e.target.checked ? "1" : "" })
                        }
                        className="h-4 w-4 rounded border-[rgba(15,23,42,0.18)]"
                      />
                      <span className="inline-flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 opacity-60" />
                        Sadece doğrulanmış
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : null}
    </>
  );
}
