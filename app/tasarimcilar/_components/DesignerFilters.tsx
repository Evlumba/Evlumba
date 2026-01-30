"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Briefcase,
  Home,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react";

type Options = {
  cities: string[];
  projects: string[];
  services: string[];
};

const glass = {
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 18px 55px rgba(15,23,42,0.08)",
  backdropFilter: "blur(16px)",
} as const;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-[rgba(15,23,42,0.72)]">
      {children}
    </div>
  );
}

function FieldShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-2 rounded-2xl px-3 py-2"
      style={{
        background: "rgba(255,255,255,0.78)",
        boxShadow: "0 0 0 1px rgba(15,23,42,0.08)",
        backdropFilter: "blur(14px)",
      }}
    >
      {children}
    </div>
  );
}

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition hover:opacity-95"
      style={{
        background: "rgba(255,255,255,0.74)",
        boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
        color: "rgba(15,23,42,0.78)",
      }}
      title="Kaldır"
    >
      <span className="max-w-55 truncate">{label}</span>
      <X className="h-3.5 w-3.5 opacity-60" />
    </button>
  );
}

function buildUrl(
  pathname: string,
  current: URLSearchParams,
  patch: Record<string, string>
) {
  const params = new URLSearchParams(current.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (!v) params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ""}#liste`;
}

function clearAllUrl(pathname: string, current: URLSearchParams) {
  const params = new URLSearchParams(current.toString());
  ["q", "city", "project", "service", "verified"].forEach((k) => params.delete(k));
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ""}#liste`;
}

export function DesignerFilters({
  options,
  className,
}: {
  options: Options;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = sp.get("q") || "";
  const city = sp.get("city") || "";
  const project = sp.get("project") || "";
  const service = sp.get("service") || "";
  const verified = sp.get("verified") || "";

  const hasAny = !!(q || city || project || service || verified);

  const active = useMemo(() => {
    const items: { key: string; label: string }[] = [];
    if (q) items.push({ key: "q", label: `Arama: ${q}` });
    if (city) items.push({ key: "city", label: `Şehir: ${city}` });
    if (project) items.push({ key: "project", label: `Proje: ${project}` });
    if (service) items.push({ key: "service", label: `Hizmet: ${service}` });
    if (verified === "1") items.push({ key: "verified", label: "Doğrulanmış" });
    return items;
  }, [q, city, project, service, verified]);

  const go = (patch: Record<string, string>) => {
    const url = buildUrl(pathname, sp as unknown as URLSearchParams, patch);
    startTransition(() => router.push(url));
  };

  const clearAll = () => {
    const url = clearAllUrl(pathname, sp as unknown as URLSearchParams);
    startTransition(() => router.push(url));
  };

  return (
    <div className={className} aria-busy={isPending}>
      <div className="rounded-3xl p-4" style={glass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 opacity-70" />
              <div className="text-sm font-semibold text-[#0f172a]">Filtreler</div>
            </div>
            <div className="mt-1 text-xs text-[rgba(15,23,42,0.55)]">
              Seçtikçe URL güncellenir ve liste anında filtrelenir.
            </div>
          </div>

          {hasAny ? (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition hover:opacity-95"
              style={{
                background: "rgba(255,255,255,0.74)",
                boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
                color: "rgba(15,23,42,0.78)",
              }}
            >
              <X className="h-3.5 w-3.5" />
              Tümünü temizle
            </button>
          ) : null}
        </div>

        {active.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {active.map((a) => (
              <Chip key={a.key} label={a.label} onRemove={() => go({ [a.key]: "" })} />
            ))}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4">
          {/* Şehir */}
          <div>
            <Label>Şehir</Label>
            <FieldShell>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 opacity-60" />
                <select
                  value={city}
                  onChange={(e) => go({ city: e.target.value })}
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
            </FieldShell>
          </div>

          {/* Proje */}
          <div>
            <Label>Proje tipi</Label>
            <FieldShell>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 opacity-60" />
                <select
                  value={project}
                  onChange={(e) => go({ project: e.target.value })}
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
            </FieldShell>
          </div>

          {/* Hizmet */}
          <div>
            <Label>Hizmet</Label>
            <FieldShell>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 opacity-60" />
                <select
                  value={service}
                  onChange={(e) => go({ service: e.target.value })}
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
            </FieldShell>
          </div>

          {/* Verified */}
          <div>
            <Label>Doğrulama</Label>
            <FieldShell>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[rgba(15,23,42,0.78)]">
                <input
                  type="checkbox"
                  checked={verified === "1"}
                  onChange={(e) => go({ verified: e.target.checked ? "1" : "" })}
                  className="h-4 w-4 rounded border-[rgba(15,23,42,0.18)]"
                />
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 opacity-60" />
                  Sadece doğrulanmış
                </span>
              </label>
            </FieldShell>
          </div>

          <div
            className="rounded-2xl p-3 text-xs"
            style={{ ...glass, background: "rgba(255,255,255,0.74)" }}
          >
            <div className="text-[rgba(15,23,42,0.60)]">
              İpucu: Üstteki “Hızlı Arama” alanını kullanırsan “q” parametresi de URL’de taşınır.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActiveFiltersRow({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = sp.get("q") || "";
  const city = sp.get("city") || "";
  const project = sp.get("project") || "";
  const service = sp.get("service") || "";
  const verified = sp.get("verified") || "";

  const hasAny = !!(q || city || project || service || verified);

  const active = useMemo(() => {
    const items: { key: string; label: string }[] = [];
    if (q) items.push({ key: "q", label: `Arama: ${q}` });
    if (city) items.push({ key: "city", label: `Şehir: ${city}` });
    if (project) items.push({ key: "project", label: `Proje: ${project}` });
    if (service) items.push({ key: "service", label: `Hizmet: ${service}` });
    if (verified === "1") items.push({ key: "verified", label: "Doğrulanmış" });
    return items;
  }, [q, city, project, service, verified]);

  const go = (patch: Record<string, string>) => {
    const url = buildUrl(pathname, sp as unknown as URLSearchParams, patch);
    startTransition(() => router.push(url));
  };

  const clearAll = () => {
    const url = clearAllUrl(pathname, sp as unknown as URLSearchParams);
    startTransition(() => router.push(url));
  };

  return (
    <div
      className="rounded-3xl px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.62)",
        boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 14px 40px rgba(15,23,42,0.06)",
        backdropFilter: "blur(14px)",
      }}
      aria-busy={isPending}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[rgba(15,23,42,0.70)]">
          <span className="font-semibold text-[#0f172a]">
            {hasAny ? "Filtrelenmiş sonuçlar" : "Tüm sonuçlar"}
          </span>{" "}
          <span className="text-[rgba(15,23,42,0.30)]">•</span>{" "}
          <span className="font-semibold text-[rgba(15,23,42,0.80)]">{total}</span>
        </div>

        {hasAny ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition hover:opacity-95"
            style={{
              background: "rgba(255,255,255,0.74)",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
              color: "rgba(15,23,42,0.78)",
            }}
          >
            <X className="h-3.5 w-3.5" />
            Tümünü temizle
          </button>
        ) : null}
      </div>

      {active.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {active.map((a) => (
            <Chip key={a.key} label={a.label} onRemove={() => go({ [a.key]: "" })} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
