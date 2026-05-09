"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties, type ReactNode, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Star,
  MapPin,
  Timer,
  Briefcase,
  Bookmark,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { isProfessionalQuery, normalizeSearchText, queryTokens } from "@/lib/searchIntent";
import { semanticSearch } from "@/lib/semanticSearch";

type Designer = {
  slug: string;
  liveDesignerId?: string;
  name: string;
  title: string;
  city: string;
  rating: number;
  reviews: number;
  verified?: boolean;
  pinnedReview?: string;
  pinnedBy?: string;
  tags: string[];
  coverUrl: string;
  avatarUrl?: string;
  response?: string;
  startingFrom?: string;
  portfolioCount?: number;
  projectTypes?: string[];
  services?: string[];
  professionalTypes?: string[];
  serviceAreas?: string[];
  styleExpertise?: string[];
  cities?: string[];
  district?: string;
  serviceRegions?: string[];
  startingBudget?: string;
  searchText?: string;
  business?: {
    name?: string;
  };
};

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 18px 55px rgba(15,23,42,0.08)",
  backdropFilter: "blur(16px)",
};

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
  ["q", "city", "district", "project", "service", "area", "style", "professionalType", "professional", "serviceRegion", "budget", "online", "nationwide", "hasProjects", "verified", "page"].forEach((k) => params.delete(k));
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ""}#liste`;
}

/* ---------- small UI bits ---------- */
function OverlayBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: "rgba(255,255,255,0.82)",
        boxShadow: "0 0 0 1px rgba(15,23,42,0.10), 0 12px 28px rgba(15,23,42,0.10)",
        backdropFilter: "blur(14px)",
        color: "rgba(15,23,42,0.82)",
      }}
    >
      <span className="opacity-85">{icon}</span>
      {label}
    </span>
  );
}

function RatingChip({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{
          background: "rgba(255,255,255,0.62)",
          boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
          color: "rgba(15,23,42,0.78)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Star className="h-3.5 w-3.5 opacity-65" />
        <span className="font-semibold tracking-tight">{rating.toFixed(1)}</span>
      </span>
      <span className="text-[rgba(15,23,42,0.22)]">•</span>
      <span className="font-medium text-[rgba(15,23,42,0.60)]">{reviews} yorum</span>
    </span>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition hover:opacity-95"
      style={{
        background: "rgba(255,255,255,0.78)",
        boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
        color: "rgba(15,23,42,0.78)",
      }}
      title="Kaldır"
    >
      <span className="max-w-55 truncate">{label}</span>
      <X className="h-3.5 w-3.5 opacity-55" />
    </button>
  );
}

/* ---------- row ---------- */
function ListRow({ d }: { d: Designer }) {
  const href = `/tasarimcilar/${d.slug}`;
  const projects = (d.projectTypes?.slice(0, 2) || []).join(" • ");
  const services = (d.services?.slice(0, 3) || []).join(" • ");
  const pinned = (d.pinnedReview || "").trim();
  const needsMore = pinned.length > 90;

  return (
    <Link href={href} className="block w-full cursor-pointer overflow-hidden rounded-3xl hover:shadow-lg transition-shadow duration-200" style={glass}>
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:gap-6 md:p-5">
        <div
          className="relative overflow-hidden rounded-3xl md:w-[320px] md:shrink-0"
          style={{
            boxShadow: "0 0 0 1px rgba(15,23,42,0.10), 0 22px 60px rgba(15,23,42,0.14)",
            background: "rgba(255,255,255,0.70)",
          }}
        >
          <div className="relative h-48 w-full md:h-42.5">
            {d.coverUrl ? (
              <img
                src={d.coverUrl}
                alt={`${d.name} görsel`}
                className="absolute inset-0 block h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
                <img src="/web_icon2.png" alt="Evlumba" className="h-10 w-auto opacity-90" />
                <span className="mt-2 text-[10px] font-medium tracking-widest text-slate-400 uppercase">Yaşam alanınızı birlikte tasarlayalım</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_circle_at_20%_10%,rgba(255,255,255,0.16),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent" />

            <div className="absolute left-3 top-3" />
            <div className="absolute right-3 top-3">
              {d.response ? <OverlayBadge icon={<Timer className="h-3.5 w-3.5" />} label={d.response} /> : null}
            </div>

            {/* Avatar */}
            <div className="absolute bottom-3 left-3">
              <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white shadow-md bg-slate-100">
                {d.avatarUrl ? (
                  <img src={d.avatarUrl} alt={d.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
                    {(d.name || "P").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-[16px] font-semibold text-[#0f172a]">{d.name}</div>
                <RatingChip rating={d.rating} reviews={d.reviews} />
              </div>
              <div className="mt-1 text-sm text-[rgba(15,23,42,0.60)]">{d.title}</div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {d.city ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      background: "rgba(255,255,255,0.62)",
                      boxShadow: "0 0 0 1px rgba(15,23,42,0.08)",
                      backdropFilter: "blur(12px)",
                      color: "rgba(15,23,42,0.66)",
                    }}
                  >
                    <MapPin className="h-3.5 w-3.5 opacity-70" />
                    {d.city}
                  </span>
                ) : null}

                {typeof d.portfolioCount === "number" && d.portfolioCount > 0 ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      background: "rgba(255,255,255,0.55)",
                      boxShadow: "0 0 0 1px rgba(15,23,42,0.08)",
                      backdropFilter: "blur(12px)",
                      color: "rgba(15,23,42,0.62)",
                    }}
                  >
                    <Briefcase className="h-3.5 w-3.5 opacity-70" />
                    {d.portfolioCount} iş
                  </span>
                ) : null}
              </div>
            </div>

            <Link
              href={href}
              className="group shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition
                         hover:-translate-y-px active:translate-y-0 active:scale-[0.99]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(99,102,241,0.10) 55%, rgba(255,255,255,0.86) 100%)",
                boxShadow: "0 0 0 1px rgba(15,23,42,0.12), 0 14px 36px rgba(15,23,42,0.10)",
                color: "rgba(15,23,42,0.90)",
                backdropFilter: "blur(10px)",
              }}
            >
              Profili gör
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-3 grid gap-2 text-[13px] leading-5 text-[rgba(15,23,42,0.62)] md:grid-cols-2">
            {projects ? (
              <div className="min-w-0">
                <span className="font-medium text-[rgba(15,23,42,0.72)]">Proje</span>
                <div className="truncate">{projects}</div>
              </div>
            ) : (
              <div />
            )}

            {services ? (
              <div className="min-w-0">
                <span className="font-medium text-[rgba(15,23,42,0.72)]">Hizmet</span>
                <div className="truncate">{services}</div>
              </div>
            ) : (
              <div />
            )}
          </div>

          {pinned ? (
            <div className="relative mt-3">
              {needsMore ? (
                <details className="group relative">
                  <summary
                    className="flex cursor-pointer list-none items-center gap-2 rounded-2xl px-3 py-2"
                    style={{
                      background: "rgba(255,255,255,0.52)",
                      boxShadow: "0 0 0 1px rgba(15,23,42,0.08)",
                      color: "rgba(15,23,42,0.62)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <Bookmark className="h-4 w-4 opacity-55" />
                    <span className="shrink-0 text-[11px] font-semibold text-[rgba(15,23,42,0.64)]">Öne çıkan</span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-[rgba(15,23,42,0.60)]">{pinned}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-[rgba(15,23,42,0.52)] underline decoration-[rgba(15,23,42,0.18)] underline-offset-2">
                      Daha fazla
                    </span>
                  </summary>

                  <div className="hidden group-open:block">
                    <div className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] md:hidden" />
                    <div
                      className="fixed inset-x-4 bottom-6 z-50 max-h-[55vh] overflow-auto rounded-3xl p-4
                                 md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+10px)] md:w-[min(460px,calc(100vw-2rem))]"
                      style={glass}
                    >
                      <div className="text-xs font-semibold text-[rgba(15,23,42,0.74)]">Öne çıkan yorum</div>
                      <p className="mt-2 text-[13px] leading-6 text-[rgba(15,23,42,0.68)]">{pinned}</p>
                      {d.pinnedBy ? <div className="mt-3 text-xs text-[rgba(15,23,42,0.52)]">{d.pinnedBy}</div> : null}
                    </div>
                  </div>
                </details>
              ) : (
                <div
                  className="flex items-center gap-2 rounded-2xl px-3 py-2"
                  style={{
                    background: "rgba(255,255,255,0.52)",
                    boxShadow: "0 0 0 1px rgba(15,23,42,0.08)",
                    color: "rgba(15,23,42,0.62)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <Bookmark className="h-4 w-4 opacity-55" />
                  <span className="shrink-0 text-[11px] font-semibold text-[rgba(15,23,42,0.64)]">Öne çıkan</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[rgba(15,23,42,0.60)]">{pinned}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/* ---------- pagination UI ---------- */
function PageButton({
  active,
  children,
  onClick,
  disabled,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/[0.06]"
      style={{
        background: active ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.78)",
        boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
        color: "rgba(15,23,42,0.82)",
        backdropFilter: "blur(12px)",
      }}
    >
      {children}
    </button>
  );
}

export default function DesignersResultsClient({ designers }: { designers: Designer[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qs = sp.toString();

  const qRaw = sp.get("q") || "";
  const q = qRaw.trim();
  const city = sp.get("city") || "";
  const district = sp.get("district") || "";
  const project = sp.get("project") || "";
  const service = sp.get("service") || "";
  const area = sp.get("area") || sp.get("room") || "";
  const style = sp.get("style") || "";
  const professionalType = sp.get("professionalType") || sp.get("professional") || "";
  const serviceRegion = sp.get("serviceRegion") || "";
  const budget = sp.get("budget") || "";
  const online = sp.get("online") || "";
  const nationwide = sp.get("nationwide") || "";
  const hasProjects = sp.get("hasProjects") || "";
  const verified = sp.get("verified") || "";
  const [semanticDesignerIds, setSemanticDesignerIds] = useState<string[] | null>(null);
  const [semanticSearching, setSemanticSearching] = useState(false);

  useEffect(() => {
    const query = qRaw.trim();
    if (query.length < 2 || isProfessionalQuery(query)) {
      setSemanticDesignerIds(null);
      setSemanticSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSemanticSearching(true);
      semanticSearch({
        query,
        mode: "designers",
        limit: 100,
        city: city || undefined,
        signal: controller.signal,
      })
        .then((result) => setSemanticDesignerIds(result.designerIds))
        .catch(() => setSemanticDesignerIds(null))
        .finally(() => setSemanticSearching(false));
    }, 420);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [qRaw, city]);

  // ✅ pagination
  const pageSize = 6;
  const page = Math.max(1, Number(sp.get("page") || "1") || 1);

  const filtered = useMemo(() => {
    const matches = (values: string[] | undefined, selected: string) => {
      if (!selected) return true;
      const list = values || [];
      return list.includes(selected);
    };
    const tokens = queryTokens(q);
    const normalizedQuery = normalizeSearchText(q);
    const semanticOrder =
      semanticDesignerIds && q.length >= 2
        ? new Map(semanticDesignerIds.map((id, index) => [id, index]))
        : null;
    const hasSemantic = Boolean(semanticOrder?.size);

    const profileText = (d: Designer) =>
      normalizeSearchText(
        [
          d.name,
          d.business?.name || "",
          d.searchText || "",
          d.title,
          d.city,
          ...(d.cities || []),
          d.district || "",
          d.startingBudget || "",
          ...(d.tags || []),
          ...(d.professionalTypes || []),
          ...(d.projectTypes || []),
          ...(d.services || []),
          ...(d.serviceAreas || []),
          ...(d.styleExpertise || []),
          ...(d.serviceRegions || []),
        ].join(" ")
      );

    const textMatches = (d: Designer) => {
      if (!q) return true;
      const hay = profileText(d);
      if (normalizedQuery && hay.includes(normalizedQuery)) return true;
      if (!tokens.length) return true;
      return tokens.every((token) => hay.includes(token));
    };

    const textScore = (d: Designer) => {
      if (!tokens.length) return 0;
      const cityText = normalizeSearchText([d.city, ...(d.cities || []), d.district || ""].join(" "));
      const typeText = normalizeSearchText([d.title, ...(d.professionalTypes || [])].join(" "));
      const nameText = normalizeSearchText([d.name, d.business?.name || ""].join(" "));
      const hay = profileText(d);
      return tokens.reduce((score, token) => {
        let next = score;
        if (cityText.includes(token)) next += 8;
        if (typeText.includes(token)) next += 7;
        if (nameText.includes(token)) next += 5;
        if (hay.includes(token)) next += 2;
        return next;
      }, 0);
    };

    return designers.filter((d) => {
      if (city && !(d.cities?.length ? d.cities : [d.city]).includes(city)) return false;
      if (district && d.district !== district) return false;
      if (verified === "1" && !d.verified) return false;
      if (!matches(d.projectTypes, project)) return false;
      if (!matches(d.services, service)) return false;
      if (!matches(d.serviceAreas, area)) return false;
      if (!matches(d.styleExpertise, style)) return false;
      if (!matches(d.professionalTypes, professionalType)) return false;
      if (budget && d.startingBudget !== budget) return false;
      if (serviceRegion && !(d.serviceRegions || []).includes(serviceRegion)) return false;
      if (online === "1" && !(d.serviceRegions || []).includes("Online hizmet veriyorum")) return false;
      if (nationwide === "1" && !(d.serviceRegions || []).includes("Türkiye geneli")) return false;
      if (hasProjects === "1" && Number(d.portfolioCount || 0) < 1) return false;

      if (q) {
        const semanticMatch = d.liveDesignerId ? semanticOrder?.has(d.liveDesignerId) : false;
        if (!semanticMatch && !textMatches(d)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (!q) return 0;
      const scoreCompare = textScore(b) - textScore(a);
      if (scoreCompare !== 0) return scoreCompare;

      if (hasSemantic) {
        const aOrder = a.liveDesignerId ? semanticOrder?.get(a.liveDesignerId) : undefined;
        const bOrder = b.liveDesignerId ? semanticOrder?.get(b.liveDesignerId) : undefined;
        const aRank = aOrder ?? 100000;
        const bRank = bOrder ?? 100000;
        if (aRank !== bRank) return aRank - bRank;
      }

      return Number(b.rating || 0) - Number(a.rating || 0);
    });
  }, [designers, q, city, district, project, service, area, style, professionalType, serviceRegion, budget, online, nationwide, hasProjects, verified, semanticDesignerIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(filtered.length, startIdx + pageSize);
  const pageItems = filtered.slice(startIdx, endIdx);

  // URL'de page çok büyürse, güvenli sayfaya çek
  useEffect(() => {
    if (page !== safePage) {
      router.replace(buildUrl(pathname, qs, { page: String(safePage) }), { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, safePage]);

  const active = useMemo(() => {
    const items: { key: string; label: string }[] = [];
    if (city) items.push({ key: "city", label: `Şehir: ${city}` });
    if (district) items.push({ key: "district", label: `İlçe: ${district}` });
    if (project) items.push({ key: "project", label: `Proje: ${project}` });
    if (service) items.push({ key: "service", label: `Hizmet: ${service}` });
    if (area) items.push({ key: "area", label: `Alan: ${area}` });
    if (style) items.push({ key: "style", label: `Stil: ${style}` });
    if (professionalType) items.push({ key: "professionalType", label: `Profesyonel: ${professionalType}` });
    if (serviceRegion) items.push({ key: "serviceRegion", label: `Bölge: ${serviceRegion}` });
    if (budget) items.push({ key: "budget", label: `Bütçe: ${budget}` });
    if (online === "1") items.push({ key: "online", label: "Online hizmet" });
    if (nationwide === "1") items.push({ key: "nationwide", label: "Türkiye geneli" });
    if (hasProjects === "1") items.push({ key: "hasProjects", label: "Projeleri olanlar" });
    if (verified === "1") items.push({ key: "verified", label: "Doğrulanmış" });
    if (q) items.push({ key: "q", label: `Arama: ${sp.get("q") || ""}` });
    return items;
  }, [q, city, district, project, service, area, style, professionalType, serviceRegion, budget, online, nationwide, hasProjects, verified, sp]);

  const hasAny = active.length > 0;

  const patchFilter = (p: Record<string, string>) => {
    // ✅ filtre değişince page=1
    router.replace(buildUrl(pathname, qs, { ...p, page: "1" }), { scroll: false });
  };

  const setPage = (p: number) => {
    // Scroll to top of results for immediate feedback
    document.getElementById("designers-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    router.replace(buildUrl(pathname, qs, { page: String(p) }), { scroll: false });
  };

  const clearAll = () => {
    router.replace(clearAllUrl(pathname, qs), { scroll: false });
  };

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (city) parts.push(city);
    if (project) parts.push(project);
    if (service) parts.push(service);
    if (area) parts.push(area);
    if (professionalType) parts.push(professionalType);
    if (serviceRegion) parts.push(serviceRegion);
    if (hasProjects === "1") parts.push("Projeleri olanlar");
    if (verified === "1") parts.push("Doğrulanmış");
    if (q) parts.push(`"${sp.get("q") || ""}"`);
    return parts.join(" • ");
  }, [city, project, service, area, professionalType, serviceRegion, hasProjects, verified, q, sp]);

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#0f172a] md:text-xl">Öne Çıkan Tasarımcılar</h3>
          <p className="mt-1 text-sm text-[rgba(15,23,42,0.58)]">
            Portföy + yorum + hız sinyalleriyle seçilmiş örnek profiller.
          </p>

          <div className="mt-4 text-sm text-[rgba(15,23,42,0.62)]">
            {hasAny ? (
              <>
                <span className="font-medium text-[rgba(15,23,42,0.74)]">Filtre:</span>{" "}
                <span className="text-[rgba(15,23,42,0.62)]">{summary}</span>{" "}
                <span className="text-[rgba(15,23,42,0.28)]">•</span>{" "}
                <span className="font-semibold text-[rgba(15,23,42,0.78)]">{filtered.length}</span>
              </>
            ) : (
              <>
                Tüm sonuçlar{" "}
                <span className="text-[rgba(15,23,42,0.28)]">•</span>{" "}
                <span className="font-semibold text-[rgba(15,23,42,0.78)]">{filtered.length}</span>
              </>
            )}

            {filtered.length > pageSize ? (
              <>
                {" "}
                <span className="text-[rgba(15,23,42,0.28)]">•</span>{" "}
                <span className="text-[rgba(15,23,42,0.62)]">
                  {startIdx + 1}–{endIdx} / {filtered.length}
                </span>
              </>
            ) : null}
            {semanticSearching ? (
              <>
                {" "}
                <span className="text-[rgba(15,23,42,0.28)]">•</span>{" "}
                <span className="text-[rgba(15,23,42,0.50)]">Akıllı arama çalışıyor</span>
              </>
            ) : null}
          </div>
        </div>

        {hasAny ? (
          <button
            type="button"
            onClick={clearAll}
            className="hidden md:inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition hover:opacity-95"
            style={{
              background: "rgba(255,255,255,0.78)",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
              color: "rgba(15,23,42,0.78)",
            }}
          >
            <X className="h-3.5 w-3.5" />
            Tümünü temizle
          </button>
        ) : null}
      </div>

      {/* Seçili filtreler */}
      {hasAny && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {active.map((a) => (
            <Chip key={a.key} label={a.label} onRemove={() => patchFilter({ [a.key]: "" })} />
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition hover:opacity-95"
            style={{
              background: "rgba(255,255,255,0.78)",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
              color: "rgba(15,23,42,0.78)",
            }}
          >
            <X className="h-3.5 w-3.5 opacity-60" />
            Temizle
          </button>
        </div>
      )}

      <div className="mt-5">

        <div className="min-w-0">
          {pageItems.length === 0 ? (
            <div className="w-full rounded-3xl p-6" style={glass}>
              <div className="text-base font-semibold text-[#0f172a]">Sonuç bulunamadı</div>
              <div className="mt-1 text-sm text-[rgba(15,23,42,0.58)]">
                Filtreleri temizleyip tekrar dene ya da aramada daha genel bir ifade kullan.
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition hover:opacity-95"
                  style={{
                    background: "rgba(255,255,255,0.74)",
                    boxShadow: "0 0 0 1px rgba(15,23,42,0.12), 0 16px 44px rgba(15,23,42,0.10)",
                    color: "rgba(15,23,42,0.86)",
                  }}
                >
                  Filtreleri temizle <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div id="designers-results" className="w-full space-y-4">
                {pageItems.map((d) => (
                  <ListRow key={d.slug} d={d} />
                ))}
              </div>

              {/* ✅ Pagination */}
              {filtered.length > pageSize ? (
                <div className="mt-6 flex flex-col items-center justify-between gap-3 md:flex-row">
                  <div className="text-xs text-[rgba(15,23,42,0.55)]">
                    Sayfa <span className="font-semibold text-[rgba(15,23,42,0.78)]">{safePage}</span> / {totalPages}
                  </div>

                  <div className="flex items-center gap-2">
                    <PageButton disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </PageButton>

                    {/* modern: 1 ... p-1 p p+1 ... last */}
                    {(() => {
                      const nums = new Set<number>();
                      nums.add(1);
                      nums.add(totalPages);
                      nums.add(safePage);
                      nums.add(Math.max(1, safePage - 1));
                      nums.add(Math.min(totalPages, safePage + 1));
                      const arr = Array.from(nums).sort((a, b) => a - b);

                      const out: ReactNode[] = [];
                      for (let i = 0; i < arr.length; i++) {
                        const n = arr[i];
                        const prev = arr[i - 1];
                        if (i > 0 && prev && n - prev > 1) {
                          out.push(
                            <span key={`dots-${n}`} className="px-1 text-[rgba(15,23,42,0.45)]">
                              …
                            </span>
                          );
                        }
                        out.push(
                          <PageButton key={n} active={n === safePage} onClick={() => setPage(n)}>
                            {n}
                          </PageButton>
                        );
                      }
                      return out;
                    })()}

                    <PageButton disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </PageButton>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
