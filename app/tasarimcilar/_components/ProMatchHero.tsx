"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type RoomChip = { id: string; label: string; emoji: string };

function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

function MiniIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur",
        className
      )}
    >
      {children}
    </span>
  );
}

function Step({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <MiniIcon>{icon}</MiniIcon>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-white">{label}</div>
        {sub ? <div className="text-xs text-white/65">{sub}</div> : null}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-white/25 bg-white text-neutral-900 shadow-sm"
          : "border-white/15 bg-white/10 text-white hover:bg-white/15"
      )}
    >
      {children}
    </button>
  );
}

export default function ProMatchHero() {
  const router = useRouter();
  const sp = useSearchParams();

  const cities = useMemo(() => ["İstanbul", "İzmir", "Ankara"], []);
  const rooms = useMemo<RoomChip[]>(
    () => [
      { id: "mutfak", label: "Mutfak", emoji: "🍳" },
      { id: "banyo", label: "Banyo", emoji: "🛁" },
      { id: "salon", label: "Salon", emoji: "🛋️" },
      { id: "yatak-odasi", label: "Yatak Odası", emoji: "🛏️" },
      { id: "ev-ofisi", label: "Ev Ofisi", emoji: "💻" },
      { id: "balkon", label: "Balkon", emoji: "🌿" },
      { id: "antre", label: "Antre", emoji: "🚪" },
      { id: "cocuk", label: "Çocuk", emoji: "🧸" },
    ],
    []
  );

  const initialCity = sp.get("city") ?? "İstanbul";
  const initialRoom = sp.get("room") ?? "salon";

  const [city, setCity] = useState<string>(
    cities.includes(initialCity) ? initialCity : "İstanbul"
  );
  const [room, setRoom] = useState<string>(
    rooms.some((r) => r.id === initialRoom) ? initialRoom : "salon"
  );

  const startMatch = () => {
    const q = new URLSearchParams();
    q.set("mode", "match");
    q.set("city", city);
    q.set("room", room);
    router.push(`/kesfet?${q.toString()}`);
  };

  const jumpToList = () => {
    const el = document.getElementById("tasarimci-list");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_18px_60px_-40px_rgba(0,0,0,0.35)]">
        {/* Background */}
        <div className="absolute inset-0 bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.14),transparent_40%),radial-gradient(circle_at_80%_40%,rgba(16,185,129,0.18),transparent_48%),radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[28px_28px]" />

        <div className="relative px-5 py-6 md:px-8 md:py-10 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            {/* Left */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Login yok • 60 sn
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Tarzını seç. Tasarımcını bul.
              </h1>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Step
                  label="Seç"
                  sub="oda + şehir"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 7h16M4 12h10M4 17h16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  }
                />
                <Step
                  label="Beğen"
                  sub="hızlı karar"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 21s-7-4.35-9.5-8.5C.5 9.5 2.5 6.5 6 6.5c1.8 0 3.1 1 4 2.2 0.9-1.2 2.2-2.2 4-2.2 3.5 0 5.5 3 3.5 6.0C19 16.65 12 21 12 21z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                />
                <Step
                  label="Eşleş"
                  sub="3 aday"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                />
              </div>

              {/* Room chips row (Houzz "project type" hissi ama Evlumba dili) */}
              <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {rooms.map((r) => (
                  <Pill
                    key={r.id}
                    active={room === r.id}
                    onClick={() => setRoom(r.id)}
                  >
                    <span className="mr-1">{r.emoji}</span>
                    {r.label}
                  </Pill>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="w-full md:w-105">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="text-xs font-medium text-white/70">
                  Şehir seç
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <Pill
                      key={c}
                      active={city === c}
                      onClick={() => setCity(c)}
                    >
                      {c}
                    </Pill>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={startMatch}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-white/90"
                  >
                    Hızlı Eşleş
                  </button>
                  <button
                    type="button"
                    onClick={jumpToList}
                    className="inline-flex items-center justify-center rounded-xl border border-white/18 bg-white/0 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                  >
                    Listeyi Gör
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                  <span>Seçimlerin listeyi rafine eder.</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1">
                    3 aday
                  </span>
                </div>
              </div>

              {/* tiny “trust” strip (copy yok, sadece sinyal) */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-white/70">
                <div className="rounded-xl border border-white/10 bg-white/5 py-2">
                  Portfolyo
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 py-2">
                  Beğeni
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 py-2">
                  Hızlı DM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
