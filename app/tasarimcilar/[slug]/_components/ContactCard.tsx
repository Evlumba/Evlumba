"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Send, Sparkles } from "lucide-react";

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.70)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.08), 0 18px 55px rgba(15,23,42,0.10)",
  backdropFilter: "blur(16px)",
};

export default function ContactCard({ name }: { name: string }) {
  const [sent, setSent] = useState(false);

  return (
    <aside className="sticky top-[132px] hidden lg:block">
      <div className="rounded-[24px] p-4" style={glass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#0f172a]">Teklif iste</div>
            <div className="mt-1 text-xs text-[rgba(15,23,42,0.58)]">
              60 sn’de gönder • {name} geri dönüş yapsın.
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
               style={{ background: "rgba(16,185,129,0.14)", color: "rgba(15,23,42,0.78)" }}>
            <Sparkles className="h-3.5 w-3.5" />
            Evlumba önerir
          </div>
        </div>

        {sent ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
            Mesajın gitti ✅ <span className="opacity-70">(şimdilik demo)</span>
          </div>
        ) : null}

        <form
          className="mt-4 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <input className="w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none"
                 placeholder="Ad Soyad" />
          <input className="w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none"
                 placeholder="Telefon / E-posta" />
          <select className="w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none">
            <option>Proje tipi (seç)</option>
            <option>Komple yenileme</option>
            <option>Mutfak dönüşümü</option>
            <option>Tek oda</option>
            <option>Stil yenileme</option>
          </select>
          <select className="w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none">
            <option>Bütçe aralığı (seç)</option>
            <option>₺0–100K</option>
            <option>₺100K–250K</option>
            <option>₺250K–500K</option>
            <option>₺500K+</option>
          </select>

          <textarea className="min-h-[92px] w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none"
                    placeholder="Kısaca ihtiyacın… (örn: 2+1 salon + mutfak, sıcak minimal, 2 ay içinde)" />

          <button
            type="submit"
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(99,102,241,0.12), rgba(255,255,255,0.85))",
              boxShadow: "0 0 0 1px rgba(15,23,42,0.10), 0 16px 44px rgba(15,23,42,0.10)",
              color: "rgba(15,23,42,0.88)",
            }}
          >
            Gönder <Send className="h-4 w-4" />
          </button>

          <div className="pt-1 text-[11px] text-[rgba(15,23,42,0.48)]">
            Not: Demo aşamasında. Yakında “ProMatch” ile otomatik brief.
          </div>
        </form>
      </div>
    </aside>
  );
}
