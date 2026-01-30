"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { Designer } from "../_data/designers";
import {
  ArrowLeft,
  BadgeCheck,
  Heart,
  Share2,
  MapPin,
  Timer,
  Star,
  MessageCircle,
  Images,
  Sparkles,
} from "lucide-react";

const shell: CSSProperties = {
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 26px 90px rgba(15,23,42,0.14)",
  backdropFilter: "blur(18px)",
};

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.74)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 18px 55px rgba(15,23,42,0.10)",
  backdropFilter: "blur(16px)",
};

const darkPill: CSSProperties = {
  background: "rgba(0,0,0,0.24)",
  boxShadow: "0 0 0 1px rgba(255,255,255,0.14)",
  backdropFilter: "blur(12px)",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return letters.join("") || "E";
}

export default function ProfileHeader({ designer }: { designer: Designer }) {
  const avatarSrc = designer.avatarUrl || designer.coverUrl || "";
  const showAvatarImg = Boolean(designer.avatarUrl || designer.coverUrl);

  return (
    <section className="mt-6 overflow-x-clip">
      <div className="relative overflow-hidden rounded-[28px]" style={shell}>
        {/* glow */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -top-28 left-10 h-72 w-72 rounded-full bg-[rgba(16,185,129,0.14)] blur-3xl" />
          <div className="absolute -bottom-28 right-10 h-80 w-80 rounded-full bg-[rgba(99,102,241,0.12)] blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_10%_10%,rgba(255,255,255,0.92),transparent_60%)]" />
        </div>

        {/* cover */}
        <div className="relative z-10">
          <div className="relative h-56 md:h-80">
            {designer.coverUrl ? (
              <img
                src={designer.coverUrl}
                alt={designer.name}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(800px_circle_at_20%_10%,rgba(16,185,129,0.25),transparent_55%),radial-gradient(900px_circle_at_80%_20%,rgba(99,102,241,0.22),transparent_55%),linear-gradient(135deg,rgba(15,23,42,0.10),rgba(255,255,255,0.70))]" />
            )}

            {/* overlay for readability */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/12 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_20%_10%,rgba(255,255,255,0.16),transparent_55%)]" />

            {/* top controls */}
            <div className="absolute left-4 top-4 right-4 flex items-center justify-between gap-3">
              <Link
                href="/tasarimcilar#liste"
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white/95"
                style={darkPill}
              >
                <ArrowLeft className="h-4 w-4" />
                Tasarımcılara dön
              </Link>

              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white/95"
                  style={darkPill}
                >
                  <Heart className="h-4 w-4 opacity-90" />
                  Kaydet
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white/95"
                  style={darkPill}
                >
                  <Share2 className="h-4 w-4 opacity-90" />
                  Paylaş
                </button>
              </div>
            </div>
          </div>

          {/* identity card overlaps cover (LinkedIn/Houzz vibe) */}
          <div className="relative -mt-14 md:-mt-16 px-4 pb-5 md:pb-6">
            <div className="rounded-[28px] p-5 md:p-6" style={glass}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* left: avatar + info */}
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    {/* avatar */}
                    <div className="shrink-0">
                      <div
                        className="relative h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-2xl"
                        style={{
                          boxShadow:
                            "0 0 0 1px rgba(15,23,42,0.10), 0 20px 60px rgba(15,23,42,0.18)",
                          background:
                            "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(99,102,241,0.14), rgba(255,255,255,0.78))",
                        }}
                      >
                        {showAvatarImg ? (
                          <img
                            src={avatarSrc}
                            alt={`${designer.name} avatar`}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center">
                            <span className="text-xl md:text-2xl font-semibold text-[rgba(15,23,42,0.82)]">
                              {initials(designer.name)}
                            </span>
                          </div>
                        )}

                        {/* tiny shine */}
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70px_circle_at_25%_20%,rgba(255,255,255,0.40),transparent_55%)]" />
                      </div>
                    </div>

                    {/* main text */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl md:text-3xl font-semibold text-[#0f172a] truncate">
                          {designer.name}
                        </h1>

                        {designer.verified ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(99,102,241,0.10), rgba(255,255,255,0.82))",
                              boxShadow: "0 0 0 1px rgba(15,23,42,0.08)",
                              backdropFilter: "blur(12px)",
                            }}
                          >
                            <BadgeCheck className="h-4 w-4 opacity-75" />
                            Doğrulanmış
                          </span>
                        ) : null}

                        {designer.startingFrom ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              background: "rgba(255,255,255,0.70)",
                              boxShadow: "0 0 0 1px rgba(15,23,42,0.06)",
                              backdropFilter: "blur(10px)",
                              color: "rgba(15,23,42,0.78)",
                            }}
                          >
                            <Sparkles className="h-4 w-4 opacity-70" />
                            {designer.startingFrom} başlangıç
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1 text-sm text-[rgba(15,23,42,0.62)]">
                        {designer.title}
                      </div>

                      {/* meta pills */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs" style={glass}>
                          <Star className="h-4 w-4 opacity-70" />
                          <span className="font-semibold">{designer.rating.toFixed(1)}</span>
                          <span className="opacity-40">•</span>
                          <span className="text-[rgba(15,23,42,0.65)]">{designer.reviews} yorum</span>
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs" style={glass}>
                          <MapPin className="h-4 w-4 opacity-70" />
                          {designer.city}
                        </span>

                        {designer.response ? (
                          <span className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs" style={glass}>
                            <Timer className="h-4 w-4 opacity-70" />
                            {designer.response}
                          </span>
                        ) : null}

                        {typeof designer.portfolioCount === "number" ? (
                          <span className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs" style={glass}>
                            <Images className="h-4 w-4 opacity-70" />
                            {designer.portfolioCount} proje
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* right: CTAs (not sticky) */}
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button
                    className="rounded-2xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-px active:translate-y-0"
                    style={{
                      ...glass,
                      background:
                        "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(99,102,241,0.12), rgba(255,255,255,0.86))",
                      boxShadow:
                        "0 0 0 1px rgba(15,23,42,0.10), 0 16px 44px rgba(15,23,42,0.12)",
                    }}
                  >
                    Teklif al
                  </button>

                  <button
                    className="rounded-2xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-px active:translate-y-0"
                    style={glass}
                  >
                    <span className="inline-flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 opacity-70" />
                      Mesaj
                    </span>
                  </button>
                </div>
              </div>

              {/* optional: tags row (tiny, premium) */}
              {Array.isArray(designer.tags) && designer.tags.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {designer.tags.slice(0, 5).map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-[rgba(15,23,42,0.76)]"
                      style={{
                        background: "rgba(255,255,255,0.70)",
                        boxShadow: "0 0 0 1px rgba(15,23,42,0.06)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white/40" />
      </div>
    </section>
  );
}
