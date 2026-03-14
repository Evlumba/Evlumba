"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import type { Designer, PortfolioItem } from "../../../../_data/designers";

function toValidImageSrc(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function sanitizeImageList(values: unknown) {
  if (!Array.isArray(values)) return [];
  const clean: string[] = [];
  for (const item of values) {
    const src = toValidImageSrc(item);
    if (src) clean.push(src);
  }
  return clean;
}

// Diğer Projeler Section
function OtherProjectsSection({ designer, currentProjectId }: { designer: Designer; currentProjectId: string }) {
  const [showAll, setShowAll] = useState(false);
  const allProjects = (designer.portfolio ?? []).filter((p) => p.id !== currentProjectId);
  const visibleProjects = showAll ? allProjects : allProjects.slice(0, 6);
  const hasMore = allProjects.length > 6;

  if (allProjects.length === 0) return null;

  return (
    <section className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          {designer.name}&apos;dan Diğer Projeler
        </h2>
        <Link
          href={`/tasarimcilar/${designer.slug}#projeler`}
          className="flex items-center gap-1 text-sm font-medium text-teal-600 transition-colors hover:text-teal-700"
        >
          Tümünü Gör
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Projects Grid - 3 per row */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {visibleProjects.map((p) => {
          const projectImages = sanitizeImageList(p.images);
          const coverSrc = toValidImageSrc(p.coverUrl) ?? projectImages[0] ?? null;
          const hasMultipleImages = projectImages.length > 1;
          return (
            <Link
              key={p.id}
              href={`/tasarimcilar/${designer.slug}/proje/${p.id}`}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl"
            >
              {/* Image container */}
              <div className="relative aspect-4/3 overflow-hidden">
                {coverSrc ? (
                  <Image src={coverSrc} alt={p.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-400">
                    Görsel yok
                  </div>
                )}

                {/* Sol üst: Oda etiketi */}
                {p.room && (
                  <div className="absolute left-3 top-3">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
                      {p.room}
                    </span>
                  </div>
                )}

                {/* Sağ üst: Fotoğraf sayısı */}
                {hasMultipleImages && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium text-white">{projectImages.length}</span>
                  </div>
                )}
              </div>

              {/* Alt kısım: Başlık ve stil */}
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{p.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {p.room}{p.room && p.style && " • "}{p.style}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Daha Fazla butonu */}
      {hasMore && !showAll && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow"
          >
            Daha Fazla Göster
            <span className="text-gray-400">({allProjects.length - 6} proje)</span>
          </button>
        </div>
      )}

      {/* Daha Az butonu */}
      {showAll && hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow"
          >
            Daha Az Göster
          </button>
        </div>
      )}
    </section>
  );
}

// Açıklama metni - 4 satır sonrası "devamını oku"
function DescriptionText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 180; // yaklaşık 4 satır
  const shouldTruncate = text.length > maxLength;

  return (
    <div className="mt-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Proje Hakkında</p>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
        {shouldTruncate && !expanded ? (
          <>
            {text.slice(0, maxLength).trim()}...
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="ml-1 font-medium text-violet-600 hover:text-violet-700"
            >
              devamını oku
            </button>
          </>
        ) : (
          <>
            {text}
            {shouldTruncate && expanded && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="ml-1 font-medium text-violet-600 hover:text-violet-700"
              >
                daha az göster
              </button>
            )}
          </>
        )}
      </p>
    </div>
  );
}

export default function ProjectDetailClient({
  designer,
  project,
}: {
  designer: Designer;
  project: PortfolioItem;
  prevProject: PortfolioItem | null;
  nextProject: PortfolioItem | null;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  // Proje resimleri - images dizisi yoksa coverUrl kullan
  const galleryImages = sanitizeImageList(project.images);
  const coverFallback = toValidImageSrc(project.coverUrl);
  const images = galleryImages.length > 0 ? galleryImages : coverFallback ? [coverFallback] : [];
  const normalizedSelectedIndex =
    images.length > 0 ? ((selectedIndex % images.length) + images.length) % images.length : 0;
  const selectedImageSrc = toValidImageSrc(images[normalizedSelectedIndex]);

  // Designer avatar - avatarUrl yoksa coverUrl kullan
  const designerAvatar = toValidImageSrc(designer.avatarUrl) ?? toValidImageSrc(designer.coverUrl);

  const goToPrev = useCallback(() => {
    if (images.length <= 1) return;
    setSelectedIndex((prev) => {
      const current = ((prev % images.length) + images.length) % images.length;
      return current > 0 ? current - 1 : images.length - 1;
    });
  }, [images.length]);

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setSelectedIndex((prev) => {
      const current = ((prev % images.length) + images.length) % images.length;
      return current < images.length - 1 ? current + 1 : 0;
    });
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") window.history.back();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: project.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-violet-50/30">
      {/* Header - Glass Effect */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href={`/tasarimcilar/${designer.slug}`}
            className="flex items-center gap-2 rounded-full bg-white/50 px-3 py-1.5 text-gray-600 shadow-sm ring-1 ring-black/5 transition hover:bg-white hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Geri</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={onShare}
              className="rounded-full bg-white/50 p-2 shadow-sm ring-1 ring-black/5 transition hover:bg-white"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className="rounded-full bg-white/50 p-2 shadow-sm ring-1 ring-black/5 transition hover:bg-white"
            >
              <svg className={`h-5 w-5 ${saved ? "fill-rose-500 text-rose-500" : "text-gray-600"}`} fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <Link
              href={`/tasarimcilar/${designer.slug}`}
              className="rounded-full bg-white/50 p-2 shadow-sm ring-1 ring-black/5 transition hover:bg-white"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Main - Daha fazla üst boşluk */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* İki Sütunlu Layout */}
        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>

          {/* Sol: Fotoğraf Galerisi */}
          <div style={{ flex: "1 1 580px", minWidth: "300px" }}>
            {/* Ana Fotoğraf - Çerçevesiz */}
            <div
              className="relative overflow-hidden rounded-2xl shadow-2xl shadow-black/15"
              style={{ height: "420px" }}
            >
              {selectedImageSrc ? (
                <Image
                  src={selectedImageSrc}
                  alt={project.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
                  Proje görseli yok
                </div>
              )}

              {/* Navigation buttons */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={goToPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:scale-110"
                  >
                    <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:scale-110"
                  >
                    <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Photo counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm">
                <span className="text-sm font-medium text-white">{normalizedSelectedIndex + 1} / {images.length}</span>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 flex items-center gap-3">
                {images.map((img, idx) => {
                  const thumbSrc = toValidImageSrc(img);
                  return (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
                      idx === normalizedSelectedIndex
                        ? "ring-2 ring-violet-500 ring-offset-2 shadow-lg scale-105"
                        : "opacity-60 hover:opacity-100 hover:shadow-md"
                    }`}
                    style={{ width: "72px", height: "54px" }}
                  >
                    {thumbSrc ? <Image src={thumbSrc} alt="" fill className="object-cover" sizes="72px" /> : null}
                  </button>
                )})}
              </div>
            )}
          </div>

          {/* Sağ: Proje Bilgileri */}
          <div style={{ flex: "0 0 360px", maxWidth: "100%" }}>
            <div className="rounded-2xl bg-white p-6 shadow-xl shadow-black/5">
              {/* Etiketler */}
              <div className="flex flex-wrap gap-2">
                {project.room && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{project.room}</span>
                )}
                {project.style && (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">{project.style}</span>
                )}
              </div>

              {/* Başlık */}
              <h1 className="mt-4 text-xl font-bold text-gray-900">{project.title}</h1>

              {project.location && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {project.location}
                </p>
              )}

              {/* Proje Detayları Grid */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                {project.area && (
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Alan</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">{project.area}</p>
                  </div>
                )}
                {project.year && (
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Yıl</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">{project.year}</p>
                  </div>
                )}
                {project.budget && (
                  <div className="rounded-xl bg-emerald-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Maliyet</p>
                    <p className="mt-0.5 text-sm font-bold text-emerald-700">{project.budget}</p>
                  </div>
                )}
                {project.duration && (
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Süre</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">{project.duration}</p>
                  </div>
                )}
              </div>

              {/* Proje Açıklaması */}
              {project.description && (
                <DescriptionText text={project.description} />
              )}

              {/* Divider */}
              <div className="my-5 h-px bg-slate-100" />

              {/* Tasarımcı Kartı */}
              <Link href={`/tasarimcilar/${designer.slug}`} className="flex items-center gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-slate-50">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md">
                  {designerAvatar ? (
                    <Image src={designerAvatar} alt={designer.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs font-semibold text-slate-500">
                      {designer.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{designer.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span>{designer.title}</span>
                    <span className="text-gray-300">•</span>
                    <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 1l2.39 5.64L18 7.27l-4.12 3.73L15 16.5 10 13.27 5 16.5l1.12-5.5L2 7.27l5.61-.63L10 1Z" />
                    </svg>
                    <span className="font-semibold text-gray-700">{designer.rating}</span>
                    <span className="text-gray-400">({designer.reviews})</span>
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Mesaj Gönder Butonu */}
              {designer.liveDesignerId ? (
                <Link
                  href={`/messages?designer=${encodeURIComponent(designer.liveDesignerId)}`}
                  style={{
                    background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)",
                    boxShadow: "0 4px 14px 0 rgba(20, 184, 166, 0.35)",
                  }}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Mesaj Gönder
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-5 flex h-12 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl bg-slate-200 text-sm font-semibold text-slate-500"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Mesaj Gönder
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Diğer Projeler */}
        <OtherProjectsSection designer={designer} currentProjectId={project.id} />
      </main>
    </div>
  );
}
