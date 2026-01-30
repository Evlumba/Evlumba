"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Tab = { id: string; label: string };

export default function StickyTabs({ tabs }: { tabs: Tab[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const initial = sp.get("tab") || tabs[0]?.id || "genel";
  const [active, setActive] = useState(initial);

  const setTab = (id: string) => {
    setActive(id);
    const next = new URLSearchParams(sp.toString());
    next.set("tab", id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });

    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    // scroll -> active tab
    const ids = tabs.map((t) => t.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0.01, 0.1, 0.25] }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tabs]);

  return (
    <div className="sticky top-21 z-40 -mx-4 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur-xl shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 overflow-x-auto px-2 py-2">
            {tabs.map((t) => {
              const is = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition"
                  style={{
                    background: is ? "rgba(16,185,129,0.14)" : "transparent",
                    color: is ? "rgba(15,23,42,0.92)" : "rgba(15,23,42,0.62)",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
