// app/components/SiteFooter.tsx
import Link from "next/link";
import type { ReactNode } from "react";

function BrandMark() {
  return (
    <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.55)]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(99,102,241,1) 40%, rgba(16,185,129,1) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.65), rgba(255,255,255,0) 45%)",
        }}
      />
      <span className="relative text-white text-sm font-extrabold">E</span>
    </div>
  );
}

function GlassShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[44px] border border-white/35 bg-white/28 backdrop-blur-xl",
        "shadow-[0_44px_120px_-95px_rgba(0,0,0,0.55)]",
        "ring-1 ring-black/5",
        className,
      ].join(" ")}
    >
      {/* soft glows */}
      <div
        className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full blur-3xl opacity-35"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.55), rgba(139,92,246,0) 60%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 -top-28 h-80 w-80 rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.45), rgba(16,185,129,0) 60%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/3 -bottom-44 h-120 w-120 rounded-full blur-3xl opacity-20"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.42), rgba(99,102,241,0) 60%)",
        }}
        aria-hidden="true"
      />

      {/* inner highlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 30% 15%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative">{children}</div>
    </div>
  );
}

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-2xl border border-white/55 bg-white/16 backdrop-blur-xl shadow-[0_14px_45px_-38px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.9)]">
      {children}
    </span>
  );
}

function SoftTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
      {children}
    </div>
  );
}

function QuickPill({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-white/50 bg-white/14 px-4 py-3
                 backdrop-blur-xl shadow-[0_18px_60px_-52px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.85)]
                 hover:bg-white/20 hover:border-white/70 transition"
    >
      <div className="flex items-center gap-3 min-w-0">
        <IconWrap>{icon}</IconWrap>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">
            {title}
          </div>
          <div className="truncate text-xs text-slate-600">{desc}</div>
        </div>
      </div>

      <span className="shrink-0 text-slate-400 group-hover:text-slate-700 transition">
        →
      </span>
    </Link>
  );
}

function FeatureChip({
  icon,
  text,
}: {
  icon: ReactNode;
  text: ReactNode;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/14 px-3 py-2
                 backdrop-blur-xl shadow-[0_14px_45px_-40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.85)]"
    >
      <span className="grid h-7 w-7 place-items-center rounded-2xl bg-white/18 border border-white/45">
        {icon}
      </span>
      <span className="text-[13px] font-semibold text-slate-800">{text}</span>
    </div>
  );
}

function GlassCTA({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition backdrop-blur-xl";
  const primary =
    "border border-white/65 bg-white/18 text-slate-900 shadow-[0_22px_65px_-55px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.95)] hover:bg-white/26 hover:border-white/80";
  const secondary =
    "border border-white/55 bg-white/12 text-slate-900 shadow-[0_18px_55px_-48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white/20 hover:border-white/75";

  return (
    <Link href={href} className={`${base} ${variant === "primary" ? primary : secondary}`}>
      <span
        className="absolute -z-10 h-0 w-0"
        aria-hidden="true"
      />
      {children}
      <span className="opacity-80" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

/** ✅ SENİN SEVDİĞİN: Profesyoneller kartını koruyoruz */
function ProfessionalsCard() {
  return (
    <div className="rounded-3xl border border-white/55 bg-white/14 p-5 backdrop-blur-xl shadow-[0_24px_80px_-68px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.9)]">
      <SoftTitle>PROFESYONELLER</SoftTitle>

      <div className="mt-2 text-sm text-slate-700 leading-6">
        Portföyünü vitrine çıkar, <span className="font-semibold text-slate-900">lead</span> topla,
        teklif akışını hızlandır.
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/14 px-3 py-2.5 backdrop-blur-xl shadow-[0_14px_45px_-40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.85)]">
          <IconWrap>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-violet-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l1.2 5.1L18 9l-4.8 1.9L12 16l-1.2-5.1L6 9l4.8-1.9L12 2z" />
            </svg>
          </IconWrap>
          <div className="text-sm text-slate-700 leading-6">
            Sabit yorum + <span className="font-semibold text-slate-900">hızlı dönüş</span> rozeti
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/14 px-3 py-2.5 backdrop-blur-xl shadow-[0_14px_45px_-40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.85)]">
          <IconWrap>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-rose-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </IconWrap>
          <div className="text-sm text-slate-700 leading-6">
            Zevke yakın kullanıcılara daha kolay görün
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/14 px-3 py-2.5 backdrop-blur-xl shadow-[0_14px_45px_-40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.85)]">
          <IconWrap>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-700" fill="currentColor">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
          </IconWrap>
          <div className="text-sm text-slate-700 leading-6">
            Net brief → daha hızlı karar → daha iyi dönüşüm
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Bu buton şu anda pasif."
        className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl
                   border border-white/50 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-500
                   backdrop-blur-xl opacity-70
                   shadow-[0_22px_65px_-55px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.8)]"
      >
        Profesyonel olarak katıl <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="mt-16 pb-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <GlassShell>
          <div className="p-7 md:p-10">
            <div className="grid gap-10 md:grid-cols-12 md:items-start">
              {/* ✅ SOL: footer hero (yenilendi) */}
              <div className="md:col-span-5">
                <div className="flex items-start gap-3">
                  <BrandMark />
                  <div>
                    <div className="text-base font-extrabold tracking-tight text-slate-950">
                      Evlumba
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      Keşfet • Kaydet • Eşleş
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[15px] leading-7 text-slate-700 max-w-[58ch]">
                    İlhamı keşfet, beğendiklerini düzenle; tarzın netleşince doğru tasarımcıyla{" "}
                    <span className="font-semibold text-slate-900">zahmetsiz</span> eşleş.
                  </div>
                </div>

                {/* feature chips (soft + tatlı) */}
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <FeatureChip
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9" />
                        <path d="M21 3v9h-9" />
                      </svg>
                    }
                    text="Swipe keşfi"
                  />
                  <FeatureChip
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-800" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    }
                    text="Kaydet & düzenle"
                  />
                  <FeatureChip
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l1.2 5.1L18 9l-4.8 1.9L12 16l-1.2-5.1L6 9l4.8-1.9L12 2z" />
                      </svg>
                    }
                    text="Pinned yorum"
                  />
                  <FeatureChip
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                      </svg>
                    }
                    text="Zevk uyumu"
                  />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                  <GlassCTA href="/kayit">Ücretsiz kayıt</GlassCTA>
                  <GlassCTA href="/giris" variant="secondary">
                    Giriş
                  </GlassCTA>
                </div>
              </div>

              {/* ✅ ORTA: bullets yok → quick pill linkler */}
              <div className="md:col-span-4">
                <SoftTitle>KISA YOLLAR</SoftTitle>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                  <QuickPill
                    href="/forum"
                    title="Forum"
                    desc="Sorular, tartışmalar"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                      </svg>
                    }
                  />
                  <QuickPill
                    href="/blog"
                    title="Blog"
                    desc="İlham & içerik"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    }
                  />
                  <QuickPill
                    href="/ilanlar"
                    title="İlanlar"
                    desc="Yayınlanmış projeler"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    }
                  />
                  <QuickPill
                    href="/evlumba-tools"
                    title="Evlumba Tools"
                    desc="Çok yakında"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                    }
                  />
                  <QuickPill
                    href="/tasiniyorum"
                    title="Taşınıyorum"
                    desc="Çok yakında"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                      </svg>
                    }
                  />
                  <QuickPill
                    href="/kesfet"
                    title="Keşfet"
                    desc="Stil, oda, trend akışı"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 20l4-16" />
                        <path d="M6 8h8" />
                        <path d="M7 16h8" />
                      </svg>
                    }
                  />
                  <QuickPill
                    href="/tasarimcilar"
                    title="Tasarımcılar"
                    desc="Hızlı dönüş yapanlar"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
                      </svg>
                    }
                  />
                  <QuickPill
                    href="/oyun"
                    title="Keşfetme Oyunu"
                    desc="Zevkini 30 sn’de keskinleştir"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-700" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 7h10v10H7z" />
                        <path d="M9 3h6" />
                        <path d="M12 3v4" />
                      </svg>
                    }
                  />
                </div>
              </div>

              {/* ✅ SAĞ: Profesyoneller (korundu) */}
              <div className="md:col-span-3">
                <ProfessionalsCard />
              </div>
            </div>

            {/* bottom */}
            <div className="mt-10 border-t border-black/5 pt-6">
              <div className="flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <div>© {new Date().getFullYear()} Evlumba • Tüm hakları saklıdır.</div>
                <div className="flex items-center gap-4">
                  <Link className="hover:text-slate-700 transition" href="/sss">
                    SSS
                  </Link>
                  <Link className="hover:text-slate-700 transition" href="/iletisim">
                    İletişim
                  </Link>
                  <Link className="hover:text-slate-700 transition" href="/kullanim">
                    Kullanım
                  </Link>
                  <Link className="hover:text-slate-700 transition" href="/gizlilik">
                    Gizlilik
                  </Link>
                  <Link className="hover:text-slate-700 transition" href="/kvkk">
                    KVKK
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </GlassShell>

        <div className="mt-10 h-px w-full bg-black/5" aria-hidden="true" />
      </div>
    </footer>
  );
}
