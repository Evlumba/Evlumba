"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = { id: string; label: string };

export default function ProfileSectionNav({
  showSocialMedia = false,
}: {
  showSocialMedia?: boolean;
}) {
  const tabs: Tab[] = useMemo(() => {
    const baseTabs: Tab[] = [
      { id: "hakkinda", label: "Hakkında" },
      { id: "projeler", label: "Projeler" },
    ];
    if (showSocialMedia) {
      baseTabs.push({ id: "sosyal-medya", label: "Sosyal Medya" });
    }
    baseTabs.push(
      { id: "is", label: "İşletme" },
      { id: "yorumlar", label: "Yorumlar" },
      { id: "blog", label: "Blog" }
    );
    return baseTabs;
  }, [showSocialMedia]);

  const [active, setActive] = useState<string>(tabs[0]?.id ?? "hakkinda");

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const els = tabs
      .map((t) => document.getElementById(t.id))
      .filter(Boolean) as HTMLElement[];

    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
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
        root: null,
        rootMargin: "-140px 0px -55% 0px",
        threshold: [0.15, 0.25, 0.35],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [tabs]);

  return (
    <div className="mx-auto mt-6 max-w-6xl px-4">
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
