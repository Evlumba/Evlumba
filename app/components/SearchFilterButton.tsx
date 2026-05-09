"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { exploreRooms } from "@/lib/data";
import { isProjectQuery } from "@/lib/searchIntent";
import {
  PROFESSIONAL_TYPE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  SERVICE_AREA_OPTIONS,
  SERVICE_OPTIONS,
  SERVICE_REGION_OPTIONS,
  STYLE_OPTIONS,
  TURKIYE_ILLERI,
} from "@/app/tasarimcilar/_data/profileGeneralMapping";

type FilterState = {
  professionalType: string;
  service: string;
  project: string;
  area: string;
  style: string;
  city: string;
  serviceRegion: string;
  onlyProfessionals: boolean;
  onlyProjects: boolean;
};

const INITIAL_FILTERS: FilterState = {
  professionalType: "",
  service: "",
  project: "",
  area: "",
  style: "",
  city: "",
  serviceRegion: "",
  onlyProfessionals: false,
  onlyProjects: false,
};

function slugifyTR(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function roomSlugForArea(area: string) {
  if (!area) return "";
  const direct = exploreRooms.find((room) => room.label === area);
  if (direct) return slugifyTR(direct.label);
  if (area === "Oturma Odası") return "salon";
  if (area === "Bebek Odası" || area === "Çocuk Odası") return "bebek-cocuk";
  if (area === "Çalışma Odası" || area === "Ev Ofis" || area === "Ofis") return "ev-ofisi";
  if (area === "Bahçe" || area === "Teras" || area === "Veranda") return "balkon";
  if (area === "Antre / Hol" || area === "Koridor") return "antre";
  return "";
}

function Field({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`block ${disabled ? "opacity-45" : ""}`}>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-300 disabled:cursor-not-allowed"
      >
        <option value="">Tümü</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SearchFilterButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const activeCount = useMemo(() => {
    return [
      filters.professionalType,
      filters.service,
      filters.project,
      filters.area,
      filters.style,
      filters.city,
      filters.serviceRegion,
      filters.onlyProfessionals ? "pros" : "",
      filters.onlyProjects ? "projects" : "",
    ].filter(Boolean).length;
  }, [filters]);

  const patch = (next: Partial<FilterState>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  const readSearchQuery = () => {
    const form = buttonRef.current?.closest("form");
    if (!form) return "";
    return String(new FormData(form).get("q") ?? "").trim();
  };

  const apply = () => {
    const typedQuery = readSearchQuery();
    const hasProfessionalFilter = Boolean(filters.professionalType || filters.service || filters.serviceRegion);
    const hasProjectFilter = Boolean(filters.area || filters.style || filters.project);
    const mode =
      filters.onlyProjects
        ? "projects"
        : filters.onlyProfessionals || hasProfessionalFilter
          ? "professionals"
          : hasProjectFilter
            ? "projects"
            : isProjectQuery(typedQuery)
              ? "projects"
              : "professionals";

    if (mode === "projects") {
      const roomSlug = roomSlugForArea(filters.area);
      const params = new URLSearchParams();
      const queryParts = [typedQuery];
      if (filters.project) queryParts.push(filters.project);
      if (filters.area && !roomSlug) queryParts.push(filters.area);
      const q = queryParts.map((item) => item.trim()).filter(Boolean).join(" ");
      if (q) params.set("q", q);
      if (filters.style) params.set("style", filters.style);
      if (filters.city) params.set("city", filters.city);
      const qs = params.toString();
      router.push(`/kesfet${roomSlug ? `/${roomSlug}` : ""}${qs ? `?${qs}` : ""}`);
      setOpen(false);
      return;
    }

    const params = new URLSearchParams();
    if (typedQuery) params.set("q", typedQuery);
    if (filters.professionalType) params.set("professionalType", filters.professionalType);
    if (filters.service) params.set("service", filters.service);
    if (filters.project) params.set("project", filters.project);
    if (filters.area) params.set("area", filters.area);
    if (filters.city) params.set("city", filters.city);
    if (filters.serviceRegion) params.set("serviceRegion", filters.serviceRegion);
    router.push(`/tasarimcilar${params.toString() ? `?${params.toString()}` : ""}#liste`);
    setOpen(false);
  };

  return (
    <div className={`relative shrink-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-black/10 bg-white/75 px-4 py-0 text-sm font-semibold text-slate-800 shadow-[0_12px_35px_-28px_rgba(0,0,0,0.25)] backdrop-blur transition hover:bg-white lg:h-[50px] lg:px-6 lg:text-base"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtre
        {activeCount ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-600 px-1.5 text-[11px] text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed left-4 right-4 top-28 z-[80] max-h-[calc(100vh-8rem)] overflow-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_90px_rgba(15,23,42,0.20)] md:left-auto md:right-6 md:w-[720px]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">Filtreler</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Profesyonel Türü" value={filters.professionalType} options={PROFESSIONAL_TYPE_OPTIONS} disabled={filters.onlyProjects} onChange={(value) => patch({ professionalType: value })} />
            <Field label="Hizmetler" value={filters.service} options={SERVICE_OPTIONS} disabled={filters.onlyProjects} onChange={(value) => patch({ service: value })} />
            <Field label="Proje Tipleri" value={filters.project} options={PROJECT_TYPE_OPTIONS} onChange={(value) => patch({ project: value })} />
            <Field label="Hizmet Alanları" value={filters.area} options={SERVICE_AREA_OPTIONS} onChange={(value) => patch({ area: value })} />
            <Field label="Stil" value={filters.style} options={STYLE_OPTIONS} disabled={filters.onlyProfessionals} onChange={(value) => patch({ style: value })} />
            <Field label="Şehir" value={filters.city} options={TURKIYE_ILLERI} onChange={(value) => patch({ city: value })} />
            <Field label="Hizmet Bölgeleri" value={filters.serviceRegion} options={SERVICE_REGION_OPTIONS} disabled={filters.onlyProjects} onChange={(value) => patch({ serviceRegion: value })} />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={filters.onlyProfessionals}
                onChange={(event) => patch({ onlyProfessionals: event.target.checked, onlyProjects: event.target.checked ? false : filters.onlyProjects })}
                className="h-4 w-4 rounded accent-emerald-600"
              />
              Sadece profesyonelleri listele
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={filters.onlyProjects}
                onChange={(event) => patch({ onlyProjects: event.target.checked, onlyProfessionals: event.target.checked ? false : filters.onlyProfessionals })}
                className="h-4 w-4 rounded accent-emerald-600"
              />
              Sadece projeleri listele
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFilters(INITIAL_FILTERS)}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={apply}
              className="rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(4,120,87,0.22)] hover:bg-emerald-800"
            >
              Uygula
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
