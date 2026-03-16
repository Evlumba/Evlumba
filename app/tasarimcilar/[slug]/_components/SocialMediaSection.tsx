"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Designer } from "../../_data/designers";

type InstagramPost = {
  id: string;
  shortcode: string;
  postUrl: string;
  imageUrl: string;
  caption: string;
  takenAt: number;
};

type InstagramFeedResponse = {
  ok: boolean;
  username?: string;
  profileUrl?: string;
  posts?: InstagramPost[];
  error?: string;
};

function normalizeInstagramUsername(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (raw.includes("instagram.com")) {
    try {
      const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      const firstPath = parsed.pathname
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)[0];
      return (firstPath ?? "").replace(/^@+/, "");
    } catch {
      return "";
    }
  }

  return raw.replace(/^@+/, "");
}

function formatPostDate(epochSeconds: number) {
  if (!epochSeconds) return "";
  const date = new Date(epochSeconds * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toProxyImageUrl(rawUrl: string) {
  const value = String(rawUrl ?? "").trim();
  if (!value) return "";
  return `/api/public/instagram/image?url=${encodeURIComponent(value)}`;
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

export default function SocialMediaSection({ designer }: { designer: Designer }) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const rawInstagram = designer.business?.socials?.instagram ?? "";
  const username = useMemo(() => normalizeInstagramUsername(rawInstagram), [rawInstagram]);
  const profileUrl = username ? `https://www.instagram.com/${encodeURIComponent(username)}/` : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [visible, setVisible] = useState(false);

  // COST-FIX: Only fetch Instagram when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    async function loadFeed() {
      if (!username) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/public/instagram/feed?username=${encodeURIComponent(username)}`, {
          // COST-FIX: removed cache: "no-store" - API route already has ISR
        });

        const json = (await res.json()) as InstagramFeedResponse;
        if (!res.ok || !json.ok) {
          if (!cancelled) {
            setError(json.error || "Instagram gönderileri yüklenemedi.");
            setPosts([]);
          }
          return;
        }

        if (!cancelled) {
          setPosts(Array.isArray(json.posts) ? json.posts.slice(0, 5) : []);
        }
      } catch {
        if (!cancelled) {
          setError("Instagram gönderileri yüklenemedi.");
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFeed();
    return () => {
      cancelled = true;
    };
  }, [visible, username]);

  if (!username) return null;

  const scrollByAmount = (direction: "left" | "right") => {
    const slider = sliderRef.current;
    if (!slider) return;
    const amount = Math.max(260, Math.floor(slider.clientWidth * 0.8));
    slider.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section id="sosyal-medya" className="scroll-mt-16" ref={sectionRef}>
      <div className="mx-auto mt-8 max-w-6xl px-4">
        <div className="rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.18)]">
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                  <IconInstagram className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Sosyal Medya</h2>
                  <p className="text-xs text-gray-500">@{username} son 5 paylaşım</p>
                </div>
              </div>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Ziyaret Et
              </a>
            </div>

            {loading ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : error ? (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : posts.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">Henüz gösterilecek bir Instagram paylaşımı bulunamadı.</p>
            ) : (
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => scrollByAmount("left")}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByAmount("right")}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    →
                  </button>
                </div>

                <div
                  ref={sliderRef}
                  className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {posts.map((post) => (
                    <a
                      key={post.id}
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group snap-start"
                    >
                      <article className="w-[210px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]">
                        <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                          <img
                            src={toProxyImageUrl(post.imageUrl)}
                            alt={post.caption || `${designer.name} Instagram paylaşımı`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="space-y-1 p-3">
                          <p className="text-xs font-semibold text-gray-700">{formatPostDate(post.takenAt)}</p>
                          <p className="line-clamp-2 text-xs leading-5 text-gray-500">
                            {post.caption || "Instagram paylaşımını görüntüle"}
                          </p>
                        </div>
                      </article>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
