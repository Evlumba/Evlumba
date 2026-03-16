"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Home, Briefcase, BadgeCheck, X, Sparkles } from "lucide-react";

type Props = {
  resultCount: number;
  cities: string[];
  projects: string[];
  services: string[];
};

const glass = {
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 18px 55px rgba(15,23,42,0.08)",
  backdropFilter: "blur(16px)",
} as const;

function buildUrl(sp: URLSearchParams, patch: Record<string, string | null>) {
  const next = new URLSearchParams(sp.toString());
  Object.entries(patch).forEach(([k, v]) => {
    if (!v) next.delete(k);
    else next.set(k, v);
  });

  const qs = next.toString();
  return `/tasarimcilar${qs ? `?${qs}` : ""}#liste`;
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[rgba(15,23,42,0.72)]">
        <span className="opacity-75">{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div
      className="relative"
      style={{
        background: "rgba(255,255,255,0.78)",
        boxShadow: "0 0 0 1px rgba(15,23,42,0.08)",
        backdropFilter: "blur(14px)",
        borderRadius: 16,
      }}
    >
      <select
        className="h-11 w-full appearance-none bg-transparent px-4 pr-10 text-sm text-[rgba(15,23,42,0.82)] outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value || "__all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(15,23,42,0.38)]">
        ▾
      </span>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm transition hover:opacity-95"
      style={{
        background: checked ? "rgba(16,185,129,0.14)" : "rgba(255,255,255,0.78)",
        boxShadow: checked
          ? "0 0 0 1px rgba(16,185,129,0.18), 0 12px 30px rgba(15,23,42,0.06)"
          : "0 0 0 1px rgba(15,23,42,0.08)",
        backdropFilter: "blur(14px)",
        color: "rgba(15,23,42,0.82)",
      }}
    >
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 opacity-75" />
        <span className="font-medium">{label}</span>
      </div>

      <span
        className="relative inline-flex h-6 w-11 items-center rounded-full"
        style={{
          background: checked ? "rgba(16,185,129,0.45)" : "rgba(15,23,42,0.12)",
          boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.10)",
        }}
      >
        <span
          className="absolute h-5 w-5 rounded-full bg-white shadow"
          style={{
            left: checked ? 22 : 4,
            transition: "left 160ms ease",
          }}
        />
      </span>
    </button>
  );
}

export function FiltersRail({ resultCount, cities, projects, services }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const city = sp.get("city") || "";
  const project = sp.get("project") || "";
  const service = sp.get("service") || "";
  const verified = sp.get("verified") === "1";

  const onPatch = (patch: Record<string, string | null>) => {
    const url = buildUrl(new URLSearchParams(sp.toString()), patch);
    router.replace(url, { scroll: false });
  };

  return (
    <div className="rounded-3xl p-4" style={glass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[#0f172a]">Filtreler</div>
          <div className="mt-1 text-xs text-[rgba(15,23,42,0.56)]">
            Sonuç: <span className="font-semibold text-[rgba(15,23,42,0.80)]">{resultCount}</span>
          </div>
        </div>

        {(city || project || service || verified) && (
          <button
            type="button"
            onClick={() => onPatch({ city: null, project: null, service: null, verified: null })}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition hover:opacity-95"
            style={{
              background: "rgba(255,255,255,0.78)",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
              color: "rgba(15,23,42,0.74)",
            }}
          >
            <X className="h-3.5 w-3.5" />
            Temizle
          </button>
        )}
      </div>

      <Field label="Şehir" icon={<MapPin className="h-4 w-4" />}>
        <Select
          value={city}
          onChange={(v) => onPatch({ city: v || null })}
          options={[
            { label: "Tümü", value: "" },
            ...cities.map((c) => ({ label: c, value: c })),
          ]}
        />
      </Field>

      <Field label="Proje tipi" icon={<Home className="h-4 w-4" />}>
        <Select
          value={project}
          onChange={(v) => onPatch({ project: v || null })}
          options={[
            { label: "Tümü", value: "" },
            ...projects.map((p) => ({ label: p, value: p })),
          ]}
        />
      </Field>

      <Field label="Hizmet" icon={<Briefcase className="h-4 w-4" />}>
        <Select
          value={service}
          onChange={(v) => onPatch({ service: v || null })}
          options={[
            { label: "Tümü", value: "" },
            ...services.map((s) => ({ label: s, value: s })),
          ]}
        />
      </Field>

      <Field label="Doğrulama" icon={<Sparkles className="h-4 w-4" />}>
        <Toggle
          checked={verified}
          onChange={(v) => onPatch({ verified: v ? "1" : null })}
          label="Doğrulanmış"
        />
      </Field>

      <div className="mt-4 rounded-2xl p-3 text-xs" style={{ ...glass, background: "rgba(255,255,255,0.74)" }}>
        <div className="text-[rgba(15,23,42,0.60)]">
          İpucu: Serbest aramada “bütçe”, “oda”, “şehir” gibi detayları da yazabilirsin.
        </div>
      </div>
    </div>
  );
}

export function ActiveFiltersBar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const sp = useSearchParams();

  const chips = useMemo(() => {
    const out: { key: string; label: string; remove: Record<string, null> }[] = [];

    const q = sp.get("q");
    const city = sp.get("city");
    const project = sp.get("project");
    const service = sp.get("service");
    const verified = sp.get("verified") === "1";

    if (q) out.push({ key: "q", label: `Arama: ${q}`, remove: { q: null } });
    if (city) out.push({ key: "city", label: `Şehir: ${city}`, remove: { city: null } });
    if (project) out.push({ key: "project", label: `Proje: ${project}`, remove: { project: null } });
    if (service) out.push({ key: "service", label: `Hizmet: ${service}`, remove: { service: null } });
    if (verified) out.push({ key: "verified", label: "Doğrulanmış", remove: { verified: null } });

    return out;
  }, [sp]);

  const onPatch = (patch: Record<string, null>) => {
    const url = buildUrl(new URLSearchParams(sp.toString()), patch);
    router.replace(url, { scroll: false });
  };

  if (chips.length === 0) {
    return (
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-[rgba(15,23,42,0.58)]">
          Tüm sonuçlar • <span className="font-semibold text-[rgba(15,23,42,0.80)]">{resultCount}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-3xl p-4" style={glass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[#0f172a]">
          Filtrelenmiş sonuçlar •{" "}
          <span className="font-semibold text-[rgba(15,23,42,0.80)]">{resultCount}</span>
        </div>

        <button
          type="button"
          onClick={() => onPatch({ q: null, city: null, project: null, service: null, verified: null })}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition hover:opacity-95"
          style={{
            background: "rgba(255,255,255,0.78)",
            boxShadow: "0 0 0 1px rgba(15,23,42,0.10)",
            color: "rgba(15,23,42,0.74)",
          }}
        >
          <X className="h-3.5 w-3.5" />
          Tümünü temizle
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onPatch(c.remove)}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition hover:opacity-95"
            style={{
              background: "rgba(255,255,255,0.78)",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.08)",
              color: "rgba(15,23,42,0.74)",
              backdropFilter: "blur(14px)",
            }}
            title="Kaldır"
          >
            {c.label}
            <X className="h-3.5 w-3.5 opacity-70" />
          </button>
        ))}
      </div>
    </div>
  );
}
