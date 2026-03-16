// components/marketing/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const NAV = [
  { label: "Keşfet", href: "/kesfet" },
  { label: "Tasarımcılar", href: "/tasarimcilar" },
  { label: "Keşfetme Oyunu", href: "/oyun" },
  { label: "AI Matchmaker", href: "/ai-match" },
];

export default function Navbar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = q.trim();
    if (!value) return;
    router.push(`/kesfet?q=${encodeURIComponent(value)}`);
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-white/35 backdrop-blur supports-backdrop-filter:bg-white/25 border-b border-neutral-200/40">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur px-4 py-3 shadow-[0_10px_30px_-25px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white grid place-items-center font-semibold">
                  E
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-neutral-900">Evlumba</div>
                  <div className="text-[11px] text-neutral-500">
                    Keşfet • Kaydet • Eşleş
                  </div>
                </div>
              </Link>

              {/* Nav */}
              <nav className="hidden lg:flex items-center gap-5 text-sm text-neutral-700 ml-6">
                {NAV.map((x) => (
                  <Link key={x.href} href={x.href} className="hover:text-neutral-900">
                    {x.label}
                  </Link>
                ))}
              </nav>

              {/* Search (desktop) */}
              <form onSubmit={onSearch} className="ml-auto hidden md:flex items-center gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="tarz, oda, şehir, profesyonel…"
                  className="w-[320px] rounded-xl border border-neutral-200 bg-white/80 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
                <Button type="submit" variant="primary" className="px-4">
                  Ara
                </Button>
              </form>

              {/* Auth */}
              <div className="flex items-center gap-2 shrink-0">
                <Button href="/giris" variant="secondary">
                  Giriş
                </Button>
                <Button href="/kayit" variant="primary">
                  Ücretsiz kayıt
                </Button>
              </div>
            </div>

            {/* Search (mobile) */}
            <form onSubmit={onSearch} className="mt-3 md:hidden flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="tarz, oda, şehir, profesyonel…"
                className="flex-1 rounded-xl border border-neutral-200 bg-white/80 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
              <Button type="submit" variant="primary">
                Ara
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
