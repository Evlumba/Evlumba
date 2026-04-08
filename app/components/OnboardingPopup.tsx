"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type OnboardingStep = {
  id: string;
  step_order: number;
  title: string;
  body: string;
  image_url: string | null;
};

type OnboardingFlow = {
  id: string;
  title: string;
  target_role: string;
  max_impressions_per_user: number;
  onboarding_steps: OnboardingStep[];
};

function getImpressionCount(flowId: string): number {
  try { return Number(localStorage.getItem(`evlumba:onboarding:${flowId}`) || "0"); }
  catch { return 0; }
}

function incrementImpression(flowId: string) {
  try { const c = getImpressionCount(flowId); localStorage.setItem(`evlumba:onboarding:${flowId}`, String(c + 1)); }
  catch {}
}

export default function OnboardingPopup() {
  const [flow, setFlow] = useState<OnboardingFlow | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user?.id) return;

        // Try both roles, API will return the matching one
        const role = authData.user.user_metadata?.role;
        const mappedRole = (role === "designer" || role === "designer_pending") ? "designer" : "homeowner";

        // Also try fetching from profiles as fallback
        let finalRole = mappedRole;
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .maybeSingle();
          if (profile?.role) {
            finalRole = (profile.role === "designer" || profile.role === "designer_pending") ? "designer" : "homeowner";
          }
        } catch {}

        const res = await fetch(`/api/public/onboarding?role=${finalRole}`);
        const data = (await res.json()) as { ok?: boolean; flow?: OnboardingFlow | null };
        if (!data.ok || !data.flow || !data.flow.onboarding_steps?.length) return;

        const impressions = getImpressionCount(data.flow.id);
        if (impressions >= data.flow.max_impressions_per_user) return;

        setFlow(data.flow);
        setTimeout(() => setVisible(true), 800);
        incrementImpression(data.flow.id);
      } catch (err) {
        console.error("OnboardingPopup:", err);
      }
    };
    void load();
  }, []);

  if (!flow || !visible) return null;

  const steps = flow.onboarding_steps;
  const step = steps[currentStep];
  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const close = () => setVisible(false);
  const next = () => { if (isLast) { close(); return; } setCurrentStep((s) => s + 1); };
  const prev = () => setCurrentStep((s) => Math.max(0, s - 1));

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={close}>
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={close} className="absolute right-4 top-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/5 text-slate-500 hover:bg-black/10 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>

        {step.image_url ? (
          <div className="relative h-48 w-full bg-gradient-to-br from-emerald-50 to-sky-50">
            <img src={step.image_url} alt={step.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50">
            <div className="text-4xl">✨</div>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? "w-6 bg-emerald-500" : i < currentStep ? "w-1.5 bg-emerald-300" : "w-1.5 bg-slate-200"}`} />
            ))}
          </div>

          <p className="text-xs font-medium text-slate-400 text-center">{currentStep + 1} / {steps.length}</p>
          <h2 className="mt-3 text-xl font-bold text-slate-900 text-center">{step.title}</h2>
          {step.body ? <p className="mt-3 text-sm leading-6 text-slate-600 text-center">{step.body}</p> : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            {!isFirst ? (
              <button type="button" onClick={prev} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Geri</button>
            ) : (
              <button type="button" onClick={close} className="cursor-pointer text-sm text-slate-400 hover:text-slate-600 transition">Atla</button>
            )}
            <button type="button" onClick={next} className="cursor-pointer rounded-xl bg-gradient-to-b from-[#1a5c3a] to-[#145230] px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_-4px_rgba(26,92,58,0.4)] hover:from-[#1e6b44] hover:to-[#185d39] transition">
              {isLast ? "Başla!" : "İleri"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
