"use client";

import { useEffect, useMemo, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Building2, Check, ChevronDown, Home, Layers, MapPin, Sparkles, X } from "lucide-react";
import { PROMATCH } from "@/lib/promatch";
import {
  PROFESSIONAL_TYPE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  SERVICE_AREA_OPTIONS,
  SERVICE_OPTIONS,
  SERVICE_REGION_OPTIONS,
  TURKIYE_ILLERI,
} from "../_data/profileGeneralMapping";

type FilterKey = "professionalType" | "service" | "project" | "area" | "city" | "serviceRegion";
type DraftFilters = Record<FilterKey, string> & { hasProjects: boolean };

type FilterConfig = {
  key: FilterKey;
  label: string;
  options: string[];
  icon: ReactNode;
};

const FILTER_FIELD_KEYS: FilterKey[] = [
  "professionalType",
  "service",
  "project",
  "area",
  "city",
  "serviceRegion",
];

const FILTER_KEYS = [
  ...FILTER_FIELD_KEYS,
  "hasProjects",
  "page",
];

const EMPTY_DRAFT_FILTERS: DraftFilters = {
  professionalType: "",
  service: "",
  project: "",
  area: "",
  city: "",
  serviceRegion: "",
  hasProjects: false,
};

const shellStyle: CSSProperties = {
  background: "rgba(255,255,255,0.62)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 26px 80px rgba(15,23,42,0.10)",
  backdropFilter: "blur(18px)",
};

const filterPanelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 18px 55px rgba(15,23,42,0.08)",
  backdropFilter: "blur(16px)",
};

const heroImage =
  PROMATCH.images.bannerHero ||
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80";

function readDraftFilters(params: URLSearchParams): DraftFilters {
  return {
    professionalType: params.get("professionalType") || "",
    service: params.get("service") || "",
    project: params.get("project") || "",
    area: params.get("area") || "",
    city: params.get("city") || "",
    serviceRegion: params.get("serviceRegion") || "",
    hasProjects: params.get("hasProjects") === "1",
  };
}

function buildFiltersUrl(pathname: string, current: string, filters: DraftFilters) {
  const params = new URLSearchParams(current);
  for (const key of FILTER_KEYS) params.delete(key);
  for (const key of FILTER_FIELD_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  if (filters.hasProjects) params.set("hasProjects", "1");
  params.delete("page");
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ""}#liste`;
}

function summary(value: string) {
  return value || "Tümü";
}

function FilterPicker({
  config,
  value,
  open,
  query,
  onQuery,
  onToggle,
  onSelect,
}: {
  config: FilterConfig;
  value: string;
  open: boolean;
  query: string;
  onQuery: (value: string) => void;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const options = normalizedQuery
    ? config.options.filter((option) => option.toLocaleLowerCase("tr-TR").includes(normalizedQuery))
    : config.options;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[58px] w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-left transition hover:bg-white"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            {config.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-slate-500">{config.label}</span>
            <span className="block truncate text-sm font-semibold text-slate-900">{summary(value)}</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.16)]">
          {config.options.length > 8 ? (
            <div className="border-b border-slate-100 p-2">
              <input
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder="Ara"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-300"
              />
            </div>
          ) : null}
          <div className="max-h-72 overflow-auto p-2">
            <button
              type="button"
              onClick={() => onSelect("")}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tümü
              {!value ? <Check className="h-4 w-4 text-emerald-600" /> : null}
            </button>
            {options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => onSelect(option)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-emerald-50"
              >
                <span className="min-w-0 truncate">{option}</span>
                {value === option ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DesignerQuickFilters({ cities }: { cities: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [openKey, setOpenKey] = useState<FilterKey | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");

  const qs = sp.toString();
  const urlFilters = useMemo(() => readDraftFilters(new URLSearchParams(qs)), [qs]);
  const [draftFilters, setDraftFilters] = useState<DraftFilters>(urlFilters);

  useEffect(() => {
    setDraftFilters(urlFilters);
  }, [urlFilters]);

  const cityOptions = useMemo(() => {
    return Array.from(new Set([...cities, ...TURKIYE_ILLERI].filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "tr")
    );
  }, [cities]);

  const configs: FilterConfig[] = [
    { key: "professionalType", label: "Profesyonel Türü", options: PROFESSIONAL_TYPE_OPTIONS, icon: <Building2 className="h-4 w-4" /> },
    { key: "service", label: "Hizmetler", options: SERVICE_OPTIONS, icon: <Briefcase className="h-4 w-4" /> },
    { key: "project", label: "Proje Tipleri", options: PROJECT_TYPE_OPTIONS, icon: <Layers className="h-4 w-4" /> },
    { key: "area", label: "Hizmet Alanları", options: SERVICE_AREA_OPTIONS, icon: <Home className="h-4 w-4" /> },
    { key: "city", label: "Şehir", options: cityOptions, icon: <MapPin className="h-4 w-4" /> },
    { key: "serviceRegion", label: "Hizmet Bölgeleri", options: SERVICE_REGION_OPTIONS, icon: <Sparkles className="h-4 w-4" /> },
  ];

  const setDraftValue = (key: FilterKey, value: string) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = () => {
    const url = buildFiltersUrl(pathname, qs, draftFilters);
    startTransition(() => router.replace(url, { scroll: false }));
  };

  const clearFilters = () => {
    setDraftFilters({ ...EMPTY_DRAFT_FILTERS });
    const params = new URLSearchParams(qs);
    for (const key of FILTER_KEYS) params.delete(key);
    const next = params.toString();
    startTransition(() => router.replace(`${pathname}${next ? `?${next}` : ""}#liste`, { scroll: false }));
  };

  const active = configs
    .map((config) => ({ key: config.key, label: config.label, value: draftFilters[config.key] }))
    .filter((item) => item.value);
  const hasProjects = draftFilters.hasProjects;
  const activeCount = active.length + (hasProjects ? 1 : 0);

  return (
    <section className="mt-2 overflow-visible px-4 md:mt-3">
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative rounded-[28px] p-4 md:p-6" style={shellStyle}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
            <div className="absolute -top-28 left-10 h-72 w-72 rounded-full bg-[rgba(16,185,129,0.12)] blur-3xl" />
            <div className="absolute -bottom-28 right-10 h-80 w-80 rounded-full bg-[rgba(99,102,241,0.10)] blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_10%_10%,rgba(255,255,255,0.92),transparent_60%)]" />
          </div>

          <div className="relative z-10 grid items-stretch gap-5 lg:grid-cols-12 lg:gap-7">
            <div className="lg:col-span-7">
              <div className="rounded-[24px] p-4 md:p-5" style={filterPanelStyle}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Tasarımcı filtreleri
                    </div>
                    <h1 className="mt-3 text-[24px] font-semibold tracking-tight text-slate-950 md:text-[30px]">
                      Doğru profesyoneli filtrele.
                    </h1>
                    <div className="mt-1 text-xs text-slate-500">
                      {activeCount ? `${activeCount} seçim aktif` : "Tüm profesyoneller"}
                    </div>
                  </div>
                  {activeCount ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white md:self-auto"
                    >
                      <X className="h-3.5 w-3.5" />
                      Temizle
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {configs.map((config) => (
                    <FilterPicker
                      key={config.key}
                      config={config}
                      value={draftFilters[config.key]}
                      open={openKey === config.key}
                      query={openKey === config.key ? pickerQuery : ""}
                      onQuery={setPickerQuery}
                      onToggle={() => {
                        setOpenKey((current) => (current === config.key ? null : config.key));
                        setPickerQuery("");
                      }}
                      onSelect={(value) => {
                        setDraftValue(config.key, value);
                        setOpenKey(null);
                        setPickerQuery("");
                      }}
                    />
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasProjects}
                      onChange={(event) =>
                        setDraftFilters((current) => ({ ...current, hasProjects: event.target.checked }))
                      }
                      className="h-4 w-4 rounded accent-emerald-600"
                      disabled={isPending}
                    />
                    Sadece projeleri olan profesyonelleri göster
                  </label>

                  {active.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDraftValue(item.key, "")}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {item.label}: {item.value}
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs font-medium text-slate-500">
                    Seçimlerini tamamladıktan sonra sonuçları listele.
                  </div>
                  <button
                    type="button"
                    onClick={applyFilters}
                    disabled={isPending}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600 px-8 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(16,185,129,0.24)] transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    {isPending ? "Aranıyor..." : "Ara"}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div
                className="relative min-h-[260px] overflow-hidden rounded-[26px] border border-white/50 bg-slate-100 shadow-[0_28px_80px_rgba(15,23,42,0.16)] md:min-h-[360px] lg:h-full"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.02), rgba(15,23,42,0.12)), url(${heroImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_circle_at_20%_10%,rgba(255,255,255,0.24),transparent_55%)]" />
                <div className="absolute bottom-4 left-4 right-4 rounded-[22px] border border-white/40 bg-white/78 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.14)] backdrop-blur">
                  <div className="text-sm font-semibold text-slate-950">Portföy, şehir ve hizmet uyumuna göre listele</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["İç Mimar", "Mutfak", "İstanbul"].map((item) => (
                      <span key={item} className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
