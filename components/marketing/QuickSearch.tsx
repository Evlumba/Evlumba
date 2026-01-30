"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";

const SUGGESTIONS = [
  "Modern salon",
  "Bohem yatak odası",
  "Küçük banyo",
  "Minimal mutfak",
  "Japandi",
  "TV ünitesi",
  "Aydınlatma",
  "Çocuk odası",
  "Antre",
  "Balkon",
];

const CATEGORIES = [
  "Salon",
  "Mutfak",
  "Yatak Odası",
  "Banyo",
  "Çocuk Odası",
  "Antre",
  "Balkon",
];

export default function QuickSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return SUGGESTIONS.slice(0, 8);
    return SUGGESTIONS.filter((s) => s.toLowerCase().includes(t)).slice(0, 8);
  }, [q]);

  function go(search: string) {
    const value = search.trim();
    if (!value) return;
    router.push(`/kesfet?q=${encodeURIComponent(value)}`);
  }

  return (
    <Card className="p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <label className="text-xs font-semibold text-neutral-700">
            Hızlı Arama
          </label>

          <div className="mt-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") go(q);
              }}
              placeholder="Örn: Modern salon, küçük banyo, Japandi…"
              className="w-full rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
            />

            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Chip key={c} onClick={() => go(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="md:w-44">
          <Button className="w-full" onClick={() => go(q)} variant="primary">
            Keşfet
          </Button>
          <Button className="w-full mt-2" href="/ai-match" variant="secondary">
            AI ile Bul
          </Button>
        </div>
      </div>

      <div className="mt-4 border-t border-neutral-200/70 pt-4">
        <div className="text-xs font-semibold text-neutral-700">Öneriler</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {filtered.map((s) => (
            <Chip key={s} onClick={() => go(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>
    </Card>
  );
}
