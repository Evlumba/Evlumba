"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { designers } from "@/lib/data";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** -------------------- Auth (basit) -------------------- */
function isAuthedClient() {
  if (typeof window === "undefined") return false;
  // farklı ihtimallere tolerans (ileride auth ekleyince bozmayalım)
  const keys = ["evl_session", "evl_user", "evl_auth", "evl_token"];
  return keys.some((k) => {
    const v = window.localStorage.getItem(k);
    return !!v && v !== "null" && v !== "undefined";
  });
}

function goSignup(router: ReturnType<typeof useRouter>, nextUrl: string) {
  router.push(`/kayit?next=${encodeURIComponent(nextUrl)}`);
}

/** -------------------- Data model -------------------- */
type Idea = {
  id: string;
  title: string;
  room: string;
  style: string;
  budget4: "Ekonomik" | "Orta" | "Premium" | "Lüks";
  city: string;
  imageUrl: string;
  designerId: string;
  designerName: string;
  createdAt: number; // stable pseudo
  popularity: number; // stable pseudo
  desc: string;
};

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mapBudget(b: string): Idea["budget4"] {
  // data.ts: Uygun/Orta/Premium gibi gelebilir
  const x = (b || "").toLowerCase();
  if (x.includes("uygun") || x.includes("eko")) return "Ekonomik";
  if (x.includes("lüks")) return "Lüks";
  if (x.includes("prem")) return "Premium";
  return "Orta";
}

function buildIdeas(): Idea[] {
  return designers.flatMap((d) =>
    d.projects.map((p) => {
      const id = `${d.id}-${p.pid}`;
      const h = hashStr(id);
      const createdAt = 1700000000000 + (h % 120) * 86400000; // stable dağılım
      const popularity = (h % 1000) + 200; // stable
      const room = p.room;
      const style = d.style;
      const budget4 = mapBudget(d.budget);
      const desc = `${room} • ${style} • ${budget4}`;

      return {
        id,
        title: p.title,
        room,
        style,
        budget4,
        city: d.city,
        imageUrl: p.imageUrl,
        designerId: d.id,
        designerName: d.name,
        createdAt,
        popularity,
        desc,
      };
    })
  );
}

/** -------------------- UI bits -------------------- */
function PillButton({
  children,
  onClick,
  className,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold",
        "border border-black/10 bg-white/70 backdrop-blur",
        "shadow-[0_14px_45px_-38px_rgba(0,0,0,0.40)]",
        "hover:bg-white/90 transition",
        active && "bg-white/95 ring-1 ring-black/5",
        className
      )}
    >
      {children}
    </button>
  );
}

function SmallIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-2xl border border-white/55 bg-white/18 backdrop-blur-xl shadow-[0_14px_45px_-38px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.9)]">
      {children}
    </span>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "group inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 px-3 py-2",
        "backdrop-blur shadow-[0_14px_45px_-38px_rgba(0,0,0,0.40)] hover:bg-white/90 transition"
      )}
    >
      <span
        className={cn(
          "relative h-6 w-10 rounded-full border border-black/10 bg-white",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-slate-900/90 transition",
            checked ? "left-5" : "left-0.5"
          )}
        />
      </span>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="text-xs text-slate-500 hidden sm:inline">
        (zevk sinyali)
      </span>
    </button>
  );
}

function BudgetIcon({ b }: { b: Idea["budget4"] }) {
  // 4 seçenek - anlaşılır ikon dilinde
  if (b === "Ekonomik")
    return (
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M16 7H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H8" />
      </svg>
    );
  if (b === "Orta")
    return (
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 15.9 6.4 19.5l2.1-6.7L3 8.8h6.8z" />
      </svg>
    );
  if (b === "Premium")
    return (
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7l4 10h8l4-10" />
        <path d="M5 7l7 5 7-5" />
        <path d="M9 21h6" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 19h12" />
      <path d="M8 17l4-12 4 12" />
      <path d="M9.5 11h5" />
    </svg>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-80">
      <button
        aria-label="Kapat"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white/85 backdrop-blur-xl shadow-[0_40px_120px_-70px_rgba(0,0,0,0.60)]">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-black/5">
            <div className="text-base font-extrabold tracking-tight text-slate-900">
              {title}
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/95 transition"
            >
              Kapat
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer ? (
            <div className="px-5 py-4 border-t border-black/5">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** -------------------- Main -------------------- */
export default function KesfetClient({
  initial,
}: {
  initial: {
    q: string;
    room: string;
    style: string;
    budget: string;
    city: string;
    sort: string;
    page: number;
    taste: boolean;
  };
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const allIdeas = React.useMemo(() => buildIdeas(), []);
  const rooms = React.useMemo(() => {
    const set = new Set(allIdeas.map((i) => i.room));
    return ["all", ...Array.from(set)];
  }, [allIdeas]);

  const styles = React.useMemo(() => {
    const set = new Set(allIdeas.map((i) => i.style));
    return ["all", ...Array.from(set)];
  }, [allIdeas]);

  const cities = React.useMemo(() => {
    const set = new Set(allIdeas.map((i) => i.city));
    return ["all", ...Array.from(set)];
  }, [allIdeas]);

  const budgets4: Array<Idea["budget4"] | "all"> = ["all", "Ekonomik", "Orta", "Premium", "Lüks"];

  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [quickView, setQuickView] = React.useState<Idea | null>(null);
  const [tasteModal, setTasteModal] = React.useState(false);

  // URL’den oku (source of truth)
  const q = sp.get("q") ?? initial.q;
  const room = sp.get("room") ?? initial.room;
  const style = sp.get("style") ?? initial.style;
  const budget = sp.get("budget") ?? initial.budget;
  const city = sp.get("city") ?? initial.city;
  const sort = sp.get("sort") ?? initial.sort;
  const page = Math.max(1, Number(sp.get("page") ?? initial.page) || 1);
  const taste = (sp.get("taste") ?? (initial.taste ? "1" : "0")) === "1";

  function setParam(next: Record<string, string | null>, opts?: { keepPage?: boolean }) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (!v || v === "all") params.delete(k);
      else params.set(k, v);
    });
    if (!opts?.keepPage) params.delete("page"); // filtre değişince başa dön
    const qs = params.toString();
    router.push(qs ? `/kesfet?${qs}` : "/kesfet");
  }

  const filtered = React.useMemo(() => {
    const qq = (q || "").trim().toLowerCase();

    let list = allIdeas.filter((i) => {
      const matchQ =
        !qq ||
        i.title.toLowerCase().includes(qq) ||
        i.room.toLowerCase().includes(qq) ||
        i.style.toLowerCase().includes(qq) ||
        i.city.toLowerCase().includes(qq) ||
        i.designerName.toLowerCase().includes(qq);

      const matchRoom = room === "all" ? true : i.room === room;
      const matchStyle = style === "all" ? true : i.style === style;
      const matchBudget = budget === "all" ? true : i.budget4 === budget;
      const matchCity = city === "all" ? true : i.city === city;

      return matchQ && matchRoom && matchStyle && matchBudget && matchCity;
    });

    // Sort
    if (taste) {
      // Zevk skoru: oyundan gelen sinyal yoksa yönlendireceğiz (UI tarafı)
      // Şimdilik deterministic “tasteScore”
      list = [...list].sort((a, b) => hashStr(b.id + "taste") - hashStr(a.id + "taste"));
    } else if (sort === "new") {
      list = [...list].sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === "popular") {
      list = [...list].sort((a, b) => b.popularity - a.popularity);
    } else {
      // featured
      list = [...list].sort((a, b) => hashStr(b.id) - hashStr(a.id));
    }

    return list;
  }, [allIdeas, q, room, style, budget, city, sort, taste]);

  // Arama profesyonel isimleriyle eşleşiyorsa küçük şerit (liste değil)
  const proMatches = React.useMemo(() => {
    const qq = (q || "").trim().toLowerCase();
    if (!qq) return [];
    return designers
      .filter((d) => d.name.toLowerCase().includes(qq) || d.city.toLowerCase().includes(qq))
      .slice(0, 3);
  }, [q]);

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  function toggleTaste() {
    const authed = isAuthedClient();
    const nextUrl = `/kesfet?${new URLSearchParams({
      ...(q ? { q } : {}),
      ...(room !== "all" ? { room } : {}),
      ...(style !== "all" ? { style } : {}),
      ...(budget !== "all" ? { budget } : {}),
      ...(city !== "all" ? { city } : {}),
      ...(sort ? { sort } : {}),
      taste: "1",
    }).toString()}`;

    if (!authed) {
      goSignup(router, nextUrl);
      return;
    }

    // oyundan sinyal yoksa: oyuna yönlendir (kibar modal)
    const hasTasteSignal =
      typeof window !== "undefined" &&
      !!window.localStorage.getItem("evl_taste_v1");

    if (!taste && !hasTasteSignal) {
      setTasteModal(true);
      return;
    }

    setParam({ taste: taste ? "0" : "1" });
  }

  function onSaveClick(idea: Idea) {
    const authed = isAuthedClient();
    const nextUrl = `/kesfet?${sp.toString()}`;
    if (!authed) {
      goSignup(router, nextUrl);
      return;
    }
    // oturum varsa kaydetme: localStorage (basit)
    const key = "evl_saved_ideas_v1";
    const raw = window.localStorage.getItem(key);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    const has = arr.includes(idea.id);
    const next = has ? arr.filter((x) => x !== idea.id) : [...arr, idea.id];
    window.localStorage.setItem(key, JSON.stringify(next));
    // minik feedback: quickview açıksa kalabilir
  }

  function isSaved(ideaId: string) {
    if (typeof window === "undefined") return false;
    const raw = window.localStorage.getItem("evl_saved_ideas_v1");
    if (!raw) return false;
    try {
      const arr: string[] = JSON.parse(raw);
      return arr.includes(ideaId);
    } catch {
      return false;
    }
  }

  /** Feed aralarına pro CTA kartı serpiştirme */
  const feedWithInsert = React.useMemo(() => {
    const out: Array<{ type: "idea"; idea: Idea } | { type: "procta"; key: string }> = [];
    pageItems.forEach((it, idx) => {
      out.push({ type: "idea", idea: it });
      // her 6 kartta bir “pro bul” kartı
      if ((idx + 1) % 6 === 0 && idx !== pageItems.length - 1) {
        out.push({ type: "procta", key: `pro-${idx}` });
      }
    });
    return out;
  }, [pageItems]);

  return (
    <div className="pt-2">
      {/* üst başlık */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-slate-500">
            KEŞFET
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Büyük görseller. Net karar.
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-[70ch]">
            Sadece tasarımlar: gez, kısa kısa oku, karar ver. Profesyonel aramayı
            yormadan aralara serpiştirdik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Switch checked={taste} onChange={toggleTaste} label="Zevkime göre sırala" />
          <PillButton
            onClick={() => setFiltersOpen(true)}
            className="px-4"
            title="Filtreleri aç"
          >
            <span className="text-slate-700">Tüm Filtreler</span>
            <span aria-hidden="true" className="text-slate-500">↗</span>
          </PillButton>
        </div>
      </div>

      {/* arama + temel filtre bar */}
      <div className="mt-5 rounded-[28px] border border-black/5 bg-white/60 backdrop-blur-xl shadow-[0_26px_80px_-65px_rgba(0,0,0,0.45)]">
        <div className="p-4 md:p-5">
          {/* search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const nq = String(fd.get("q") || "");
              setParam({ q: nq || null });
            }}
            className="flex flex-col gap-3 md:flex-row md:items-center"
          >
            <div className="relative flex-1 min-w-0">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                </svg>
              </span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Örn: mutfak, bohem, İzmir, ‘Mina’…"
                className={cn(
                  "w-full rounded-2xl border border-black/10 bg-white/80",
                  "pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400",
                  "outline-none focus:ring-2 focus:ring-black/10"
                )}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className={cn(
                "rounded-2xl border border-black/10 bg-white/70 text-slate-900 font-semibold",
                "backdrop-blur hover:bg-white/95 transition",
                "shadow-[0_16px_55px_-45px_rgba(0,0,0,0.35)]",
                "px-5 py-3 text-sm"
              )}
            >
              Ara
            </button>
          </form>

          {/* basic filters (kart tabanlı, sade) */}
          <div className="mt-4 flex flex-wrap gap-2">
            <PillButton onClick={() => setParam({ room: "all" })} active={room === "all"}>
              Oda: <span className="text-slate-600">{room === "all" ? "Tümü" : room}</span>
            </PillButton>

            <div className="flex flex-wrap gap-2">
              {rooms.slice(1, 5).map((r) => (
                <PillButton key={r} onClick={() => setParam({ room: r })} active={room === r}>
                  {r}
                </PillButton>
              ))}
            </div>

            <PillButton onClick={() => setParam({ sort: sort === "popular" ? "new" : "popular" })} title="Sıralama">
              Sırala:{" "}
              <span className="text-slate-600">
                {sort === "popular" ? "Popüler" : sort === "new" ? "Yeni" : "Seçki"}
              </span>
            </PillButton>
          </div>

          {/* arama profesyonel eşleşme şeridi (liste değil) */}
          {proMatches.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-black/5 bg-white/55 p-3">
              <div className="text-xs font-semibold tracking-widest text-slate-500">
                PROFESYONEL EŞLEŞMESİ
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-700">
                  Araman şu profesyonellerle de eşleşiyor:
                </span>
                {proMatches.map((d) => (
                  <Link
                    key={d.id}
                    href={`/tasarimcilar/${d.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-white transition"
                  >
                    {d.name}
                    <span className="text-xs text-slate-500">({d.city})</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* sonuç özeti */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{filtered.length}</span>{" "}
          tasarım bulundu
          {q ? (
            <>
              {" "}
              • <span className="text-slate-900 font-semibold">“{q}”</span>
            </>
          ) : null}
        </div>

        {/* mini pagination header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setParam({ page: String(Math.max(1, safePage - 1)) }, { keepPage: true })}
            disabled={safePage <= 1}
            className={cn(
              "rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold",
              "hover:bg-white/95 transition disabled:opacity-40 disabled:hover:bg-white/70"
            )}
          >
            ← Önceki
          </button>

          <div className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700">
            Sayfa <span className="text-slate-900">{safePage}</span> /{" "}
            <span className="text-slate-900">{totalPages}</span>
          </div>

          <button
            onClick={() => setParam({ page: String(Math.min(totalPages, safePage + 1)) }, { keepPage: true })}
            disabled={safePage >= totalPages}
            className={cn(
              "rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold",
              "hover:bg-white/95 transition disabled:opacity-40 disabled:hover:bg-white/70"
            )}
          >
            Sonraki →
          </button>
        </div>
      </div>

      {/* FEED: sadece tasarımlar (büyük görsel + temiz alt bilgi) */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {feedWithInsert.map((x) => {
          if (x.type === "procta") {
            return (
              <Link
                key={x.key}
                href="/pro-bul"
                className={cn(
                  "group relative overflow-hidden rounded-[28px] border border-black/5",
                  "bg-white/55 backdrop-blur shadow-[0_26px_80px_-65px_rgba(0,0,0,0.45)]",
                  "hover:bg-white/75 hover:-translate-y-0.5 transition"
                )}
              >
                <div
                  className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-60"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.22), rgba(99,102,241,0) 60%)",
                  }}
                  aria-hidden="true"
                />
                <div className="p-6">
                  <div className="text-xs font-semibold tracking-widest text-slate-500">
                    EVLUMBA HIZLANDIRICI
                  </div>
                  <div className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">
                    Aradığın profesyoneli şimdi bulalım
                  </div>
                  <div className="mt-2 text-sm text-slate-600 leading-7">
                    Zevkine uygun tasarımcıları tek ekranda çıkaralım. Kısa bir
                    yönlendirmeyle doğru eşleşmeye gidelim.
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-900">
                    Profesyonel bul <span aria-hidden="true">→</span>
                  </div>
                </div>
              </Link>
            );
          }

          const idea = x.idea;
          const saved = isSaved(idea.id);

          return (
            <div
              key={idea.id}
              className={cn(
                "group overflow-hidden rounded-[28px] border border-black/5",
                "bg-white/65 backdrop-blur shadow-[0_26px_80px_-65px_rgba(0,0,0,0.45)]",
                "hover:bg-white/75 hover:-translate-y-0.5 transition"
              )}
            >
              {/* image */}
              <button
                type="button"
                onClick={() => setQuickView(idea)}
                className="relative block w-full text-left"
              >
                <div className="aspect-16/11 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={idea.imageUrl}
                    alt={idea.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>

                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0))",
                  }}
                  aria-hidden="true"
                />

                {/* top actions */}
                <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/25 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
                    {idea.room}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveClick(idea);
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/25 px-3 py-1.5",
                      "text-[11px] font-semibold text-white backdrop-blur hover:bg-white/35 transition"
                    )}
                    title={saved ? "Kaydedildi" : "Kaydet"}
                  >
                    <span className={cn("h-2 w-2 rounded-full", saved ? "bg-rose-300" : "bg-white/70")} aria-hidden="true" />
                    {saved ? "Kaydedildi" : "Kaydet"}
                  </button>
                </div>

                {/* title overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-white text-base font-extrabold tracking-tight line-clamp-2">
                    {idea.title}
                  </div>
                </div>
              </button>

              {/* clean info area */}
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {idea.designerName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {idea.desc} • {idea.city}
                    </div>
                  </div>

                  <div className="shrink-0 inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700">
                    <BudgetIcon b={idea.budget4} />
                    {idea.budget4}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickView(idea)}
                    className="flex-1 rounded-2xl border border-black/10 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white transition"
                  >
                    İncele
                  </button>

                  <Link
                    href={`/tasarimcilar/${idea.designerId}`}
                    className="rounded-2xl border border-black/10 bg-white/65 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white transition"
                  >
                    Tasarımcı
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* bottom pagination (tatlı, yormayan) */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setParam({ page: String(Math.max(1, safePage - 1)) }, { keepPage: true })}
            disabled={safePage <= 1}
            className={cn(
              "rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold",
              "hover:bg-white/95 transition disabled:opacity-40 disabled:hover:bg-white/70"
            )}
          >
            ← Önceki
          </button>

          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700">
            {safePage} / {totalPages}
          </div>

          <button
            onClick={() => setParam({ page: String(Math.min(totalPages, safePage + 1)) }, { keepPage: true })}
            disabled={safePage >= totalPages}
            className={cn(
              "rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold",
              "hover:bg-white/95 transition disabled:opacity-40 disabled:hover:bg-white/70"
            )}
          >
            Sonraki →
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Büyük görsel + kısa bilgi → hızlı karar. (Evlumba stili)
        </div>
      </div>

      {/* Quick view modal */}
      <Modal
        open={!!quickView}
        onClose={() => setQuickView(null)}
        title={quickView?.title ?? "İncele"}
        footer={
          quickView ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{quickView.designerName}</span>{" "}
                • {quickView.desc} • {quickView.city}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSaveClick(quickView)}
                  className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white transition"
                >
                  Kaydet
                </button>
                <Link
                  href={`/tasarimcilar/${quickView.designerId}`}
                  className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white transition"
                >
                  Tasarımcıya git →
                </Link>
              </div>
            </div>
          ) : null
        }
      >
        {quickView ? (
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-8 overflow-hidden rounded-3xl border border-black/10 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={quickView.imageUrl}
                alt={quickView.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="md:col-span-4">
              <div className="rounded-3xl border border-black/10 bg-white/70 p-4">
                <div className="text-xs font-semibold tracking-widest text-slate-500">
                  HIZLI ÖZET
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <SmallIcon>
                    <BudgetIcon b={quickView.budget4} />
                  </SmallIcon>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {quickView.budget4}
                    </div>
                    <div className="text-xs text-slate-500">Bütçe bandı</div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-800">
                  {quickView.room} • {quickView.style}
                </div>

                <div className="mt-3 text-sm text-slate-600 leading-7">
                  Bu tasarımın hissi: <span className="font-semibold text-slate-900">net, uygulanabilir</span>.  
                  Kaydetmek istersen tek tık.
                </div>

                <Link
                  href="/pro-bul"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-white transition"
                >
                  Benim için profesyonel bul <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Taste modal */}
      <Modal
        open={tasteModal}
        onClose={() => setTasteModal(false)}
        title="Zevkine göre sıralama için küçük bir adım"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              30 saniyelik oyun → zevk sinyali → daha iyi keşif.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTasteModal(false)}
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white transition"
              >
                Şimdilik değil
              </button>
              <Link
                href="/oyun"
                className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white transition"
              >
                Oyuna git →
              </Link>
            </div>
          </div>
        }
      >
        <div className="text-sm text-slate-700 leading-7">
          “Zevkime göre sırala” butonu için henüz yeterli zevk sinyali yok.
          Mini keşfetme oyunu bunu oluşturur. Oyun bittiğinde otomatik daha iyi
          sıralama görürsün.
        </div>
      </Modal>

      {/* All filters modal */}
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Tüm Filtreler"
        footer={
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setFiltersOpen(false);
                router.push("/kesfet");
              }}
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white transition"
            >
              Sıfırla
            </button>

            <button
              onClick={() => setFiltersOpen(false)}
              className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white transition"
            >
              Uygula
            </button>
          </div>
        }
      >
        <div className="grid gap-6 md:grid-cols-12">
          {/* ODA */}
          <div className="md:col-span-4">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              ODA
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {rooms.map((r) => (
                <button
                  key={r}
                  onClick={() => setParam({ room: r }, { keepPage: false })}
                  className={cn(
                    "rounded-full border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold",
                    "hover:bg-white transition",
                    (r === "all" ? room === "all" : room === r) && "bg-white/95"
                  )}
                >
                  {r === "all" ? "Tümü" : r}
                </button>
              ))}
            </div>
          </div>

          {/* STİL */}
          <div className="md:col-span-4">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              STİL
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {styles.map((s) => (
                <button
                  key={s}
                  onClick={() => setParam({ style: s }, { keepPage: false })}
                  className={cn(
                    "rounded-full border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold",
                    "hover:bg-white transition",
                    (s === "all" ? style === "all" : style === s) && "bg-white/95"
                  )}
                >
                  {s === "all" ? "Tümü" : s}
                </button>
              ))}
            </div>
          </div>

          {/* BÜTÇE (4 seçenek + ikon) */}
          <div className="md:col-span-4">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              BÜTÇE
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {budgets4.map((b) => (
                <button
                  key={b}
                  onClick={() => setParam({ budget: b }, { keepPage: false })}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-3 text-sm font-semibold",
                    "hover:bg-white transition",
                    (b === "all" ? budget === "all" : budget === b) && "bg-white/95"
                  )}
                >
                  <SmallIcon>
                    {b === "all" ? (
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7h16" />
                        <path d="M6 12h12" />
                        <path d="M10 17h4" />
                      </svg>
                    ) : (
                      <BudgetIcon b={b as Idea["budget4"]} />
                    )}
                  </SmallIcon>
                  <span>{b === "all" ? "Hepsi" : b}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ŞEHİR (advanced) */}
          <div className="md:col-span-12">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              ŞEHİR (detay filtre)
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setParam({ city: c }, { keepPage: false })}
                  className={cn(
                    "rounded-full border border-black/10 bg-white/70 px-3 py-2 text-sm font-semibold",
                    "hover:bg-white transition",
                    (c === "all" ? city === "all" : city === c) && "bg-white/95"
                  )}
                >
                  {c === "all" ? "Tümü" : c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
