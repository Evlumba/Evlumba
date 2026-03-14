"use client";

import Image from "next/image";
import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Designer, ReviewItem } from "../../_data/designers";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function firstNameOnly(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  if (!normalized) return "Kullanıcı";
  return normalized.split(" ")[0] || "Kullanıcı";
}

function IconStar({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={className}>
      <path
        d="M10 1l2.39 5.64L18 7.27l-4.12 3.73L15 16.5 10 13.27 5 16.5l1.12-5.5L2 7.27l5.61-.63L10 1Z"
        fill="currentColor"
        opacity={filled ? 1 : 0.25}
      />
    </svg>
  );
}

function IconThumbUp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14Zm-7 11H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <IconStar
          key={star}
          className={`${sizeClass} text-amber-400`}
          filled={star <= rating}
        />
      ))}
    </div>
  );
}

function PinnedReviewCard({
  review,
  designerName,
  designerAvatar,
}: {
  review: ReviewItem;
  designerName: string;
  designerAvatar?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const charLimit = 250;
  const shouldTruncate = review.text.length > charLimit;
  const authorName = firstNameOnly(review.author);

  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-2xl bg-linear-to-br from-violet-50 via-white to-amber-50/30 p-5 ring-1 ring-violet-100/50">
      {/* Badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1">
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-violet-600" fill="currentColor">
          <path d="M10 1l2.39 5.64L18 7.27l-4.12 3.73L15 16.5 10 13.27 5 16.5l1.12-5.5L2 7.27l5.61-.63L10 1Z" />
        </svg>
        <span className="text-xs font-semibold text-violet-700">Öne Çıkan Yorum</span>
      </div>

      {/* Review text */}
      <p className="text-[15px] leading-relaxed text-gray-700">
        {shouldTruncate && !expanded ? `${review.text.slice(0, charLimit).trim()}...` : review.text}
        {shouldTruncate && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-1.5 font-medium text-violet-600 hover:text-violet-700"
          >
            devamını oku
          </button>
        )}
      </p>

      {/* Author info */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar - glass style */}
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-white/60 shadow-lg backdrop-blur-sm"
            style={{ background: "linear-gradient(135deg, rgba(100,116,139,0.85) 0%, rgba(71,85,105,0.9) 100%)" }}
          >
            <span className="text-[13px] font-bold tracking-wide" style={{ color: "#ffffff" }}>{initials}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{authorName}</p>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              {review.project && (
                <span className="text-xs text-gray-500">{review.project}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Designer reply */}
      {review.reply && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-white/70 p-3">
          {designerAvatar ? (
            <Image
              src={designerAvatar}
              alt={designerName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500">
              <span className="text-xs font-bold text-white">{designerName.slice(0, 1)}</span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">{designerName}</p>
            <p className="mt-0.5 text-sm text-gray-600">{review.reply.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  designerName,
  designerAvatar,
}: {
  review: ReviewItem;
  designerName: string;
  designerAvatar?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const charLimit = 200;
  const shouldTruncate = review.text.length > charLimit;
  const authorName = firstNameOnly(review.author);

  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split("-");
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-2xl bg-gray-50/80 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar - glass style */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-white/60 shadow-lg backdrop-blur-sm"
            style={{ background: "linear-gradient(135deg, rgba(100,116,139,0.85) 0%, rgba(71,85,105,0.9) 100%)" }}
          >
            <span className="text-[13px] font-bold tracking-wide" style={{ color: "#ffffff" }}>{initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{authorName}</span>
              {review.authorCity && (
                <span className="text-sm text-gray-400">{review.authorCity}</span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              {review.project && (
                <span className="text-xs text-gray-500">{review.project}</span>
              )}
            </div>
          </div>
        </div>
        <span className="shrink-0 text-xs text-gray-400">{formatDate(review.date)}</span>
      </div>

      {/* Review text */}
      <p className="mt-3 text-sm leading-relaxed text-gray-700">
        {shouldTruncate && !expanded ? `${review.text.slice(0, charLimit).trim()}...` : review.text}
        {shouldTruncate && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-1 font-medium text-violet-600 hover:text-violet-700"
          >
            devamını oku
          </button>
        )}
      </p>

      {/* Helpful */}
      {review.helpfulCount && review.helpfulCount > 0 && (
        <div className="mt-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
          >
            <IconThumbUp className="h-4 w-4" />
            <span>{review.helpfulCount} kişi faydalı buldu</span>
          </button>
        </div>
      )}

      {/* Designer reply */}
      {review.reply && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-white p-3">
          {designerAvatar ? (
            <Image
              src={designerAvatar}
              alt={designerName}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500">
              <span className="text-[10px] font-bold text-white">{designerName.slice(0, 1)}</span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">{designerName}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{review.reply.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const REVIEWS_PER_PAGE = 5;

export default function ReviewsSection({ designer }: { designer: Designer }) {
  const router = useRouter();
  const [, startRefreshTransition] = useTransition();
  const [reviews, setReviews] = useState<ReviewItem[]>(designer.reviewsList ?? []);
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editText, setEditText] = useState("");
  const [activeActionReviewId, setActiveActionReviewId] = useState<string | null>(null);

  const designerId = useMemo(() => {
    if (designer.liveDesignerId) return designer.liveDesignerId;
    if (!designer.slug.startsWith("supa_")) return null;
    return designer.slug.slice(5);
  }, [designer.liveDesignerId, designer.slug]);

  const canSubmitLiveReview = Boolean(designerId);

  function refreshDesignerData() {
    startRefreshTransition(() => {
      router.refresh();
    });
  }

  useEffect(() => {
    setReviews(designer.reviewsList ?? []);
  }, [designer.reviewsList]);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setCurrentUserId(data.user?.id ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submitReview() {
    if (!designerId) {
      setSubmitMessage("Bu profil demo verisiyle çalışıyor. Canlı yorum sadece Supabase tasarımcılarında açık.");
      return;
    }
    if (formText.trim().length < 10) {
      setSubmitMessage("Yorum en az 10 karakter olmalı.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const res = await fetch(`/api/public/designer/${encodeURIComponent(designerId)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          reviewText: formText.trim(),
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setSubmitMessage(json.error || "Yorum kaydedilemedi.");
        return;
      }
      setSubmitMessage("Yorumun kaydedildi.");
      setFormText("");
      setFormRating(5);
      setIsFormOpen(false);
      refreshDesignerData();
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Yorum kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function canManageReview(review: ReviewItem) {
    return Boolean(designerId && currentUserId && review.homeownerId && review.homeownerId === currentUserId);
  }

  function startEditReview(review: ReviewItem) {
    setEditingReviewId(review.id);
    setEditRating(Math.max(1, Math.min(5, Math.round(review.rating || 5))));
    setEditText(review.text);
    setSubmitMessage(null);
  }

  function cancelEditReview() {
    setEditingReviewId(null);
    setEditText("");
    setEditRating(5);
  }

  async function saveReviewChanges(reviewId: string) {
    if (!designerId) return;
    if (editText.trim().length < 10) {
      setSubmitMessage("Yorum en az 10 karakter olmalı.");
      return;
    }

    setActiveActionReviewId(reviewId);
    setSubmitMessage(null);
    try {
      const res = await fetch(
        `/api/public/designer/${encodeURIComponent(designerId)}/reviews/${encodeURIComponent(reviewId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: editRating,
            reviewText: editText.trim(),
          }),
        }
      );
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        review?: {
          id: string;
          rating: number;
          reviewText: string;
        };
      };
      if (!json.ok) {
        setSubmitMessage(json.error || "Yorum güncellenemedi.");
        return;
      }

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                rating: json.review?.rating ?? editRating,
                text: json.review?.reviewText ?? editText.trim(),
              }
            : review
        )
      );
      setSubmitMessage("Yorumun güncellendi.");
      cancelEditReview();
      refreshDesignerData();
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Yorum güncellenemedi.");
    } finally {
      setActiveActionReviewId(null);
    }
  }

  async function deleteReview(reviewId: string) {
    if (!designerId) return;
    if (!window.confirm("Yorumunu silmek istediğine emin misin?")) return;

    setActiveActionReviewId(reviewId);
    setSubmitMessage(null);
    try {
      const res = await fetch(
        `/api/public/designer/${encodeURIComponent(designerId)}/reviews/${encodeURIComponent(reviewId)}`,
        { method: "DELETE" }
      );
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setSubmitMessage(json.error || "Yorum silinemedi.");
        return;
      }

      setReviews((prev) => prev.filter((review) => review.id !== reviewId));
      if (editingReviewId === reviewId) cancelEditReview();
      setSubmitMessage("Yorumun silindi.");
      refreshDesignerData();
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Yorum silinemedi.");
    } finally {
      setActiveActionReviewId(null);
    }
  }

  const displayRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return Number((reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1));
  }, [reviews]);

  // Ortalama puanları hesapla
  const avgRatings = useMemo(() => {
    if (reviews.length === 0) return null;

    let workQuality = 0, communication = 0, value = 0;
    let wqCount = 0, commCount = 0, valCount = 0;

    reviews.forEach((r) => {
      if (r.ratings?.workQuality) { workQuality += r.ratings.workQuality; wqCount++; }
      if (r.ratings?.communication) { communication += r.ratings.communication; commCount++; }
      if (r.ratings?.value) { value += r.ratings.value; valCount++; }
    });

    return {
      workQuality: wqCount > 0 ? workQuality / wqCount : null,
      communication: commCount > 0 ? communication / commCount : null,
      value: valCount > 0 ? value / valCount : null,
    };
  }, [reviews]);

  const pinnedReview = useMemo(() => reviews.find((r) => r.pinned), [reviews]);

  const sortedReviews = useMemo(() => {
    return reviews.filter((r) => !r.pinned).sort((a, b) => b.date.localeCompare(a.date));
  }, [reviews]);

  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMore = visibleCount < sortedReviews.length;

  if (reviews.length === 0) {
    return (
      <section id="yorumlar" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 mt-8">
          <div className="rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.18)]">
            <div className="p-10 md:p-14">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-amber-50 to-amber-100">
                  <IconStar className="h-8 w-8 text-amber-300" filled={false} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Henüz yorum yapılmadı</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {designer.name} ile çalıştıysanız deneyiminizi paylaşın.
                </p>
                <button
                  type="button"
                  onClick={() => setIsFormOpen((prev) => !prev)}
                  className="mt-5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Yorum yaz
                </button>
                {isFormOpen ? (
                  <div className="mt-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 text-left">
                    <div className="text-sm font-semibold text-gray-900">Puanın</div>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          className="rounded-md p-1"
                        >
                          <IconStar className="h-5 w-5 text-amber-400" filled={star <= formRating} />
                        </button>
                      ))}
                    </div>
                    <label className="mt-3 block text-sm font-semibold text-gray-900">Yorum</label>
                    <textarea
                      value={formText}
                      onChange={(event) => setFormText(event.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
                      placeholder="Deneyimini yaz..."
                    />
                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={isSubmitting}
                      className="mt-3 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSubmitting ? "Gönderiliyor..." : "Yorumu gönder"}
                    </button>
                    {!canSubmitLiveReview ? (
                      <p className="mt-2 text-xs text-gray-500">Demo profillerde yorum gönderimi kapalıdır.</p>
                    ) : null}
                  </div>
                ) : null}
                {submitMessage ? <p className="mt-3 text-xs text-gray-600">{submitMessage}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const hasRatings = avgRatings && (avgRatings.workQuality || avgRatings.communication || avgRatings.value);

  return (
    <section id="yorumlar" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 mt-8">
        <div className="rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.18)]">
          <div className="p-5 md:p-6">

            {/* Pinned review at the very top */}
            {pinnedReview && (
              <div className="mb-6">
                <PinnedReviewCard
                  review={pinnedReview}
                  designerName={designer.name}
                  designerAvatar={designer.avatarUrl}
                />
                {canManageReview(pinnedReview) ? (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
                    {editingReviewId === pinnedReview.id ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Puanın</div>
                          <div className="mt-1.5 flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditRating(star)}
                                className="rounded-md p-1"
                              >
                                <IconStar className="h-5 w-5 text-amber-400" filled={star <= editRating} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-900">Yorumun</label>
                          <textarea
                            value={editText}
                            onChange={(event) => setEditText(event.target.value)}
                            rows={4}
                            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void saveReviewChanges(pinnedReview.id)}
                            disabled={activeActionReviewId === pinnedReview.id}
                            className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {activeActionReviewId === pinnedReview.id ? "Kaydediliyor..." : "Kaydet"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditReview}
                            className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditReview(pinnedReview)}
                          className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                        >
                          Yorumu düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteReview(pinnedReview.id)}
                          disabled={activeActionReviewId === pinnedReview.id}
                          className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          {activeActionReviewId === pinnedReview.id ? "Siliniyor..." : "Yorumu sil"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Rating summary header */}
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: Stars + score + count */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <StarRating rating={displayRating} size="lg" />
                  <span className="text-2xl font-bold text-gray-900">{displayRating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-400">{reviews.length} yorum</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen((prev) => !prev)}
                className="inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Yorum yaz
              </button>

              {/* Right: Rating breakdown pills */}
              {hasRatings && (
                <div className="flex flex-wrap gap-2">
                  {avgRatings.workQuality && (
                    <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5">
                      <span className="text-xs text-amber-700">İş Kalitesi</span>
                      <span className="text-xs font-semibold text-amber-600">{avgRatings.workQuality.toFixed(1)}</span>
                    </div>
                  )}
                  {avgRatings.communication && (
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5">
                      <span className="text-xs text-emerald-700">İletişim</span>
                      <span className="text-xs font-semibold text-emerald-600">{avgRatings.communication.toFixed(1)}</span>
                    </div>
                  )}
                  {avgRatings.value && (
                    <div className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5">
                      <span className="text-xs text-violet-700">Fiyat/Değer</span>
                      <span className="text-xs font-semibold text-violet-600">{avgRatings.value.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isFormOpen ? (
              <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Puanın</div>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setFormRating(star)} className="rounded-md p-1">
                      <IconStar className="h-5 w-5 text-amber-400" filled={star <= formRating} />
                    </button>
                  ))}
                </div>
                <label className="mt-3 block text-sm font-semibold text-gray-900">Yorum</label>
                <textarea
                  value={formText}
                  onChange={(event) => setFormText(event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  placeholder="Deneyimini yaz..."
                />
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={isSubmitting}
                  className="mt-3 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Gönderiliyor..." : "Yorumu gönder"}
                </button>
                {!canSubmitLiveReview ? (
                  <p className="mt-2 text-xs text-gray-500">Demo profillerde yorum gönderimi kapalıdır.</p>
                ) : null}
                {submitMessage ? <p className="mt-2 text-xs text-gray-600">{submitMessage}</p> : null}
              </div>
            ) : null}

            {/* Reviews list */}
            <div className="space-y-3">
              {visibleReviews.map((review) => (
                <div key={review.id}>
                  <ReviewCard
                    review={review}
                    designerName={designer.name}
                    designerAvatar={designer.avatarUrl}
                  />
                  {canManageReview(review) ? (
                    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3">
                      {editingReviewId === review.id ? (
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Puanın</div>
                            <div className="mt-1.5 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditRating(star)}
                                  className="rounded-md p-1"
                                >
                                  <IconStar className="h-5 w-5 text-amber-400" filled={star <= editRating} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-900">Yorumun</label>
                            <textarea
                              value={editText}
                              onChange={(event) => setEditText(event.target.value)}
                              rows={4}
                              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void saveReviewChanges(review.id)}
                              disabled={activeActionReviewId === review.id}
                              className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              {activeActionReviewId === review.id ? "Kaydediliyor..." : "Kaydet"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditReview}
                              className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditReview(review)}
                            className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                          >
                            Yorumu düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteReview(review.id)}
                            disabled={activeActionReviewId === review.id}
                            className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            {activeActionReviewId === review.id ? "Siliniyor..." : "Yorumu sil"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + REVIEWS_PER_PAGE)}
                  className="rounded-full bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Daha fazla yorum ({sortedReviews.length - visibleCount})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
