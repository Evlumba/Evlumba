"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Designer } from "../../_data/designers";
import {
  loadCollections,
  createCollection,
  toggleSaveToCollection,
} from "../../../../lib/collections";

const PRO_HAVUZU_NAME = "Profesyonel Havuzum";

/* ── Inline icons ────────────────────────────────────────────────────────── */

function IconChat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M7.5 17.5 4 20V6.7C4 5.2 5.2 4 6.7 4h10.6C18.8 4 20 5.2 20 6.7v7.6c0 1.5-1.2 2.7-2.7 2.7H7.5Z" />
      <path d="M8 8.6h8M8 12h6" strokeLinecap="round" />
    </svg>
  );
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 7a3 3 0 1 0-2.9-3.6A3 3 0 0 0 16 7ZM7 14a3 3 0 1 1 2.9-3.6A3 3 0 0 1 7 14Zm9 8a3 3 0 1 0-2.9-3.6A3 3 0 0 0 16 22Z" />
      <path d="M9.6 11.4 13.4 9M9.6 12.6 13.4 15" />
    </svg>
  );
}

function IconHeart({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 20.6s-7.4-4.4-9.3-8.5C1.2 9 3.2 6 6.4 5.4c1.8-.3 3.5.3 4.6 1.6l1 1.2 1-1.2c1.1-1.3 2.8-1.9 4.6-1.6C20.8 6 22.8 9 21.3 12.1c-1.9 4.1-9.3 8.5-9.3 8.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z" />
      <path d="M12 7.2V12l3.2 1.9" strokeLinecap="round" strokeLinejoin="round" />
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

function StarRating({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`h-4 w-4 ${i < filled ? "text-emerald-500" : "text-gray-300"}`} aria-hidden>
          <path fill="currentColor" d="M12 17.3l-5.9 3.4 1.6-6.7-5.2-4.5 6.9-.6L12 2.5l2.7 6.4 6.9.6-5.2 4.5 1.6 6.7L12 17.3z" />
        </svg>
      ))}
    </span>
  );
}

function responseShort(response?: string) {
  if (!response) return "24 saat";
  const match = response.match(/(\d+\s*(dk|saat|gün|dakika))/i);
  return match ? match[1] : response.replace(/^Genelde\s*/i, "");
}

/* ── Main component ──────────────────────────────────────────────────────── */

export default function ProfileHero({ designer }: { designer: Designer }) {
  const slug = designer.slug;
  const initials = (designer.name || "P")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const coverUrl = designer.coverUrl?.trim() || "";
  const avatarUrl = designer.avatarUrl?.trim() || "";
  const rating = Number(designer.rating ?? 0);
  const reviewCount = Number(designer.reviews ?? 0);
  const featured = Boolean(designer.verified);
  const starsFilled = Math.max(0, Math.min(5, Math.round(rating)));
  const subtitle = [designer.title, designer.city].filter(Boolean).join(" • ");

  const contactEmail = designer.business?.email ?? "";
  const phone = designer.business?.phone ?? "";
  const locationUrl = designer.business?.locationUrl ?? "";
  const showVerifyButton = contactEmail.includes("@mimarlar.evlumba.com");

  const hasBlogPosts = Number(designer.blogPostCount ?? 0) > 0;
  const blogHref = designer.liveDesignerId && hasBlogPosts ? `/blog?author=${encodeURIComponent(designer.liveDesignerId)}` : null;

  const savedKey = useMemo(() => `evlumba:savedDesigner:${slug}`, [slug]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const liveId = designer.liveDesignerId as string | undefined;
    if (!liveId) {
      try { setSaved(localStorage.getItem(savedKey) === "1"); } catch {}
      return;
    }
    loadCollections().then((state) => {
      const proHavuzu = state.collections.find((c) => c.name === PRO_HAVUZU_NAME);
      setSaved(proHavuzu?.itemIds.includes(liveId) ?? false);
    }).catch(() => {
      try { setSaved(localStorage.getItem(savedKey) === "1"); } catch {}
    });
  }, [savedKey, designer.liveDesignerId]);

  const onWriteReview = () => {
    document.getElementById("yorumlar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && "share" in navigator && typeof navigator.share === "function") {
        await navigator.share({ title: designer.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      alert("Link kopyalandı ✅");
    } catch {}
  };

  const onToggleSave = async () => {
    const liveId = designer.liveDesignerId as string | undefined;
    if (!liveId) {
      try {
        const next = !saved;
        setSaved(next);
        localStorage.setItem(savedKey, next ? "1" : "0");
      } catch {}
      return;
    }
    setSaved((v) => !v);
    try {
      const state = await loadCollections();
      let proHavuzu = state.collections.find((c) => c.name === PRO_HAVUZU_NAME);
      if (!proHavuzu) proHavuzu = await createCollection(PRO_HAVUZU_NAME);
      await toggleSaveToCollection(proHavuzu.id, liveId);
    } catch {
      setSaved((v) => !v);
    }
  };

  const pill = "rounded-full bg-gradient-to-b from-white to-gray-50/80 shadow-sm ring-1 ring-black/[0.06] cursor-pointer";
  const btn = `${pill} inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:ring-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10`;

  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_20px_60px_-28px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.03)]">

        {/* ── Green gradient header band ──────────────────────────────── */}
        <div className="relative h-40 sm:h-48 md:h-56 w-full overflow-hidden">
          {coverUrl ? (
            <Image src={coverUrl} alt={`${designer.name} cover`} fill priority className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a5c3a] via-[#2d7a50] to-[#3a9466]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>

        {/* ── Content area ────────────────────────────────────────────── */}
        <div className="relative bg-white px-6 pb-8 pt-0 md:px-10 md:pb-10">

          {/* Grid: Left info / Right actions */}
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">

            {/* ── LEFT: Avatar + Info + Stats ──────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Avatar + Name row */}
              <div className="flex items-end gap-5 -mt-14 md:-mt-16">
                {/* Avatar */}
                <div className="shrink-0">
                  <div className="relative h-24 w-24 md:h-28 md:w-28 overflow-hidden rounded-2xl bg-white ring-[5px] ring-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.3)]">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={designer.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a5c3a] to-[#2d7a50] text-xl font-bold text-white/90">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name + subtitle */}
                <div className="min-w-0 pb-1">
                  <h1 className="text-[1.75rem] md:text-[2.25rem] leading-[1.1] font-[800] uppercase tracking-[0.12em] text-gray-900" style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif", fontFeatureSettings: "'liga' 1, 'kern' 1" }}>
                    <span className="bg-gradient-to-r from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
                      {designer.name}
                    </span>
                    <span className="mt-1 block h-[2px] w-12 bg-gradient-to-r from-[#1a5c3a] via-[#2d7a50] to-transparent rounded-full" />
                  </h1>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm md:text-base text-gray-500">
                    {featured && (
                      <svg viewBox="0 0 20 20" className="h-4 w-4 text-emerald-500" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    )}
                    {subtitle}
                  </p>
                </div>
              </div>

              {/* Badges row */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {featured && (
                  <span className={`${pill} inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-amber-50 to-orange-50 ring-amber-200/60 text-amber-900`}>
                    <IconSparkle className="h-4 w-4 text-amber-500" />
                    Öne Çıkan
                  </span>
                )}
                <span className={`${pill} inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-b from-emerald-50 to-white ring-emerald-200/60`}>
                  <IconClock className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">{`Genelde ${responseShort(designer.response)} içinde dönüş`}</span>
                </span>
              </div>

              {/* ── Stat cards ─────────────────────────────────────────── */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {/* Rating card */}
                <div className="rounded-2xl border border-black/[0.06] bg-gradient-to-b from-white to-gray-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500" fill="currentColor">
                      <path d="M12 17.3l-5.9 3.4 1.6-6.7-5.2-4.5 6.9-.6L12 2.5l2.7 6.4 6.9.6-5.2 4.5 1.6 6.7L12 17.3z" />
                    </svg>
                    <span className="text-2xl font-bold text-gray-900">{rating.toFixed(1)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{reviewCount} Yorum</p>
                  <div className="mt-1.5">
                    <StarRating filled={starsFilled} />
                  </div>
                </div>

                {/* Response time card */}
                <div className="rounded-2xl border border-black/[0.06] bg-gradient-to-b from-white to-gray-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <IconClock className="h-5 w-5 text-emerald-500" />
                    <span className="text-2xl font-bold text-gray-900">{responseShort(designer.response)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">içinde</p>
                  <p className="text-xs text-gray-400">Genelde dönüş</p>
                </div>

              </div>

              {/* ── Write review bar ──────────────────────────────────── */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onWriteReview}
                  className={`${pill} cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-800 bg-gradient-to-b from-emerald-50 to-white ring-emerald-200/60 hover:bg-emerald-50 transition-colors`}
                >
                  <IconChat className="h-5 w-5 text-emerald-600" />
                  Yorum Yaz
                </button>
                <StarRating filled={0} />
              </div>
            </div>

            {/* ── RIGHT: Action buttons ────────────────────────────────── */}
            <div className="flex flex-col gap-2.5 lg:w-56 lg:pt-6 shrink-0">
              {/* Primary: Mesaj Gönder */}
              {designer.liveDesignerId ? (
                <Link
                  href={`/messages?designer=${encodeURIComponent(designer.liveDesignerId)}`}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#1a5c3a] to-[#145230] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(26,92,58,0.5)] ring-1 ring-white/10 hover:from-[#1e6b44] hover:to-[#185d39] transition-colors"
                >
                  <IconChat className="h-5 w-5" />
                  Mesaj Gönder
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-200 px-5 py-3.5 text-sm font-bold text-gray-400 cursor-not-allowed"
                >
                  <IconChat className="h-5 w-5" />
                  Mesaj Gönder
                </button>
              )}

              {/* Phone */}
              {phone ? (
                <span className={`${pill} inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700`}>
                  <IconPhone className="h-4 w-4 text-gray-500" />
                  {phone}
                </span>
              ) : null}

              {/* Konum */}
              {locationUrl ? (
                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${pill} inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors`}
                >
                  <IconMapPin className="h-4 w-4 text-emerald-600" />
                  Konumu Aç
                </a>
              ) : null}

              {/* Kaydet + Paylaş row */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onToggleSave}
                  aria-pressed={saved}
                  className={[
                    "flex-1 cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold shadow-sm ring-1 transition-colors",
                    saved
                      ? "bg-gradient-to-b from-rose-50 to-white text-rose-700 ring-rose-200/70 hover:bg-rose-50"
                      : "bg-gradient-to-b from-white to-gray-50 text-gray-700 ring-black/[0.06] hover:bg-gray-50",
                  ].join(" ")}
                >
                  <IconHeart className={`h-4 w-4 ${saved ? "text-rose-600" : "text-gray-500"}`} filled={saved} />
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => void onShare()}
                  className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-white to-gray-50 px-3 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/[0.06] hover:bg-gray-50 transition-colors"
                >
                  <IconShare className="h-4 w-4 text-gray-500" />
                  Paylaş
                </button>
              </div>

              {/* Blog */}
              {blogHref ? (
                <Link href={blogHref} className={`${btn} justify-center rounded-2xl`}>
                  Blog&apos;a Git
                </Link>
              ) : null}

              {/* Hesabı Doğrula */}
              {showVerifyButton ? (
                <Link
                  href={`/dogrulama?name=${encodeURIComponent(designer.name)}&url=${encodeURIComponent(`https://www.evlumba.com/tasarimcilar/${slug}`)}`}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-sky-50 to-white px-4 py-3 text-sm font-semibold text-sky-800 shadow-sm ring-1 ring-sky-200/60 hover:bg-sky-50 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Hesabı Doğrula
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="h-6 md:h-8" />
    </section>
  );
}
