// components/designer/DesignerMatchWizard.tsx
"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";

type Option = { id: string; label: string; hint?: string };

const projectTypes: Option[] = [
  { id: "single-room", label: "Tek oda yenileme", hint: "Salon / yatak / mutfak" },
  { id: "full-home", label: "Komple ev", hint: "A’dan Z’ye dönüşüm" },
  { id: "new-home", label: "Yeni ev yerleşim", hint: "Sıfırdan düzen & plan" },
];

const vibes: Option[] = [
  { id: "modern", label: "Modern", hint: "Temiz çizgiler" },
  { id: "japandi", label: "Japandi", hint: "Sakin & minimal" },
  { id: "classic", label: "Klasik", hint: "Zamansız" },
  { id: "eclectic", label: "Ekletik", hint: "Karakterli" },
];

const budgets: Option[] = [
  { id: "low", label: "Düşük", hint: "Akıllı dokunuşlar" },
  { id: "mid", label: "Orta", hint: "Dengeli kalite" },
  { id: "high", label: "Yüksek", hint: "Premium işçilik" },
];

export default function DesignerMatchWizard() {
  const [project, setProject] = useState<string>("");
  const [vibe, setVibe] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const done = Boolean(project && vibe && budget);

  const summary = useMemo(() => {
    const p = projectTypes.find((x) => x.id === project)?.label;
    const v = vibes.find((x) => x.id === vibe)?.label;
    const b = budgets.find((x) => x.id === budget)?.label;
    return { p, v, b };
  }, [project, vibe, budget]);

  function reset() {
    setProject("");
    setVibe("");
    setBudget("");
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" id="promatch">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">ProMatch</div>
          <div className="mt-1 text-sm text-slate-600">
            Filtre kalabalığı yok. Sadece 3 seçim.
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Sıfırla
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <Question
          title="1) Proje tipi"
          subtitle="Ne yapmak istiyorsun?"
          options={projectTypes}
          value={project}
          onChange={setProject}
        />

        <Question
          title="2) Tarz (vibe)"
          subtitle="Hangi hissi seviyorsun?"
          options={vibes}
          value={vibe}
          onChange={setVibe}
        />

        <Question
          title="3) Bütçe aralığı"
          subtitle="Genel seviyeyi seç"
          options={budgets}
          value={budget}
          onChange={setBudget}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-semibold text-slate-900">Özet</div>
        <div className="mt-1 text-sm text-slate-600">
          {done ? (
            <span>
              <span className="font-medium text-slate-800">{summary.p}</span> •{" "}
              <span className="font-medium text-slate-800">{summary.v}</span> •{" "}
              <span className="font-medium text-slate-800">{summary.b}</span>
            </span>
          ) : (
            <span>3 seçimi tamamla, öneriler netleşsin.</span>
          )}
        </div>

        <a
          href="#tasarimcilar"
          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-sm transition ${
            done
              ? "bg-slate-900 text-white hover:opacity-90"
              : "cursor-not-allowed bg-slate-200 text-slate-500"
          }`}
          aria-disabled={!done}
          onClick={(e) => {
            if (!done) e.preventDefault();
          }}
        >
          Uyumlu Tasarımcıları Göster <ArrowRight className="h-4 w-4" />
        </a>

        <div className="mt-3 text-xs text-slate-500">
          Not: Şimdilik demo öneriler gösterilir. Sonra bunu gerçek eşleştirme mantığına bağlarız.
        </div>
      </div>
    </div>
  );
}

function Question({
  title,
  subtitle,
  options,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`group relative rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-sm font-semibold ${active ? "text-white" : "text-slate-900"}`}>
                    {opt.label}
                  </div>
                  {opt.hint ? (
                    <div className={`mt-0.5 text-xs ${active ? "text-white/80" : "text-slate-500"}`}>
                      {opt.hint}
                    </div>
                  ) : null}
                </div>
                <div
                  className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
                    active
                      ? "border-white/30 bg-white/15"
                      : "border-slate-200 bg-white group-hover:bg-slate-100"
                  }`}
                >
                  {active ? <Check className="h-4 w-4 text-white" /> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
