"use client";

import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import * as React from "react";
import { createPortal } from "react-dom";

import {
  exploreRooms,
  exploreFilterOptions,
  type ExploreIdea,
  type ExploreRoomId,
} from "../../../lib/data";



function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** -------------------- filters -------------------- **/
type Filters = {
  roomId?: ExploreRoomId;
  sub?: string;
  q: string;
  styles: string[];
  colors: string[];
  budgets: Array<(typeof exploreFilterOptions.budgets)[number]>;
  cities: string[];
};

function hasAnyFilter(f: Filters) {
  return Boolean(
    f.roomId ||
      f.sub ||
      f.q.trim() ||
      f.styles.length ||
      f.colors.length ||
      f.budgets.length ||
      f.cities.length
  );
}

/** -------------------- URL helpers (Houzz-style) -------------------- **/
function slugifyTR(input: string) {
  const map: Record<string, string> = {
    ğ: "g",
    Ğ: "g",
    ü: "u",
    Ü: "u",
    ş: "s",
    Ş: "s",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ç: "c",
    Ç: "c",
  };
  return input
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .trim()
    .replace(/&/g, " ve ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function roomIdToSlug(id?: ExploreRoomId) {
  if (!id) return "";
  const r = exploreRooms.find((x) => x.id === id);
  return r ? slugifyTR(r.label) : "";
}

function slugToRoomId(slug?: string) {
  if (!slug) return undefined;
  const s = slugifyTR(slug);
  const found = exploreRooms.find((x) => slugifyTR(x.label) === s);
  return found?.id as ExploreRoomId | undefined;
}

function parseKesfetFromUrl(roomSlug: string | undefined, sp: URLSearchParams) {
  const roomId = roomSlug ? slugToRoomId(roomSlug) : undefined;

  const q = (sp.get("q") ?? "").trim();
  const sub = sp.get("sub") ?? undefined;
  const style = sp.get("style") ?? undefined;
  const color = sp.get("color") ?? undefined;
  const city = sp.get("city") ?? undefined;

  let budgets = sp.getAll("budget");
  if (budgets.length === 1 && budgets[0]?.includes(",")) {
    budgets = budgets[0].split(",").map((x) => x.trim()).filter(Boolean);
  }

  const tasteOn = sp.get("taste") === "1";
  const pageRaw = parseInt(sp.get("page") ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const filters: Filters = {
    roomId,
    sub,
    q,
    styles: style ? [style] : [],
    colors: color ? [color] : [],
    budgets: budgets as any,
    cities: city ? [city] : [],
  };

  return { filters, page, tasteOn };
}

function buildKesfetUrl(filters: Filters, page: number, tasteOn: boolean) {
  const slug = filters.roomId ? roomIdToSlug(filters.roomId) : "";
  const base = slug ? `/kesfet/${slug}` : `/kesfet`;

  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.sub) params.set("sub", filters.sub);
  if (filters.styles[0]) params.set("style", filters.styles[0]);
  if (filters.colors[0]) params.set("color", filters.colors[0]);
  if (filters.cities[0]) params.set("city", filters.cities[0]);
  (filters.budgets ?? []).forEach((b) => params.append("budget", String(b)));

  if (tasteOn) params.set("taste", "1");
  if (page > 1) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** -------------------- mock auth -------------------- **/
const SESSION_KEY = "evlumba.session";
const TASTE_KEY = "evlumba.taste.tags";
const SAVES_KEY = "evlumba.saves";

function getSession(): { id: string; name: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function getTasteTags(): string[] {
  try {
    const raw = localStorage.getItem(TASTE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function getSaves(): string[] {
  try {
    const raw = localStorage.getItem(SAVES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function persistSaves(ids: string[]) {
  localStorage.setItem(SAVES_KEY, JSON.stringify(ids));
}

/** -------------------- icons -------------------- **/
function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 21l-4.35-4.35" />
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
    </svg>
  );
}
function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.0"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
function IconSpark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2l1.2 5.1L18 9l-4.8 1.9L12 16l-1.2-5.1L6 9l4.8-1.9L12 2z" />
      <path d="M19 13l.7 2.2L22 16l-2.3.8L19 19l-.7-2.2L16 16l2.3-.8L19 13z" />
    </svg>
  );
}
function IconBookmark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconChevron(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.0"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function IconCaretDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.0"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function IconSliders(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M2 14h4" />
      <path d="M10 8h4" />
      <path d="M18 16h4" />
    </svg>
  );
}

/** -------------------- dropdown helpers -------------------- **/
function useAnchorRect(open: boolean, ref: React.RefObject<HTMLElement | null>) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setRect(el.getBoundingClientRect());
  }, [ref]);

  React.useLayoutEffect(() => {
    if (!open) return;
    measure();
    const onScroll = () => measure();
    const onResize = () => measure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, measure]);

  return rect;
}

function QuickDropdown({
  label,
  value,
  placeholder = "Seç",
  options,
  onChange,
  variant = "default",
}: {
  label: string;
  value?: string;
  placeholder?: string;
  options: string[];
  onChange: (next?: string) => void;
  variant?: "default" | "color" | "budget";
}) {
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const rect = useAnchorRect(open, btnRef);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const budgetIcon = (b: string) => {
    if (b === "Uygun") return "₺";
    if (b === "Orta") return "₺₺";
    if (b === "Premium") return "✦";
    return "✦✦";
  };

  const swatch = (c: string) => {
    const map: Record<string, string> = {
      Beyaz: "#ffffff",
      Siyah: "#0f172a",
      Bej: "#e7dfd2",
      Gri: "#cbd5e1",
      Yeşil: "#22c55e",
      Mavi: "#3b82f6",
      Kahverengi: "#92400e",
      Krem: "#f5f5dc",
      Turuncu: "#f97316",
      Kırmızı: "#ef4444",
      Sarı: "#eab308",
      Pembe: "#ec4899",
      Mor: "#a855f7",
    };
    return map[c] ?? "#cbd5e1";
  };

  const buttonText = value ? value : placeholder;

  const menu =
    open && rect
      ? createPortal(
          <div className="fixed inset-0 z-80">
            <button
              className="absolute inset-0 cursor-default"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
            />
            <div
              className="fixed"
              style={{
                top: Math.round(rect.bottom + 10),
                left: Math.round(
                  Math.min(
                    rect.left,
                    window.innerWidth - Math.max(280, rect.width) - 12
                  )
                ),
                width: Math.max(240, Math.round(rect.width)),
              }}
            >
              <div className="overflow-hidden rounded-[22px] border border-black/10 bg-white/75 backdrop-blur-xl shadow-[0_30px_90px_-70px_rgba(0,0,0,0.45)]">
                <div className="px-4 py-3 border-b border-black/5">
                  <div className="text-[11px] font-semibold tracking-[0.22em] text-slate-500/80">
                    {label.toUpperCase()}
                  </div>
                </div>

                <div className="p-2">
                  {value && (
                    <button
                      onClick={() => {
                        onChange(undefined);
                        setOpen(false);
                      }}
                      className="w-full rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-black/5 transition"
                    >
                      Temizle
                    </button>
                  )}

                  <div
                    className={cn(
                      "grid gap-2",
                      variant === "budget" ? "grid-cols-2" : "grid-cols-1"
                    )}
                  >
                    {options.map((opt) => {
                      const active = opt === value;
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            onChange(active ? undefined : opt);
                            setOpen(false);
                          }}
                          className={cn(
                            "rounded-2xl border border-black/10 bg-white/70 px-3 py-2.5 text-left hover:bg-white transition",
                            active && "ring-2 ring-black/10 bg-white"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {variant === "color" && (
                                <span
                                  className="h-4 w-4 rounded-full border border-black/10"
                                  style={{ background: swatch(opt) }}
                                />
                              )}
                              <div className="text-sm font-semibold text-slate-900">
                                {opt}
                              </div>
                            </div>

                            {variant === "budget" && (
                              <div className="text-slate-700 font-extrabold">
                                {budgetIcon(opt)}
                              </div>
                            )}
                          </div>

                          {variant === "budget" && (
                            <div className="mt-1 text-xs text-slate-500">
                              {opt === "Uygun"
                                ? "Akıllı çözümler"
                                : opt === "Orta"
                                ? "Dengeli"
                                : opt === "Premium"
                                ? "Yüksek kalite"
                                : "Tasarım odaklı"}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
          "border border-black/10 bg-white/65 backdrop-blur hover:bg-white",
          open && "ring-2 ring-black/10 bg-white"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="text-slate-800">
          {label === "Stil" || label === "Bütçe" || label === "Renk" ? (
            value ? (
              <>
                <span className="text-slate-500 font-semibold">{label}: </span>
                <span className="text-slate-900">{buttonText}</span>
              </>
            ) : (
              <span className="text-slate-800">{label}</span>
            )
          ) : (
            <span className="text-slate-800">{buttonText}</span>
          )}
        </span>

        <IconCaretDown
          className={cn(
            "h-4.5 w-4.5 text-slate-500 transition",
            open && "rotate-180"
          )}
        />
      </button>

      {menu}
    </>
  );
}

/** -------------------- chip -------------------- **/
function Chip({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-slate-700 backdrop-blur shadow-[0_10px_35px_-28px_rgba(15,23,42,0.22)]">
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="grid h-5 w-5 place-items-center rounded-full hover:bg-black/5 transition"
          aria-label="Kaldır"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

/** -------------------- room scroller -------------------- **/
function RoomScroller({
  selected,
  onSelect,
}: {
  selected?: ExploreRoomId;
  onSelect: (id?: ExploreRoomId) => void;
}) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);

  const KITCHEN_URL =
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1400&q=70";

  const roomFallback = React.useCallback((label: string) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#f8fafc"/>
            <stop offset="1" stop-color="#e2e8f0"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#g)"/>
        <circle cx="980" cy="170" r="230" fill="#c7d2fe" opacity="0.35"/>
        <circle cx="240" cy="650" r="270" fill="#a7f3d0" opacity="0.25"/>
        <text x="80" y="720" font-family="ui-sans-serif, system-ui" font-size="56" fill="#0f172a" opacity="0.55">${label}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, []);

  const update = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  React.useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const dx = Math.round(el.clientWidth * 0.78);
    el.scrollBy({ left: dir === "left" ? -dx : dx, behavior: "smooth" });
  };

  return (
    <div className="relative mt-5">
      {canLeft && (
        <button
          onClick={() => scrollBy("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 h-10 w-10 grid place-items-center rounded-2xl border border-white/35 bg-white/60 backdrop-blur-xl shadow-[0_14px_40px_-32px_rgba(15,23,42,0.22)] hover:bg-white/85 transition"
          aria-label="Sola kaydır"
        >
          <span className="rotate-180">
            <IconChevron className="h-5 w-5 text-slate-700" />
          </span>
        </button>
      )}

      {canRight && (
        <button
          onClick={() => scrollBy("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 h-10 w-10 grid place-items-center rounded-2xl border border-white/35 bg-white/60 backdrop-blur-xl shadow-[0_14px_40px_-32px_rgba(15,23,42,0.22)] hover:bg-white/85 transition"
          aria-label="Sağa kaydır"
        >
          <IconChevron className="h-5 w-5 text-slate-700" />
        </button>
      )}

      <div
        ref={scrollerRef}
        className={cn("no-scrollbar flex gap-3 overflow-x-auto scroll-smooth", "py-2 pl-0 pr-2")}
        style={{ WebkitOverflowScrolling: "touch" as any }}
      >
        <style jsx>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {exploreRooms.map((r) => {
          const active = r.id === selected;
          const cover =
            (r.label || "").toLowerCase() === "mutfak" ? KITCHEN_URL : r.coverUrl;

          return (
            <button
              key={r.id}
              onClick={() => onSelect(active ? undefined : r.id)}
              className={cn(
                "group shrink-0 text-left",
                "w-57.5 sm:w-65 md:w-70",
                "rounded-3xl border border-white/35 bg-white/18 backdrop-blur-2xl",
                "hover:bg-white/26 transition",
                active && "ring-2 ring-inset ring-black/10 bg-white/32"
              )}
            >
              <div className="relative overflow-hidden rounded-[18px] m-2">
                <div
                  className="pointer-events-none absolute inset-0 rounded-[18px]"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)" }}
                />
                <div className="aspect-video">
                  <img
                    src={cover}
                    alt={r.label}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = roomFallback(r.label);
                    }}
                  />
                </div>

                <div className="absolute left-3 bottom-3">
                  <span className="inline-flex items-center rounded-full border border-white/35 bg-white/80 backdrop-blur px-3 py-1.5 text-[13px] font-semibold text-slate-900 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.22)]">
                    {r.label}
                  </span>
                </div>

                {active && (
                  <div className="absolute right-3 bottom-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-800">
                      Seçili <IconX className="h-4 w-4" />
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** -------------------- filters modal -------------------- **/
type FilterTabKey = "stil" | "renk" | "butce" | "sehir" | "alt";

function AllFiltersModal({
  open,
  onClose,
  filters,
  setFilters,
  roomLabel,
  availableSub,
  initialTab,
  ideas,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (next: Filters) => void;
  roomLabel: string;
  availableSub: string[];
  initialTab?: FilterTabKey;
  ideas: ExploreIdea[];
}) {
  const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
  const [draft, setDraft] = React.useState<Filters>(() => deepClone(filters));
  const [tab, setTab] = React.useState<FilterTabKey>(initialTab ?? "stil");

  React.useEffect(() => {
    if (!open) return;
    setDraft(deepClone(filters));
    setTab(initialTab ?? "stil");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTab]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const styleVisuals: Record<string, string> = {
    Modern:
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1400&q=70",
    Minimal:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=70",
    Japandi:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6f5?auto=format&fit=crop&w=1400&q=70",
    İskandinav:
      "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1400&q=70",
    Klasik:
      "https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=1400&q=70",
    Endüstriyel:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1400&q=70",
  };

  const swatch = (c: string) => {
    const map: Record<string, string> = {
      Beyaz: "#ffffff",
      Siyah: "#0f172a",
      Bej: "#e7dfd2",
      Gri: "#cbd5e1",
      Yeşil: "#22c55e",
      Mavi: "#3b82f6",
      Kahverengi: "#92400e",
      Krem: "#f5f5dc",
      Turuncu: "#f97316",
      Kırmızı: "#ef4444",
      Sarı: "#eab308",
      Pembe: "#ec4899",
      Mor: "#a855f7",
    };
    return map[c] ?? "#cbd5e1";
  };

  const countFor = (f: Filters) => {
    const q = f.q.trim().toLowerCase();
    return ideas.filter((i) => {
      if (f.roomId && i.roomId !== f.roomId) return false;
      if (f.sub && i.subLabel !== f.sub) return false;
      if (f.styles[0] && i.style !== f.styles[0]) return false;
      if (f.colors[0] && i.color !== f.colors[0]) return false;
      if (f.cities[0] && i.city !== f.cities[0]) return false;
      if (f.budgets.length && !f.budgets.includes(i.budget)) return false;

      if (q) {
        const hay = [
          i.title,
          i.description,
          i.designerName,
          i.roomLabel,
          i.subLabel ?? "",
          i.style,
          i.color,
          i.city,
          i.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).length;
  };

  const draftCount = countFor(draft);

  const tabs: Array<{ key: FilterTabKey; label: string }> = [
    { key: "stil", label: "Stil" },
    { key: "butce", label: "Bütçe" },
    { key: "renk", label: "Renk" },
    { key: "sehir", label: "Şehir" },
    { key: "alt", label: roomLabel ? `${roomLabel} Detayı` : "Alt Kategori" },
  ];

  const clearDraft = () =>
    setDraft({
      roomId: draft.roomId,
      sub: undefined,
      q: "",
      styles: [],
      colors: [],
      budgets: [],
      cities: [],
    });

  const apply = () => {
    setFilters(draft);
    onClose();
  };

  const ToggleButtons = ({
    options,
    selected,
    onPick,
    variant,
  }: {
    options: string[];
    selected: string[];
    onPick: (v: string) => void;
    variant?: "default" | "color" | "city";
  }) => (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((v) => {
        const active = selected.includes(v);
        return (
          <button
            key={v}
            onClick={() => onPick(v)}
            className={cn(
              "rounded-2xl border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold",
              "text-slate-800 hover:bg-white/95 transition",
              active && "ring-2 ring-black/10 bg-white"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{v}</span>
              {variant === "color" && (
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ background: swatch(v) }}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const StyleGrid = () => {
    const items = exploreFilterOptions.styles as unknown as string[];
    return (
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((s) => {
          const active = draft.styles.includes(s);
          const img =
            styleVisuals[s] ||
            "https://images.unsplash.com/photo-1505691723518-36a5ac3b2b55?auto=format&fit=crop&w=1400&q=70";

          return (
            <button
              key={s}
              onClick={() =>
                setDraft({
                  ...draft,
                  styles: active ? [] : [s],
                })
              }
              className={cn(
                "group overflow-hidden rounded-[22px] border border-black/10 bg-white/75 hover:bg-white/95 transition text-left",
                active && "ring-2 ring-black/10 bg-white"
              )}
            >
              <div className="relative h-20 w-full">
                <img src={img} alt={s} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-white/75 via-white/10 to-transparent" />
                {active && (
                  <span className="absolute right-2 top-2 inline-flex items-center rounded-full border border-white/35 bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-800">
                    Seçili
                  </span>
                )}
              </div>
              <div className="px-3 py-2.5">
                <div className="text-sm font-semibold text-slate-900">{s}</div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const BudgetGrid = () => {
    const items = exploreFilterOptions.budgets as unknown as string[];
    const icon = (b: string) => {
      if (b === "Uygun") return "₺";
      if (b === "Orta") return "₺₺";
      if (b === "Premium") return "✦";
      return "✦✦";
    };
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map((b) => {
          const active = draft.budgets.includes(b as any);
          return (
            <button
              key={b}
              onClick={() => {
                const next = active
                  ? draft.budgets.filter((x) => x !== b)
                  : [...draft.budgets, b as any];
                setDraft({ ...draft, budgets: next as any });
              }}
              className={cn(
                "relative overflow-hidden rounded-[20px] border border-black/10 bg-white/75 px-4 py-3 text-left hover:bg-white/95 transition",
                active && "ring-2 ring-black/10 bg-white"
              )}
            >
              <div className="relative flex items-center justify-between">
                <div className="text-[13px] font-semibold text-slate-900">{b}</div>
                <div className="text-slate-700 font-extrabold">{icon(b)}</div>
              </div>
              <div className="relative mt-1 text-xs text-slate-500">
                {b === "Uygun"
                  ? "Akıllı çözümler"
                  : b === "Orta"
                  ? "Dengeli"
                  : b === "Premium"
                  ? "Yüksek kalite"
                  : "Tasarım odaklı"}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-[26px] border border-black/10 bg-white/70 backdrop-blur p-4 sm:p-5 shadow-[0_24px_80px_-68px_rgba(15,23,42,0.22)]">
      <div className="text-xs font-semibold tracking-widest text-slate-500">
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );

  const chips = (() => {
    const out: Array<{ key: string; node: React.ReactNode; onRemove: () => void }> =
      [];

    if (draft.sub) {
      out.push({
        key: "sub",
        node: draft.sub,
        onRemove: () => setDraft({ ...draft, sub: undefined }),
      });
    }
    if (draft.styles[0]) {
      out.push({
        key: "style",
        node: draft.styles[0],
        onRemove: () => setDraft({ ...draft, styles: [] }),
      });
    }
    if (draft.colors[0]) {
      out.push({
        key: "color",
        node: (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-3.5 w-3.5 rounded-full border border-black/10"
              style={{ background: swatch(draft.colors[0]) }}
            />
            {draft.colors[0]}
          </span>
        ),
        onRemove: () => setDraft({ ...draft, colors: [] }),
      });
    }
    if (draft.cities[0]) {
      out.push({
        key: "city",
        node: draft.cities[0],
        onRemove: () => setDraft({ ...draft, cities: [] }),
      });
    }
    if (draft.budgets.length) {
      draft.budgets.forEach((b) => {
        out.push({
          key: `budget-${b}`,
          node: b,
          onRemove: () =>
            setDraft({
              ...draft,
              budgets: draft.budgets.filter((x) => x !== b),
            }),
        });
      });
    }
    return out;
  })();

  return (
    <div className="fixed inset-0 z-70">
      <button
        className="absolute inset-0 bg-slate-900/35"
        onClick={onClose}
        aria-label="Kapat"
      />

      <div className="absolute inset-x-0 top-10 mx-auto w-[94vw] max-w-4xl">
        <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white/72 backdrop-blur-xl shadow-[0_44px_140px_-110px_rgba(15,23,42,0.55)]">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/5">
            <div>
              <div className="text-sm font-extrabold tracking-tight text-slate-900">
                Tüm Filtreler
              </div>
              <div className="text-xs text-slate-500">
                {roomLabel ? `${roomLabel} için` : "Tüm tasarımlar"} •{" "}
                <span className="font-semibold text-slate-900">{draftCount}</span>{" "}
                sonuç
              </div>
            </div>

            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/95 transition"
            >
              Kapat <IconX className="h-4 w-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-12 gap-4 p-5">
            <div className="md:col-span-4">
              <div className="rounded-[26px] border border-black/10 bg-white/65 backdrop-blur p-2">
                {tabs.map((t) => {
                  const active = t.key === tab;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={cn(
                        "w-full text-left rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                        active
                          ? "bg-white shadow-[0_14px_45px_-36px_rgba(15,23,42,0.18)] text-slate-900"
                          : "hover:bg-white/70 text-slate-700"
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {hasAnyFilter(draft) && (
                <button
                  onClick={clearDraft}
                  className="mt-3 w-full rounded-2xl border border-black/10 bg-white/65 px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white/95 transition"
                >
                  Seçimleri temizle
                </button>
              )}
            </div>

            <div className="md:col-span-8 space-y-3">
              {tab === "stil" && (
                <Section title="Stil">
                  <StyleGrid />
                </Section>
              )}

              {tab === "renk" && (
                <Section title="Renk">
                  <ToggleButtons
                    options={exploreFilterOptions.colors}
                    selected={draft.colors}
                    variant="color"
                    onPick={(v) =>
                      setDraft({
                        ...draft,
                        colors: draft.colors.includes(v) ? [] : [v],
                      })
                    }
                  />
                </Section>
              )}

              {tab === "sehir" && (
                <Section title="Şehir">
                  <ToggleButtons
                    options={exploreFilterOptions.cities}
                    selected={draft.cities}
                    onPick={(v) =>
                      setDraft({
                        ...draft,
                        cities: draft.cities.includes(v) ? [] : [v],
                      })
                    }
                  />
                </Section>
              )}

              {tab === "butce" && (
                <Section title="Bütçe">
                  <BudgetGrid />
                </Section>
              )}

              {tab === "alt" && (
                <Section title={roomLabel ? `${roomLabel} detayı` : "Alt kategori"}>
                  {availableSub.length ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {availableSub.map((v) => {
                        const active = draft.sub === v;
                        return (
                          <button
                            key={v}
                            onClick={() =>
                              setDraft({
                                ...draft,
                                sub: active ? undefined : v,
                              })
                            }
                            className={cn(
                              "rounded-2xl border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/95 transition",
                              active && "ring-2 ring-black/10 bg-white"
                            )}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-slate-600">
                      Önce bir yaşam alanı seçersen burada ona özel seçenekler gelir.
                    </div>
                  )}
                </Section>
              )}
            </div>
          </div>

          <div className="px-5 py-4 border-t border-black/5 bg-white/70 backdrop-blur-xl">
            {chips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <Chip key={c.key} onRemove={c.onRemove}>
                    {c.node}
                  </Chip>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-600">Seçimlerin burada görünecek.</div>
            )}

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{draftCount}</span>{" "}
                sonuç
              </div>

              <div className="flex items-center gap-2">
                {hasAnyFilter(draft) && (
                  <button
                    onClick={clearDraft}
                    className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white transition"
                  >
                    Temizle
                  </button>
                )}

                <button
                  onClick={apply}
                  className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
                >
                  Devam →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** -------------------- cards -------------------- **/
function DesignCard({
  idea,
  isSaved,
  onToggleSave,
  onRequireSignup,
}: {
  idea: ExploreIdea;
  isSaved: boolean;
  onToggleSave: () => void;
  onRequireSignup: () => void;
}) {
  const detailHref = idea.detailUrl || `/tasarim/${idea.id}`;
  const designerHref = idea.designerSlug
    ? `/tasarimcilar/${idea.designerSlug}`
    : `/tasarimcilar/${idea.designerId}`;

  return (
    <div className="group overflow-hidden rounded-[28px] border border-black/10 bg-white/65 backdrop-blur shadow-[0_30px_90px_-72px_rgba(15,23,42,0.30)] hover:bg-white/75 transition">
      <div className="relative">
        <Link href={detailHref} className="block">
          <div className="aspect-16/11">
            <img
              src={idea.imageUrl}
              alt={idea.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </Link>

        <button
          onClick={() => {
            const s = getSession();
            if (!s) return onRequireSignup();
            onToggleSave();
          }}
          className={cn(
            "absolute right-3 top-3 inline-flex items-center gap-2 rounded-2xl px-3 py-2",
            "border border-white/35 bg-white/70 backdrop-blur shadow-[0_18px_60px_-50px_rgba(15,23,42,0.35)] hover:bg-white/90 transition",
            "opacity-100 md:opacity-0 md:group-hover:opacity-100",
            isSaved && "ring-2 ring-black/10"
          )}
          aria-label="Kaydet"
          title="Kaydet"
        >
          <IconBookmark
            className={cn("h-4.5 w-4.5", isSaved ? "text-slate-900" : "text-slate-700")}
          />
          <span className="text-xs font-semibold text-slate-800">
            {isSaved ? "Kaydedildi" : "Kaydet"}
          </span>
        </button>
      </div>

      <div className="p-4">
        <div className="text-[15px] font-semibold tracking-tight text-slate-900">
          {idea.title}
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <Link
            href={designerHref}
            className="flex items-center gap-3 min-w-0"
          >
            <img
              src={idea.designerAvatarUrl}
              alt={idea.designerName}
              className="h-9 w-9 rounded-2xl object-cover border border-black/10"
              loading="lazy"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">
                {idea.designerName}
              </div>
              <div className="truncate text-xs text-slate-500">{idea.city}</div>
            </div>
          </Link>

          <span className="shrink-0 inline-flex items-center rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
            {idea.roomLabel}
          </span>
        </div>

        <p
          className="mt-3 text-sm leading-6 text-slate-600"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {idea.description}
        </p>
      </div>
    </div>
  );
}

function ProCTA({ ideas }: { ideas: ExploreIdea[] }) {
  const people = React.useMemo(() => {
    const map = new Map<string, { name: string; avatar: string }>();
    for (const it of ideas) {
      if (!map.has(it.designerId)) {
        map.set(it.designerId, {
          name: it.designerName,
          avatar:
            it.designerAvatarUrl ||
            `https://i.pravatar.cc/80?u=${encodeURIComponent(it.designerId)}`,
        });
      }
      if (map.size >= 4) break;
    }
    return Array.from(map.values()).slice(0, 4);
  }, [ideas]);

  const totalPros = 40;

  return (
    <Link
      href="/profesyoneller/bul"
      className="group relative block overflow-hidden rounded-[28px] border border-black/10 bg-white/60 backdrop-blur shadow-[0_30px_90px_-72px_rgba(15,23,42,0.30)] hover:bg-white/80 transition"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.22), rgba(139,92,246,0) 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-20 -bottom-24 h-72 w-72 rounded-full blur-3xl opacity-55"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.18), rgba(16,185,129,0) 60%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/40 via-white/10 to-transparent" />

      <div className="relative p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs font-semibold tracking-[0.22em] text-slate-500">
            PROFESYONEL
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-slate-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {totalPros}+ profesyonel
          </span>
        </div>

        <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Doğru profesyoneli bulmana yardımcı olalım.
        </div>

        <div className="mt-2 text-sm text-slate-600 leading-6">
          Tarzına uygun profesyonelleri keşfet, kaydet, direkt ilerle.
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="flex -space-x-3">
              {people.map((p, idx) => (
                <div
                  key={p.name + idx}
                  className="relative h-10 w-10 rounded-full border border-white/80 bg-white shadow-[0_18px_55px_-46px_rgba(15,23,42,0.25)]"
                  title={p.name}
                >
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="h-full w-full rounded-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = `https://i.pravatar.cc/80?u=${encodeURIComponent(p.name)}`;
                    }}
                  />
                </div>
              ))}

              <div className="grid h-10 w-10 place-items-center rounded-full border border-white/80 bg-white/80 backdrop-blur text-xs font-extrabold text-slate-700 shadow-[0_18px_55px_-46px_rgba(15,23,42,0.18)]">
                +{Math.max(0, totalPros - people.length)}
              </div>
            </div>

            <div className="ml-3 hidden sm:block text-xs text-slate-500">
              Zevkine göre{" "}
              <span className="font-semibold text-slate-800">hızlı eşleşme</span>
            </div>
          </div>

          <div className="rounded-2xl p-px bg-linear-to-r from-violet-500/45 via-sky-500/35 to-emerald-500/40 shadow-[0_22px_70px_-55px_rgba(15,23,42,0.35)]">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/45 bg-white/70 backdrop-blur px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white/85 transition">
              Şimdi başla <span className="translate-y-[0.5px]">→</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** -------------------- pagination -------------------- **/
function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const nums = () => {
    const out: Array<number | "..."> = [];
    const push = (v: number | "...") => out.push(v);

    const windowSize = 1;
    push(1);
    const start = Math.max(2, page - windowSize);
    const end = Math.min(totalPages - 1, page + windowSize);

    if (start > 2) push("...");
    for (let i = start; i <= end; i++) push(i);
    if (end < totalPages - 1) push("...");
    push(totalPages);

    return out;
  };

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white transition disabled:opacity-50"
        disabled={page === 1}
      >
        Önceki
      </button>

      <div className="hidden sm:flex items-center gap-1.5">
        {nums().map((n, idx) =>
          n === "..." ? (
            <span key={`e-${idx}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n)}
              className={cn(
                "min-w-10 rounded-2xl border border-black/10 px-3 py-2 text-sm font-semibold transition",
                n === page
                  ? "bg-white text-slate-900 shadow-[0_16px_55px_-46px_rgba(15,23,42,0.22)]"
                  : "bg-white/65 text-slate-700 hover:bg-white"
              )}
            >
              {n}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white transition disabled:opacity-50"
        disabled={page === totalPages}
      >
        Sonraki
      </button>
    </div>
  );
}

/** -------------------- PAGE -------------------- **/
function KesfetPageContent() {
  const router = useRouter();
  const spRaw = useSearchParams();
  const params = useParams() as { room?: string[] };
  const roomSlug = Array.isArray(params.room) ? params.room[0] : undefined;
  const [liveIdeas, setLiveIdeas] = React.useState<ExploreIdea[]>([]);

  const urlKey = `${roomSlug ?? ""}|${spRaw.toString()}`;

  const parsed = React.useMemo(() => {
    const sp = new URLSearchParams(spRaw.toString());
    return parseKesfetFromUrl(roomSlug, sp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  const [filters, setFilters] = React.useState<Filters>(parsed.filters);
  const [tasteOn, setTasteOn] = React.useState(parsed.tasteOn);
  const [page, setPage] = React.useState(parsed.page);
  const [qInput, setQInput] = React.useState(parsed.filters.q);

  React.useEffect(() => {
    // URL değiştiyse (back/forward, link paste, refresh) state’i URL’den çek
    setFilters(parsed.filters);
    setTasteOn(parsed.tasteOn);
    setPage(parsed.page);
    setQInput(parsed.filters.q);
  }, [parsed.filters, parsed.page, parsed.tasteOn]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadLiveIdeas() {
      try {
        const response = await fetch("/api/public/explore-ideas", {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { ok?: boolean; ideas?: ExploreIdea[] };
        if (!cancelled && payload.ok && Array.isArray(payload.ideas)) {
          setLiveIdeas(payload.ideas);
        }
      } catch {
        if (!cancelled) {
          setLiveIdeas([]);
        }
      }
    }

    void loadLiveIdeas();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const allIdeas = React.useMemo(() => liveIdeas, [liveIdeas]);

  const syncUrl = React.useCallback(
    (
      nextFilters: Filters,
      nextPage: number,
      nextTaste: boolean,
      mode: "replace" | "push" = "replace"
    ) => {
      const url = buildKesfetUrl(nextFilters, nextPage, nextTaste);
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [router]
  );

  const currentHref = React.useMemo(
    () => buildKesfetUrl(filters, page, tasteOn),
    [filters, page, tasteOn]
  );

  const requireSignup = React.useCallback(
    (next: string) => {
      router.push(`/kayit?next=${encodeURIComponent(next)}`);
    },
    [router]
  );

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalTab, setModalTab] = React.useState<FilterTabKey>("stil");

  const PAGE_SIZE = 9;

  const roomLabel = React.useMemo(() => {
    if (!filters.roomId) return "";
    return exploreRooms.find((r) => r.id === filters.roomId)?.label ?? "";
  }, [filters.roomId]);

  const availableSub = React.useMemo(() => {
    if (!filters.roomId) return [];
    const s = exploreRooms.find((r) => r.id === filters.roomId)?.sub ?? [];
    return s.filter((x) => x.toLowerCase() !== (roomLabel ?? "").toLowerCase());
  }, [filters.roomId, roomLabel]);

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = qInput.trim();
    const next = { ...filters, q };
    setFilters(next);
    setPage(1);
    syncUrl(next, 1, tasteOn, "push");
  };

  const filtered = React.useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    let list = allIdeas.filter((i) => {
      if (filters.roomId && i.roomId !== filters.roomId) return false;
      if (filters.sub && i.subLabel !== filters.sub) return false;

      if (filters.styles[0] && i.style !== filters.styles[0]) return false;
      if (filters.colors[0] && i.color !== filters.colors[0]) return false;
      if (filters.cities[0] && i.city !== filters.cities[0]) return false;
      if (filters.budgets.length && !filters.budgets.includes(i.budget)) return false;

      if (q) {
        const hay = [
          i.title,
          i.description,
          i.designerName,
          i.roomLabel,
          i.subLabel ?? "",
          i.style,
          i.color,
          i.city,
          i.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (!tasteOn) return list.slice().sort((a, b) => b.popularity - a.popularity);

    const session = getSession();
    if (!session) return list.slice().sort((a, b) => b.popularity - a.popularity);

    const taste = getTasteTags();
    if (!taste.length) return list.slice().sort((a, b) => b.popularity - a.popularity);

    const score = (it: ExploreIdea) =>
      it.tags.reduce((acc, t) => acc + (taste.includes(t) ? 3 : 0), 0);

    return list
      .slice()
      .sort((a, b) => score(b) - score(a) || b.popularity - a.popularity);
  }, [filters, tasteOn, allIdeas]);

  const [saves, setSaves] = React.useState<string[]>([]);
  React.useEffect(() => setSaves(getSaves()), []);

  const toggleSave = (id: string) => {
    const current = new Set(getSaves());
    current.has(id) ? current.delete(id) : current.add(id);
    const next = Array.from(current);
    persistSaves(next);
    setSaves(next);
  };

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  React.useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
      syncUrl(filters, safePage, tasteOn, "replace");
    }
  }, [page, safePage, filters, tasteOn, syncUrl]);

  const start = (safePage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const pageItemsRaw = filtered.slice(start, end);

  const pageItems = React.useMemo(() => {
    const out: Array<{ kind: "idea"; idea: ExploreIdea } | { kind: "cta" }> = [];
    pageItemsRaw.forEach((it, idx) => {
      if (idx === 3) out.push({ kind: "cta" });
      out.push({ kind: "idea", idea: it });
    });
    return out;
  }, [pageItemsRaw]);

  const clearAll = () => {
    const next: Filters = {
      roomId: undefined,
      sub: undefined,
      q: "",
      styles: [],
      colors: [],
      budgets: [],
      cities: [],
    };
    setFilters(next);
    setTasteOn(false);
    setPage(1);
    setQInput("");
    syncUrl(next, 1, false, "push");
  };

  const removeChip = (
    type: "room" | "sub" | "style" | "color" | "city" | "q" | "budget"
  ) => {
    const next = { ...filters };

    if (type === "room") {
      next.roomId = undefined;
      next.sub = undefined;
    }
    if (type === "sub") next.sub = undefined;
    if (type === "style") next.styles = [];
    if (type === "color") next.colors = [];
    if (type === "city") next.cities = [];
    if (type === "budget") next.budgets = [];
    if (type === "q") next.q = "";

    setFilters(next);
    setPage(1);
    if (type === "q") setQInput("");
    syncUrl(next, 1, tasteOn, "replace");
  };

  const onToggleTaste = () => {
    const session = getSession();
    if (!session) return requireSignup(currentHref);

    const taste = getTasteTags();
    if (!taste.length) return router.push(`/oyun?next=${encodeURIComponent(currentHref)}`);

    const nextTaste = !tasteOn;
    setTasteOn(nextTaste);
    setPage(1);
    syncUrl(filters, 1, nextTaste, "replace");
  };

  return (
    <div className="pb-6">
      <div className="mt-3">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
          Tasarımları Keşfet
        </h1>

        {roomLabel && (
          <div className="mt-2 inline-flex items-center rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700">
            {roomLabel}
          </div>
        )}

        <RoomScroller
          selected={filters.roomId}
          onSelect={(id) => {
            const next = { ...filters, roomId: id, sub: undefined };
            setFilters(next);
            setPage(1);
            syncUrl(next, 1, tasteOn, "push");
          }}
        />

        {filters.roomId && availableSub.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {availableSub.map((s) => {
              const active = filters.sub === s;
              return (
                <button
                  key={s}
                  onClick={() => {
                    const next = { ...filters, sub: active ? undefined : s };
                    setFilters(next);
                    setPage(1);
                    syncUrl(next, 1, tasteOn, "replace");
                  }}
                  className={cn(
                    "rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-semibold",
                    "text-slate-800 hover:bg-white transition",
                    active && "ring-2 ring-black/10 bg-white"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 rounded-[28px] border border-black/10 bg-white/55 backdrop-blur-xl shadow-[0_26px_90px_-74px_rgba(0,0,0,0.40)] p-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <form onSubmit={onSubmitSearch} className="flex-1">
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 backdrop-blur px-4 py-3 shadow-[0_18px_55px_-48px_rgba(0,0,0,0.30)] hover:bg-white transition">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 border border-black/5">
                      <IconSearch className="h-5 w-5 text-slate-500" />
                    </span>

                    <input
                      value={qInput}
                      onChange={(e) => setQInput(e.target.value)}
                      placeholder="Aramak istediğin stili yaz… (ör: mermer banyo, japandi salon)"
                      className="w-full bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none"
                      autoComplete="off"
                    />

                    {qInput.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...filters, q: "" };
                          setQInput("");
                          setFilters(next);
                          setPage(1);
                          syncUrl(next, 1, tasteOn, "replace");
                        }}
                        className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 transition"
                        aria-label="Aramayı temizle"
                        title="Temizle"
                      >
                        <IconX className="h-4.5 w-4.5 text-slate-600" />
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setModalTab("stil");
                    setModalOpen(true);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                    "border border-black/10 bg-white/75 backdrop-blur hover:bg-white",
                    hasAnyFilter(filters) && "ring-2 ring-black/10"
                  )}
                >
                  <IconSliders className="h-4.5 w-4.5 text-slate-600" />
                  <span className="text-slate-900">Tüm Filtreler</span>
                </button>

                <QuickDropdown
                  label="Stil"
                  value={filters.styles[0]}
                  options={exploreFilterOptions.styles}
                  onChange={(v) => {
                    const next = { ...filters, styles: v ? [v] : [] };
                    setFilters(next);
                    setPage(1);
                    syncUrl(next, 1, tasteOn, "replace");
                  }}
                />

                <QuickDropdown
                  label="Bütçe"
                  value={filters.budgets[0] as any}
                  options={exploreFilterOptions.budgets as unknown as string[]}
                  variant="budget"
                  onChange={(v) => {
                    const next = { ...filters, budgets: v ? ([v] as any) : [] };
                    setFilters(next);
                    setPage(1);
                    syncUrl(next, 1, tasteOn, "replace");
                  }}
                />

                <QuickDropdown
                  label="Renk"
                  value={filters.colors[0]}
                  options={exploreFilterOptions.colors}
                  variant="color"
                  onChange={(v) => {
                    const next = { ...filters, colors: v ? [v] : [] };
                    setFilters(next);
                    setPage(1);
                    syncUrl(next, 1, tasteOn, "replace");
                  }}
                />

                {hasAnyFilter(filters) && (
                  <button
                    onClick={clearAll}
                    className="rounded-full border border-black/10 bg-white/65 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white transition"
                  >
                    Temizle
                  </button>
                )}
              </div>
            </div>

            {!qInput.trim() && (
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="text-xs font-semibold text-slate-500/80">
                  Öneriler:
                </span>

                {["mermer banyo", "japandi salon", "ahşap mutfak", "minimal yatak odası"].map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => {
                        const next = { ...filters, q: s };
                        setQInput(s);
                        setFilters(next);
                        setPage(1);
                        syncUrl(next, 1, tasteOn, "push");
                      }}
                      className="rounded-full border border-black/10 bg-white/55 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white transition"
                    >
                      {s}
                    </button>
                  )
                )}
              </div>
            )}

            {hasAnyFilter(filters) && (
              <div className="mt-1 flex flex-wrap gap-2">
                {filters.q.trim() && (
                  <Chip onRemove={() => removeChip("q")}>“{filters.q.trim()}”</Chip>
                )}
                {filters.roomId && roomLabel && (
                  <Chip onRemove={() => removeChip("room")}>{roomLabel}</Chip>
                )}
                {filters.sub && (
                  <Chip onRemove={() => removeChip("sub")}>{filters.sub}</Chip>
                )}
                {filters.styles[0] && (
                  <Chip onRemove={() => removeChip("style")}>{filters.styles[0]}</Chip>
                )}
                {filters.colors[0] && (
                  <Chip onRemove={() => removeChip("color")}>{filters.colors[0]}</Chip>
                )}
                {filters.cities[0] && (
                  <Chip onRemove={() => removeChip("city")}>{filters.cities[0]}</Chip>
                )}
                {filters.budgets[0] && (
                  <Chip onRemove={() => removeChip("budget")}>
                    {filters.budgets[0] as any}
                  </Chip>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-6 flex items-center justify-end">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/55 backdrop-blur-xl px-4 py-2 shadow-[0_18px_60px_-54px_rgba(15,23,42,0.35)]">
          <span className="tabular-nums text-sm font-semibold text-slate-900">
            {total}
          </span>
          <span className="text-sm font-semibold text-slate-600">tasarım</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((it, idx) => {
          if (it.kind === "cta") return <ProCTA key={`cta-${idx}`} ideas={allIdeas} />;
          const idea = it.idea;
          const saved = saves.includes(idea.id);

          return (
            <DesignCard
              key={idea.id}
              idea={idea}
              isSaved={saved}
              onToggleSave={() => toggleSave(idea.id)}
              onRequireSignup={() => requireSignup(currentHref)}
            />
          );
        })}
      </div>

      {total === 0 && (
        <div className="mt-10 rounded-[28px] border border-black/10 bg-white/70 backdrop-blur p-7 text-center shadow-[0_24px_80px_-68px_rgba(15,23,42,0.22)]">
          <div className="text-lg font-semibold text-slate-900">Burada bir şey yok gibi…</div>
          <div className="mt-2 text-sm text-slate-600">Filtreleri gevşet ya da aramanı değiştir.</div>
          <button
            onClick={clearAll}
            className="mt-4 rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white transition"
          >
            Temizle
          </button>
        </div>
      )}

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onPage={(p) => {
          setPage(p);
          syncUrl(filters, p, tasteOn, "push");
        }}
      />

      {/* Taste sorting */}
      <button
        onClick={onToggleTaste}
        className={cn(
          "fixed bottom-6 right-5 z-50 inline-flex items-center gap-2 rounded-full px-4 py-3",
          "border border-black/10 backdrop-blur-xl shadow-[0_22px_70px_-52px_rgba(15,23,42,0.35)]",
          tasteOn ? "bg-white text-slate-900" : "bg-white/75 text-slate-800 hover:bg-white",
          "transition"
        )}
        title="Zevkime göre sırala"
      >
        <IconSpark className="h-5 w-5" />
        <span className="text-sm font-semibold">
          {tasteOn ? "Zevkime göre" : "Zevkime göre sırala"}
        </span>
      </button>

      <AllFiltersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        filters={filters}
        setFilters={(next) => {
          setFilters(next);
          setPage(1);
          syncUrl(next, 1, tasteOn, "replace");
        }}
        roomLabel={roomLabel}
        availableSub={availableSub}
        initialTab={modalTab}
        ideas={allIdeas}
      />
    </div>
  );
}

export default function KesfetPage() {
  return (
    <React.Suspense
      fallback={<main className="mx-auto max-w-[1280px] px-4 py-6">Kesfet yukleniyor...</main>}
    >
      <KesfetPageContent />
    </React.Suspense>
  );
}
