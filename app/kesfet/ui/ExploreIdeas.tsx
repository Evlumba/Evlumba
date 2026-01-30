"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ideas as ALL_IDEAS, roomGroups, budgetOptions, type Idea } from "../../../lib/data";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function getUser() {
  return readJSON<{ id: string; name: string } | null>("evlumba_user", null);
}

function clamp2Style(): React.CSSProperties {
  return {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l1.2 5.1L18 9l-4.8 1.9L12 16l-1.2-5.1L6 9l4.8-1.9L12 2z" />
      <path d="M19 14l.6 2.1L22 17l-2.4.9L19 20l-.6-2.1L16 17l2.4-.9L19 14z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4-8 4V5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function Avatar({ name }: { name: string }) {
  const letter = (name?.trim()?.[0] ?? "E").toUpperCase();
  return (
    <div
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border border-black/10",
        "bg-white/70 backdrop-blur shadow-[0_12px_35px_-28px_rgba(0,0,0,0.25)]"
      )}
      style={{
        background:
          "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.14), rgba(16,185,129,0.16))",
      }}
    >
      <span className="text-xs font-extrabold text-slate-900/85">{letter}</span>
    </div>
  );
}

function Chip({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="grid h-6 w-6 place-items-center rounded-full hover:bg-black/5 transition"
          aria-label="Kaldır"
        >
          <XIcon />
        </button>
      )}
    </span>
  );
}

function FindProCard() {
  return (
    <Link
      href="/pro-bul"
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-black/5",
        "bg-white/55 backdrop-blur shadow-[0_26px_80px_-70px_rgba(0,0,0,0.45)]",
        "hover:bg-white/70 transition"
      )}
    >
      <div
        className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.22), rgba(139,92,246,0) 60%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.18), rgba(16,185,129,0) 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative p-6">
        <div className="text-xs font-semibold tracking-widest text-slate-500">
          HIZLI EŞLEŞME
        </div>
        <div className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
          Aradığın profesyoneli 60 sn’de bulalım.
        </div>
        <div className="mt-2 text-sm leading-6 text-slate-600">
          Tarzını ve alanını seç → sana uygun profilleri önerelim.
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-900 backdrop-blur">
          Profesyonel bul <span className="text-slate-700">→</span>
        </div>
      </div>
    </Link>
  );
}

function ModalShell({
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
        className="absolute inset-0 bg-black/25"
        onClick={onClose}
        aria-label="Kapat"
      />
      <div className="absolute left-1/2 top-1/2 w-[min(980px,92vw)] -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white/75 backdrop-blur-xl shadow-[0_40px_120px_-90px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
            <div className="text-sm font-extrabold tracking-tight text-slate-900">{title}</div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-2xl border border-black/10 bg-white/70 hover:bg-white/90 transition"
              aria-label="Kapat"
            >
              <XIcon />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-auto p-5">{children}</div>

          {footer && (
            <div className="border-t border-black/5 px-5 py-4 bg-white/60">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExploreIdeas() {
  const router = useRouter();
  const sp = useSearchParams();

  // URL’den ilk değerler (header search -> /kesfet?q=...)
  const initialQ = sp.get("q") ?? "";

  const [q, setQ] = React.useState(initialQ);
  const [room, setRoom] = React.useState<string>("");       // "Mutfak" vs
  const [subRoom, setSubRoom] = React.useState<string>(""); // "Powder Room"
  const [styles, setStyles] = React.useState<string[]>([]);
  const [budget, setBudget] = React.useState<string>("");   // Ekonomik/Orta/Üst/Premium
  const [city, setCity] = React.useState<string>("");
  const [colors, setColors] = React.useState<string[]>([]);

  const [allFiltersOpen, setAllFiltersOpen] = React.useState(false);

  // auth / taste gate modalları
  const [gate, setGate] = React.useState<null | "auth" | "taste">(null);

  // sticky taste toggle
  const [tasteOn, setTasteOn] = React.useState(false);

  // saved
  const [savedIds, setSavedIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<string>("");

  // pagination
  const [visible, setVisible] = React.useState(12);

  // hydrate: saved + url sync
  React.useEffect(() => {
    setSavedIds(readJSON<string[]>("evlumba_saved_ideas", []));
  }, []);

  // q state URL sync (temiz, paylaşılabilir)
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (room) params.set("room", room);
    if (subRoom) params.set("sub", subRoom);
    if (styles.length) params.set("style", styles.join(","));
    if (budget) params.set("budget", budget);
    if (city) params.set("city", city);
    if (colors.length) params.set("color", colors.join(","));
    router.replace(`/kesfet${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
    setVisible(12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, room, subRoom, styles, budget, city, colors]);

  // URL’den (opsiyonel) room/sub/style... okuyalım (refresh’te bozulmasın)
  React.useEffect(() => {
    const r = sp.get("room") ?? "";
    const s = sp.get("sub") ?? "";
    const st = sp.get("style") ? (sp.get("style")!.split(",").filter(Boolean)) : [];
    const b = sp.get("budget") ?? "";
    const c = sp.get("city") ?? "";
    const co = sp.get("color") ? (sp.get("color")!.split(",").filter(Boolean)) : [];

    if (r) setRoom(r);
    if (s) setSubRoom(s);
    if (st.length) setStyles(st);
    if (b) setBudget(b);
    if (c) setCity(c);
    if (co.length) setColors(co);
    // sadece ilk mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const activeRoom = React.useMemo(() => roomGroups.find((g) => g.id === room), [room]);

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();

    let list = ALL_IDEAS.slice();

    // popüler default
    list.sort((a, b) => b.popularity - a.popularity);

    // taste sort açık ise
    if (tasteOn) {
      const user = getUser();
      const taste = readJSON<{ styles: string[]; rooms: string[]; colors: string[] } | null>(
        "evlumba_taste",
        null
      );

      // güvenlik: taste yoksa normal sıraya dön
      if (user && taste) {
        const score = (x: Idea) => {
          const s1 = (taste.styles ?? []).includes(x.designerStyle) ? 3 : 0;
          const s2 = (taste.rooms ?? []).includes(x.room) ? 2 : 0;
          const s3 = (taste.colors ?? []).some((cc) => x.colors.includes(cc)) ? 1 : 0;
          return s1 + s2 + s3 + x.popularity / 1000000;
        };
        list.sort((a, b) => score(b) - score(a));
      }
    }

    if (room) list = list.filter((x) => x.room === room);
    if (subRoom) list = list.filter((x) => (x.subRoom ?? "") === subRoom);

    if (styles.length) {
      list = list.filter((x) => styles.includes(x.designerStyle));
    }

    if (budget) {
      list = list.filter((x) => x.designerBudget === budget);
    }

    if (city) {
      list = list.filter((x) => x.designerCity === city);
    }

    if (colors.length) {
      list = list.filter((x) => colors.every((cc) => x.colors.includes(cc)));
    }

    if (query) {
      list = list.filter((x) => {
        const blob = [
          x.title,
          x.room,
          x.subRoom ?? "",
          x.designerName,
          x.designerCity,
          x.designerStyle,
          x.desc,
          x.colors.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return blob.includes(query);
      });
    }

    return list;
  }, [q, room, subRoom, styles, budget, city, colors, tasteOn]);

  const visibleItems = React.useMemo(() => filtered.slice(0, visible), [filtered, visible]);
  const hasMore = visible < filtered.length;

  function toggleSaved(id: string) {
    const user = getUser();
    if (!user) {
      setGate("auth");
      return;
    }
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeJSON("evlumba_saved_ideas", next);
      setToast(prev.includes(id) ? "Kaydedilenlerden çıkarıldı" : "Kaydedildi");
      return next;
    });
  }

  function onTasteClick() {
    const user = getUser();
    if (!user) {
      setGate("auth");
      return;
    }
    const taste = readJSON<any>("evlumba_taste", null);
    if (!taste) {
      setGate("taste");
      return;
    }
    setTasteOn((v) => !v);
  }

  function clearAll() {
    setQ("");
    setRoom("");
    setSubRoom("");
    setStyles([]);
    setBudget("");
    setCity("");
    setColors([]);
  }

  // --- All Filters UI content ---
  const [tab, setTab] = React.useState<
    "Yaşam Alanı" | "Alt Kategori" | "Stil" | "Bütçe" | "Şehir" | "Renk"
  >("Yaşam Alanı");

  const cities = React.useMemo(() => {
    const set = new Set<string>();
    ALL_IDEAS.forEach((x) => set.add(x.designerCity));
    return Array.from(set);
  }, []);

  const stylesAll = React.useMemo(() => {
    const set = new Set<string>();
    ALL_IDEAS.forEach((x) => set.add(x.designerStyle));
    return Array.from(set);
  }, []);

  const selectedCount =
    (room ? 1 : 0) +
    (subRoom ? 1 : 0) +
    styles.length +
    (budget ? 1 : 0) +
    (city ? 1 : 0) +
    colors.length +
    (q.trim() ? 1 : 0);

  return (
    <div>
      {/* Header */}
      <div className="mt-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              EVLUMBA
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
              Tasarımları Keşfet
            </h1>
            <div className="mt-2 text-sm text-slate-600">
              {filtered.length.toLocaleString("tr-TR")} sonuç
              {room ? ` • ${room}` : ""}
              {subRoom ? ` • ${subRoom}` : ""}
            </div>
          </div>

          {/* küçük, zarif “clear all” */}
          {selectedCount > 0 && (
            <button
              onClick={clearAll}
              className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/65 px-4 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur hover:bg-white/90 transition"
            >
              Temizle <span className="opacity-70">↺</span>
            </button>
          )}
        </div>
      </div>

      {/* Room scroller */}
      <div className="mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none]">
          <style jsx>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>

          <button
            onClick={() => {
              setRoom("");
              setSubRoom("");
            }}
            className={cn(
              "shrink-0 rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold backdrop-blur transition",
              !room ? "bg-white/85 text-slate-900" : "bg-white/55 text-slate-700 hover:bg-white/80"
            )}
          >
            Hepsi
          </button>

          {roomGroups.map((g) => {
            const active = room === g.id;
            return (
              <button
                key={g.id}
                onClick={() => {
                  setRoom(g.id);
                  setSubRoom("");
                }}
                className={cn(
                  "group shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-white/55 backdrop-blur transition hover:bg-white/80",
                  active && "bg-white/90"
                )}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="h-9 w-12 overflow-hidden rounded-xl border border-black/5 bg-white/60">
                    <img
                      src={g.coverUrl}
                      alt={g.label}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{g.label}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Subcategories */}
        {activeRoom && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
            <style jsx>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>

            {activeRoom.subs.map((s) => {
              const active = subRoom === s;
              return (
                <button
                  key={s}
                  onClick={() => setSubRoom(active ? "" : s)}
                  className={cn(
                    "shrink-0 rounded-full border border-black/10 px-4 py-2 text-xs font-semibold backdrop-blur transition",
                    active ? "bg-white/90 text-slate-900" : "bg-white/55 text-slate-700 hover:bg-white/80"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter bar (houzz mantığı ama temiz) */}
      <div className="mt-6 sticky top-2 lg:top-26 z-40">
        <div className="rounded-3xl border border-black/5 bg-white/60 backdrop-blur-xl shadow-[0_24px_80px_-70px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-3 p-3.5 md:flex-row md:items-center">
            {/* compact search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ara: tarz, oda, tasarımcı…"
                  className={cn(
                    "w-full rounded-2xl border border-black/10 bg-white/70",
                    "px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400",
                    "outline-none focus:ring-2 focus:ring-black/10"
                  )}
                />
                {q.trim() && (
                  <button
                    onClick={() => setQ("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-2xl hover:bg-black/5 transition"
                    aria-label="Aramayı temizle"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
            </div>

            {/* quick filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setTab("Yaşam Alanı");
                  setAllFiltersOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-900 backdrop-blur hover:bg-white/90 transition"
              >
                Tüm Filtreler <span className="text-slate-500">↘</span>
              </button>

              <button
                onClick={() => {
                  setTab("Stil");
                  setAllFiltersOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/65 px-4 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur hover:bg-white/90 transition"
              >
                Stil {styles.length ? <span className="text-slate-500">({styles.length})</span> : null}
              </button>

              <button
                onClick={() => {
                  setTab("Bütçe");
                  setAllFiltersOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/65 px-4 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur hover:bg-white/90 transition"
              >
                Bütçe {budget ? <span className="text-slate-500">({budget})</span> : null}
              </button>

              <button
                onClick={() => {
                  setTab("Renk");
                  setAllFiltersOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/65 px-4 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur hover:bg-white/90 transition"
              >
                Renk {colors.length ? <span className="text-slate-500">({colors.length})</span> : null}
              </button>
            </div>
          </div>

          {/* selected chips row */}
          {selectedCount > 0 && (
            <div className="border-t border-black/5 px-3.5 py-3">
              <div className="flex flex-wrap gap-2">
                {q.trim() && <Chip onRemove={() => setQ("")}>Arama: {q.trim()}</Chip>}
                {room && (
                  <Chip
                    onRemove={() => {
                      setRoom("");
                      setSubRoom("");
                    }}
                  >
                    Alan: {room}
                  </Chip>
                )}
                {subRoom && <Chip onRemove={() => setSubRoom("")}>Alt: {subRoom}</Chip>}
                {styles.map((s) => (
                  <Chip key={s} onRemove={() => setStyles((p) => p.filter((x) => x !== s))}>
                    Stil: {s}
                  </Chip>
                ))}
                {budget && <Chip onRemove={() => setBudget("")}>Bütçe: {budget}</Chip>}
                {city && <Chip onRemove={() => setCity("")}>Şehir: {city}</Chip>}
                {colors.map((c) => (
                  <Chip key={c} onRemove={() => setColors((p) => p.filter((x) => x !== c))}>
                    Renk: {c}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((idea, i) => {
          const saved = savedIds.includes(idea.id);

          // aralara profesyonel CTA serpiştir
          const shouldInsert = i > 0 && i % 9 === 0;

          return (
            <React.Fragment key={idea.id}>
              {shouldInsert && <FindProCard />}

              <article
                className={cn(
                  "group relative overflow-hidden rounded-3xl border border-black/5",
                  "bg-white/60 backdrop-blur shadow-[0_26px_80px_-70px_rgba(0,0,0,0.45)]",
                  "hover:bg-white/75 transition"
                )}
              >
                <Link href={`/tasarim/${idea.id}`} className="block">
                  <div className="relative">
                    <div className="aspect-4/3 overflow-hidden bg-slate-100">
                      <img
                        src={idea.imageUrl}
                        alt={idea.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>

                    {/* save */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSaved(idea.id);
                      }}
                      className={cn(
                        "absolute right-3 top-3 inline-flex items-center gap-2 rounded-2xl",
                        "border border-black/10 bg-white/75 px-3 py-2 text-xs font-semibold text-slate-800 backdrop-blur",
                        "hover:bg-white/95 transition shadow-[0_16px_45px_-35px_rgba(0,0,0,0.35)]"
                      )}
                      aria-label={saved ? "Kaydedildi" : "Kaydet"}
                    >
                      <span className={cn(saved ? "text-slate-900" : "text-slate-700")}>
                        <BookmarkIcon filled={saved} />
                      </span>
                      <span>{saved ? "Kaydedildi" : "Kaydet"}</span>
                    </button>
                  </div>
                </Link>

                <div className="p-4.5">
                  <div className="text-sm font-semibold tracking-tight text-slate-900">
                    {idea.title}
                  </div>

                  <div className="mt-2 text-[13px] leading-6 text-slate-600" style={clamp2Style()}>
                    {idea.desc}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Avatar name={idea.designerName} />
                    <div className="min-w-0">
                      <Link
                        href={`/tasarimcilar/${idea.designerSlug}`}
                        className="block truncate text-sm font-semibold text-slate-900 hover:underline"
                      >
                        {idea.designerName}
                      </Link>
                      <div className="truncate text-xs text-slate-500">
                        {idea.designerCity} • {idea.designerStyle}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </React.Fragment>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-10 rounded-3xl border border-black/5 bg-white/60 p-8 text-center backdrop-blur">
          <div className="text-lg font-semibold text-slate-900">Sonuç bulunamadı.</div>
          <div className="mt-2 text-sm text-slate-600">
            Filtreleri azaltmayı veya aramayı temizlemeyi dene.
          </div>
          <button
            onClick={clearAll}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-white/95 transition"
          >
            Tümünü temizle <span>↺</span>
          </button>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="mt-10 flex items-center justify-center">
          {hasMore ? (
            <button
              onClick={() => setVisible((v) => v + 12)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-900 backdrop-blur hover:bg-white/95 transition shadow-[0_18px_60px_-52px_rgba(0,0,0,0.45)]"
            >
              Daha fazla göster <span className="text-slate-600">({visible}/{filtered.length})</span>
            </button>
          ) : (
            <div className="text-sm text-slate-500">Hepsi burada ✨</div>
          )}
        </div>
      )}

      {/* Sticky taste toggle (küçük & premium) */}
      <button
        onClick={onTasteClick}
        className={cn(
          "fixed bottom-5 right-5 z-70 inline-flex items-center gap-2 rounded-2xl",
          "border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold backdrop-blur",
          "shadow-[0_26px_80px_-70px_rgba(0,0,0,0.55)] hover:bg-white/95 transition",
          tasteOn ? "text-slate-900" : "text-slate-800"
        )}
        title="Zevkime göre sırala"
      >
        <span className={cn(tasteOn ? "text-violet-700" : "text-slate-800")}>
          <SparkleIcon />
        </span>
        <span>Zevkime göre</span>
        <span className={cn("text-xs", tasteOn ? "text-emerald-600" : "text-slate-500")}>
          {tasteOn ? "Açık" : "Kapalı"}
        </span>
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-90 -translate-x-1/2 rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 backdrop-blur shadow-[0_18px_60px_-52px_rgba(0,0,0,0.45)]">
          {toast}
        </div>
      )}

      {/* All Filters Modal */}
      <ModalShell
        open={allFiltersOpen}
        onClose={() => setAllFiltersOpen(false)}
        title="Tüm Filtreler"
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              Seçili: <span className="font-semibold text-slate-900">{selectedCount}</span> • Sonuç:
              <span className="font-semibold text-slate-900"> {filtered.length.toLocaleString("tr-TR")}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white/95 transition"
              >
                Temizle ↺
              </button>
              <button
                onClick={() => setAllFiltersOpen(false)}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white/95 transition"
              >
                Bitti →
              </button>
            </div>
          </div>
        }
      >
        <div className="grid gap-5 md:grid-cols-12">
          {/* left nav */}
          <div className="md:col-span-4">
            <div className="space-y-2">
              {(["Yaşam Alanı", "Alt Kategori", "Stil", "Bütçe", "Renk", "Şehir"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "w-full text-left rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold backdrop-blur transition",
                    tab === t ? "bg-white/90 text-slate-900" : "bg-white/55 text-slate-700 hover:bg-white/80"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* right content */}
          <div className="md:col-span-8">
            {/* Yaşam Alanı */}
            {tab === "Yaşam Alanı" && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setRoom("");
                    setSubRoom("");
                  }}
                  className={cn(
                    "w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold transition",
                    !room ? "bg-white/90" : "bg-white/55 hover:bg-white/80"
                  )}
                >
                  Hepsi
                </button>

                <div className="grid gap-2 sm:grid-cols-2">
                  {roomGroups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setRoom(g.id);
                        setSubRoom("");
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border border-black/10 bg-white/55 px-3 py-3 text-left transition hover:bg-white/80",
                        room === g.id && "bg-white/90"
                      )}
                    >
                      <div className="h-10 w-14 overflow-hidden rounded-xl border border-black/5 bg-white/60">
                        <img src={g.coverUrl} alt={g.label} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{g.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Alt kategori */}
            {tab === "Alt Kategori" && (
              <div>
                {!activeRoom ? (
                  <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-sm text-slate-700">
                    Önce bir <span className="font-semibold text-slate-900">Yaşam Alanı</span> seç.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeRoom.subs.map((s) => {
                      const active = subRoom === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setSubRoom(active ? "" : s)}
                          className={cn(
                            "rounded-2xl border border-black/10 px-4 py-3 text-left text-sm font-semibold transition",
                            active ? "bg-white/90 text-slate-900" : "bg-white/55 text-slate-700 hover:bg-white/80"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Stil */}
            {tab === "Stil" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {stylesAll.map((s) => {
                  const active = styles.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() =>
                        setStyles((prev) => (active ? prev.filter((x) => x !== s) : [...prev, s]))
                      }
                      className={cn(
                        "rounded-2xl border border-black/10 px-4 py-3 text-left text-sm font-semibold transition",
                        active ? "bg-white/90 text-slate-900" : "bg-white/55 text-slate-700 hover:bg-white/80"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Bütçe (4 seçenek, ikonlu) */}
            {tab === "Bütçe" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {budgetOptions.map((b) => {
                  const active = budget === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBudget(active ? "" : b.id)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-left text-sm font-semibold transition",
                        active ? "bg-white/90 text-slate-900" : "bg-white/55 text-slate-700 hover:bg-white/80"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-black/10 bg-white/70">
                          {b.icon}
                        </span>
                        {b.label}
                      </span>
                      {active ? <span className="text-emerald-600">✓</span> : null}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Renk */}
            {tab === "Renk" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {(["Beyaz", "Bej", "Ahşap", "Siyah", "Yeşil", "Mavi"] as const).map((c) => {
                  const active = colors.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setColors((prev) => (active ? prev.filter((x) => x !== c) : [...prev, c]))}
                      className={cn(
                        "rounded-2xl border border-black/10 px-4 py-3 text-left text-sm font-semibold transition",
                        active ? "bg-white/90 text-slate-900" : "bg-white/55 text-slate-700 hover:bg-white/80"
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Şehir */}
            {tab === "Şehir" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {cities.map((c) => {
                  const active = city === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCity(active ? "" : c)}
                      className={cn(
                        "rounded-2xl border border-black/10 px-4 py-3 text-left text-sm font-semibold transition",
                        active ? "bg-white/90 text-slate-900" : "bg-white/55 text-slate-700 hover:bg-white/80"
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ModalShell>

      {/* Gate Modals */}
      <ModalShell
        open={gate === "auth"}
        onClose={() => setGate(null)}
        title="Devam etmek için"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/giris?returnTo=${encodeURIComponent("/kesfet" + (sp.toString() ? `?${sp.toString()}` : ""))}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white/95 transition"
            >
              Giriş
            </Link>
            <Link
              href={`/kayit?returnTo=${encodeURIComponent("/kesfet" + (sp.toString() ? `?${sp.toString()}` : ""))}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white/95 transition"
            >
              Ücretsiz kayıt →
            </Link>
          </div>
        }
      >
        <div className="text-sm text-slate-700 leading-6">
          Kaydetmek ve “Zevkime göre” sıralamak için ücretsiz hesap gerekiyor.
          <span className="block mt-2 text-slate-500">1 dakikadan kısa sürer.</span>
        </div>
      </ModalShell>

      <ModalShell
        open={gate === "taste"}
        onClose={() => setGate(null)}
        title="Zevkini tanıyalım"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setGate(null)}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white/95 transition"
            >
              Sonra
            </button>
            <Link
              href={`/oyun?returnTo=${encodeURIComponent("/kesfet" + (sp.toString() ? `?${sp.toString()}` : ""))}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white/95 transition"
            >
              Oyuna git →
            </Link>
          </div>
        }
      >
        <div className="text-sm text-slate-700 leading-6">
          “Zevkime göre sırala” için önce kısa bir zevk kalibrasyonu gerekiyor.
          <span className="block mt-2 text-slate-500">30–60 sn.</span>
        </div>
      </ModalShell>
    </div>
  );
}
