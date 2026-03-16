"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Designer } from "../../_data/designers";

/** Rounded + modern icons (stroke style) */
function IconChat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M7.5 17.5 4 20V6.7C4 5.2 5.2 4 6.7 4h10.6C18.8 4 20 5.2 20 6.7v7.6c0 1.5-1.2 2.7-2.7 2.7H7.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 8.6h8M8 12h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M16 7a3 3 0 1 0-2.9-3.6A3 3 0 0 0 16 7ZM7 14a3 3 0 1 1 2.9-3.6A3 3 0 0 1 7 14Zm9 8a3 3 0 1 0-2.9-3.6A3 3 0 0 0 16 22Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.6 11.4 13.4 9M9.6 12.6 13.4 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBlog({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 9h8M8 13h8M8 17h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHeart({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) {
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

function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7.2V12l3.2 1.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 2l1.3 4.4L18 8l-4.7 1.6L12 14l-1.3-4.4L6 8l4.7-1.6L12 2Z"
        fill="currentColor"
      />
      <path
        d="M19 13l.7 2.4L22 16l-2.3.6L19 19l-.7-2.4L16 16l2.3-.6L19 13Z"
        fill="currentColor"
        opacity=".55"
      />
    </svg>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${
        filled
          ? "text-amber-500 drop-shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          : "text-amber-200"
      }`}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 17.3l-5.9 3.4 1.6-6.7-5.2-4.5 6.9-.6L12 2.5l2.7 6.4 6.9.6-5.2 4.5 1.6 6.7L12 17.3z"
      />
    </svg>
  );
}

function responseLabel(response?: string) {
  if (!response) return "Genelde 24 saat içinde dönüş";
  if (response.startsWith("Genelde ")) return response;
  return `Genelde ${response}`;
}

export default function ProfileHero({ designer }: { designer: Designer }) {
  const slug = designer.slug;
  const initials = (designer.name || "P")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const coverUrl = designer.coverUrl?.trim() || "";

  const avatarUrl = designer.avatarUrl?.trim() || "";

  const rating = Number(designer.rating ?? 0);
  const reviewCount = Number(designer.reviews ?? 0);
  const featured = Boolean(designer.verified);
  const starsFilled = Math.max(0, Math.min(5, Math.round(rating)));

  const savedKey = useMemo(() => `evlumba:savedDesigner:${slug}`, [slug]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      setSaved(localStorage.getItem(savedKey) === "1");
    } catch {}
  }, [savedKey]);

  const onWriteReview = () => {
    document
      .getElementById("yorumlar")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const onToggleSave = () => {
    try {
      const next = !saved;
      setSaved(next);
      localStorage.setItem(savedKey, next ? "1" : "0");
    } catch {}
  };

  const subtitle = [designer.title, designer.city].filter(Boolean).join(" • ");
  const hasBlogPosts = Number(designer.blogPostCount ?? 0) > 0;
  const blogHref = designer.liveDesignerId && hasBlogPosts ? `/blog?author=${encodeURIComponent(designer.liveDesignerId)}` : null;

  /** THE “frame” you loved (rating chip) */
  const frame =
    "rounded-full bg-gradient-to-b from-white to-gray-50 shadow-sm ring-1 ring-black/5";

  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.03)]">
        {/* Cover */}
        <div className="relative h-56 sm:h-64 md:h-80 w-full overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`${designer.name} cover`}
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-100" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/15 via-transparent to-transparent" />
        </div>

        {/* White area */}
        <div className="bg-white px-6 py-10 md:px-10 md:py-14">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            {/* SOL: Avatar + İsim/Badge + Rating/Yorum */}
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="relative h-24 w-24 md:h-28 md:w-28 overflow-hidden rounded-full bg-white ring-4 ring-white shadow-[0_18px_50px_-28px_rgba(0,0,0,0.45)]">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={`${designer.name} avatar`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
                      {initials}
                    </div>
                  )}
                </div>
              </div>

              {/* İsim + Badge + Rating */}
              <div className="min-w-0">
                {/* İsim ve Badge */}
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
                    {designer.name}
                  </h1>

                  {featured && (
                    <span
                      className={[
                        frame,
                        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold",
                        "bg-linear-to-r from-amber-50 to-orange-50 ring-amber-200/60",
                        "text-amber-900 shadow-[0_12px_26px_-18px_rgba(245,158,11,0.55)]",
                      ].join(" ")}
                    >
                      <IconSparkle className="h-4 w-4 text-amber-500" />
                      Öne Çıkan
                    </span>
                  )}
                </div>

                {/* Alt başlık */}
                <p className="mt-0.5 text-sm md:text-base text-gray-500">{subtitle}</p>

                {/* Rating ve Response chips */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={[frame, "inline-flex items-center gap-2 px-3.5 py-2"].join(" ")}>
                    <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} filled={i < starsFilled} />
                      ))}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">({reviewCount})</span>
                  </span>

                  <span
                    className={[
                      frame,
                      "inline-flex items-center gap-2 px-3.5 py-2",
                      "bg-linear-to-b from-emerald-50 to-white",
                      "ring-emerald-200/60",
                    ].join(" ")}
                  >
                    <IconClock className="h-4.5 w-4.5 text-emerald-700" />
                    <span className="text-sm font-semibold text-emerald-800">
                      {responseLabel(designer.response)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* SAĞ: Butonlar */}
            <div className="flex items-center gap-2 md:self-start md:mt-2">
              {designer.liveDesignerId ? (
                <Link
                  href={`/messages?designer=${encodeURIComponent(designer.liveDesignerId)}`}
                  className={[
                    frame,
                    "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700",
                    "hover:bg-gray-50 hover:ring-black/10 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
                  ].join(" ")}
                >
                  <IconChat className="h-5 w-5 text-gray-600" />
                  Mesaj
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className={[
                    frame,
                    "inline-flex cursor-not-allowed items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-400",
                  ].join(" ")}
                >
                  <IconChat className="h-5 w-5 text-gray-400" />
                  Mesaj
                </button>
              )}

              {blogHref ? (
                <Link
                  href={blogHref}
                  className={[
                    frame,
                    "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700",
                    "hover:bg-gray-50 hover:ring-black/10 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
                  ].join(" ")}
                >
                  <IconBlog className="h-5 w-5 text-gray-600" />
                  Blog&apos;a Git
                </Link>
              ) : null}

              <button
                type="button"
                onClick={onWriteReview}
                className={[
                  frame,
                  "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700",
                  "hover:bg-gray-50 hover:ring-black/10 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
                ].join(" ")}
              >
                <IconChat className="h-5 w-5 text-gray-600" />
                Yorum yaz
              </button>

              <button
                type="button"
                onClick={onShare}
                className={[
                  frame,
                  "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700",
                  "hover:bg-gray-50 hover:ring-black/10 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
                ].join(" ")}
              >
                <IconShare className="h-5 w-5 text-gray-600" />
                Paylaş
              </button>

              <button
                type="button"
                onClick={onToggleSave}
                aria-pressed={saved}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm ring-1 transition-colors",
                  saved
                    ? "bg-linear-to-b from-rose-50 to-white text-rose-700 ring-rose-200/70 hover:bg-rose-50"
                    : "bg-linear-to-b from-white to-gray-50 text-gray-700 ring-black/5 hover:bg-gray-50 hover:ring-black/10",
                  "focus-visible:outline-none focus-visible:ring-2",
                  saved ? "focus-visible:ring-rose-200" : "focus-visible:ring-black/10",
                ].join(" ")}
              >
                <IconHeart className={`h-5 w-5 ${saved ? "text-rose-600" : "text-gray-600"}`} filled={saved} />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-6 md:h-8" />
    </section>
  );
}
