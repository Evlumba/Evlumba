"use client";
function IconTrophy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M8 4h8v3a4 4 0 0 1-8 0V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 18h4M9 21h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 6H5.8A2.8 2.8 0 0 0 3 8.8V9a4 4 0 0 0 4 4h1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 6h2.2A2.8 2.8 0 0 1 21 8.8V9a4 4 0 0 1-4 4h-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHammer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M14.2 4.6 19.4 9.8M8.7 6.7l8.6 8.6M6 9.5l3-3 3.4 3.4-3 3L6 9.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.6 20.4 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M12 2l1.3 4.4L18 8l-4.7 1.6L12 14l-1.3-4.4L6 8l4.7-1.6L12 2Z" fill="currentColor" />
      <path d="M19 13l.7 2.4L22 16l-2.3.6L19 19l-.7-2.4L16 16l2.3-.6L19 13Z" fill="currentColor" opacity=".55" />
    </svg>
  );
}

function BadgeIcon({ kind, className }: { kind: "trophy" | "hammer" | "sparkle"; className?: string }) {
  if (kind === "trophy") return <IconTrophy className={className} />;
  if (kind === "hammer") return <IconHammer className={className} />;
  return <IconSparkle className={className} />;
}


import { useEffect, useMemo, useState } from "react";

type Tab = { id: string; label: string };

export default function ProfileSectionNav() {
  const tabs: Tab[] = useMemo(
    () => [
      { id: "hakkinda", label: "Hakkında" },
      { id: "projeler", label: "Projeler" },
      { id: "is", label: "İşletme" },
      { id: "yorumlar", label: "Yorumlar" },
    ],
    []
  );
  const badges = useMemo(
  () => [
    { key: "award", label: "Ödüllü Tasarımcı", icon: "trophy" as const },
    { key: "custom", label: "Özel İş Alır", icon: "hammer" as const },
    { key: "best", label: "15x Houzz Best", icon: "sparkle" as const },
  ],
  []
);


  const [active, setActive] = useState<string>(tabs[0]?.id ?? "hakkinda");

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Scroll-spy: hangi section ekranda ise onu active yap
  useEffect(() => {
    const els = tabs
      .map((t) => document.getElementById(t.id))
      .filter(Boolean) as HTMLElement[];

    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // Görünenler içinden en üsttekine yakın olanı seç
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).getBoundingClientRect().top -
              (b.target as HTMLElement).getBoundingClientRect().top
          )[0];

        if (visible?.target?.id) setActive(visible.target.id);
      },
      {
        // Sticky header + bu nav yüzünden üstten pay bırakıyoruz
        root: null,
        rootMargin: "-140px 0px -55% 0px",
        threshold: [0.15, 0.25, 0.35],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [tabs]);

  return (
    <div className="mx-auto max-w-6xl px-4 mt-6">
      {/* Houzz vari: ince çizgi + aktif sekmede underline */}
      <div className="rounded-2xl border border-black/5 bg-white/70 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((t) => {
            const isActive = active === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => scrollTo(t.id)}
                className={[
                  "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                  "text-gray-600 hover:text-gray-900",
                  isActive ? "text-gray-900" : "",
                ].join(" ")}
              >
                {t.label}
                <span
                  className={[
                    "absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full transition",
                    isActive ? "bg-gray-900" : "bg-transparent",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
