"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { exploreIdeas } from "../../../lib/data";

// Diğer Tasarımlar Section
function OtherDesignsSection({ currentId }: { currentId: string }) {
  const [showAll, setShowAll] = useState(false);
  const allDesigns = exploreIdeas.filter((d) => d.id !== currentId);
  const visibleDesigns = showAll ? allDesigns : allDesigns.slice(0, 6);
  const hasMore = allDesigns.length > 6;

  if (allDesigns.length === 0) return null;

  return (
    <section className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Diğer Tasarımlar</h2>
        <Link
          href="/kesfet"
          className="flex items-center gap-1 text-sm font-medium text-teal-600 transition-colors hover:text-teal-700"
        >
          Tümünü Keşfet
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Designs Grid - 3 per row */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {visibleDesigns.map((d) => (
          <Link
            key={d.id}
            href={`/tasarim/${d.id}`}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl"
          >
            {/* Image container */}
            <div className="relative aspect-4/3 overflow-hidden">
              <Image
                src={d.imageUrl}
                alt={d.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Sol üst: Oda etiketi */}
              <div className="absolute left-3 top-3">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
                  {d.roomLabel}
                </span>
              </div>

              {/* Sağ üst: Stil */}
              <div className="absolute right-3 top-3">
                <span className="rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {d.style}
                </span>
              </div>
            </div>

            {/* Alt kısım: Başlık ve tasarımcı */}
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{d.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">{d.designerName}</p>
            </div>
          </Link>
        ))}
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
            <span className="text-gray-400">({allDesigns.length - 6} tasarım)</span>
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

// Aynı tasarımcıdan diğer tasarımlar
function SameDesignerSection({ designerId, designerName, designerSlug, currentId }: { designerId: string; designerName: string; designerSlug: string; currentId: string }) {
  const sameDesignerDesigns = exploreIdeas.filter((d) => d.designerId === designerId && d.id !== currentId);

  if (sameDesignerDesigns.length === 0) return null;

  return (
    <section className="mt-10">
      <h3 className="text-base font-bold text-gray-900">{designerName}&apos;dan Diğer Tasarımlar</h3>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {sameDesignerDesigns.map((d) => (
          <Link
            key={d.id}
            href={`/tasarim/${d.id}`}
            className="group shrink-0"
          >
            <div className="relative h-24 w-36 overflow-hidden rounded-xl">
              <Image
                src={d.imageUrl}
                alt={d.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="mt-1.5 w-36 truncate text-xs font-medium text-gray-700">{d.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function TasarimDetay() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [saved, setSaved] = useState(false);

  const idea = exploreIdeas.find((x) => x.id === id);

  // Mevcut tasarımın index'i ve önceki/sonraki tasarımlar
  const currentIndex = exploreIdeas.findIndex((x) => x.id === id);
  const prevDesign = currentIndex > 0 ? exploreIdeas[currentIndex - 1] : null;
  const nextDesign = currentIndex < exploreIdeas.length - 1 ? exploreIdeas[currentIndex + 1] : null;

  const goToPrev = useCallback(() => {
    if (prevDesign) {
      router.push(`/tasarim/${prevDesign.id}`);
    }
  }, [prevDesign, router]);

  const goToNext = useCallback(() => {
    if (nextDesign) {
      router.push(`/tasarim/${nextDesign.id}`);
    }
  }, [nextDesign, router]);

  // Klavye navigasyonu
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
        await navigator.share({ title: idea?.title ?? "Tasarım", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  if (!idea) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-violet-50/30">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
            <Link
              href="/kesfet"
              className="flex items-center gap-2 rounded-full bg-white/50 px-3 py-1.5 text-gray-600 shadow-sm ring-1 ring-black/5 transition hover:bg-white hover:text-gray-900"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Keşfet</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-rose-50 to-rose-100">
              <svg className="h-8 w-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Tasarım Bulunamadı</h1>
            <p className="mt-2 text-sm text-gray-500">Bu link eski olabilir veya tasarım kaldırılmış olabilir.</p>
            <Link
              href="/kesfet"
              className="mt-6 rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:bg-teal-700"
            >
              Keşfet&apos;e Dön
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-violet-50/30">
      {/* Header - Glass Effect */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/kesfet"
            className="flex items-center gap-2 rounded-full bg-white/50 px-3 py-1.5 text-gray-600 shadow-sm ring-1 ring-black/5 transition hover:bg-white hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Keşfet</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Önceki/Sonraki Navigasyon */}
            <div className="mr-2 flex items-center gap-1">
              <button
                onClick={goToPrev}
                disabled={!prevDesign}
                className={`rounded-full p-2 shadow-sm ring-1 ring-black/5 transition ${
                  prevDesign
                    ? "bg-white/50 hover:bg-white text-gray-600"
                    : "bg-gray-100/50 text-gray-300 cursor-not-allowed"
                }`}
                title="Önceki tasarım"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                disabled={!nextDesign}
                className={`rounded-full p-2 shadow-sm ring-1 ring-black/5 transition ${
                  nextDesign
                    ? "bg-white/50 hover:bg-white text-gray-600"
                    : "bg-gray-100/50 text-gray-300 cursor-not-allowed"
                }`}
                title="Sonraki tasarım"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              onClick={onShare}
              className="rounded-full bg-white/50 p-2 shadow-sm ring-1 ring-black/5 transition hover:bg-white"
              title="Paylaş"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className="rounded-full bg-white/50 p-2 shadow-sm ring-1 ring-black/5 transition hover:bg-white"
              title={saved ? "Kaydedildi" : "Kaydet"}
            >
              <svg
                className={`h-5 w-5 ${saved ? "fill-rose-500 text-rose-500" : "text-gray-600"}`}
                fill={saved ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <Link
              href="/kesfet"
              className="rounded-full bg-white/50 p-2 shadow-sm ring-1 ring-black/5 transition hover:bg-white"
              title="Kapat"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* İki Sütunlu Layout */}
        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
          {/* Sol: Fotoğraf */}
          <div style={{ flex: "1 1 580px", minWidth: "300px" }}>
            {/* Ana Fotoğraf */}
            <div
              className="relative overflow-hidden rounded-2xl shadow-2xl shadow-black/15"
              style={{ height: "420px" }}
            >
              <Image
                src={idea.imageUrl}
                alt={idea.title}
                fill
                className="object-cover"
                priority
              />

              {/* Fotoğraf üzerinde navigasyon okları */}
              {prevDesign && (
                <button
                  onClick={goToPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:scale-110"
                >
                  <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {nextDesign && (
                <button
                  onClick={goToNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:scale-110"
                >
                  <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Sağ: Tasarım Bilgileri */}
          <div style={{ flex: "0 0 360px", maxWidth: "100%" }}>
            <div className="rounded-2xl bg-white p-6 shadow-xl shadow-black/5">
              {/* Etiketler */}
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {idea.roomLabel}
                </span>
                {idea.subLabel && (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">
                    {idea.subLabel}
                  </span>
                )}
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-600">
                  {idea.style}
                </span>
              </div>

              {/* Başlık */}
              <h1 className="mt-4 text-xl font-bold text-gray-900">{idea.title}</h1>

              {/* Konum */}
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {idea.city}
              </p>

              {/* Detay Grid */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Renk</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{idea.color}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Bütçe</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{idea.budget}</p>
                </div>
              </div>

              {/* Açıklama */}
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hakkında</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{idea.description}</p>
              </div>

              {/* Tags */}
              {idea.tags && idea.tags.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Etiketler</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {idea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="my-5 h-px bg-slate-100" />

              {/* Tasarımcı Kartı */}
              <Link
                href={`/tasarimcilar/${idea.designerSlug}`}
                className="flex items-center gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-slate-50"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md">
                  <Image src={idea.designerAvatarUrl} alt={idea.designerName} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{idea.designerName}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 1l2.39 5.64L18 7.27l-4.12 3.73L15 16.5 10 13.27 5 16.5l1.12-5.5L2 7.27l5.61-.63L10 1Z" />
                    </svg>
                    <span className="font-semibold text-gray-700">{idea.designerRating}</span>
                    <span className="text-gray-400">({idea.designerReviews} yorum)</span>
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Mesaj Gönder Butonu */}
              <button
                type="button"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)",
                  boxShadow: "0 4px 14px 0 rgba(20, 184, 166, 0.35)"
                }}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Mesaj Gönder
              </button>
            </div>
          </div>
        </div>

        {/* Aynı Tasarımcıdan Diğer Tasarımlar */}
        <SameDesignerSection
          designerId={idea.designerId}
          designerName={idea.designerName}
          designerSlug={idea.designerSlug}
          currentId={idea.id}
        />

        {/* Diğer Tasarımlar */}
        <OtherDesignsSection currentId={idea.id} />
      </main>
    </div>
  );
}
