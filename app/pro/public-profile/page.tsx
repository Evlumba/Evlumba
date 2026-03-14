"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type PublicProfile = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  specialty: string | null;
  city: string | null;
  about: string | null;
  phone: string | null;
  contact_email: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  cover_photo_url: string | null;
  avatar_url: string | null;
};

type PublicProject = {
  id: string;
  title: string;
  project_type: string | null;
  location: string | null;
  description: string | null;
  cover_image_url: string | null;
};

type PublicReview = {
  id: string;
  rating: number;
  review_text: string;
  reply_text: string | null;
  helpful_count: number;
  created_at: string;
  author_name: string;
};

function firstNameOnly(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  if (!normalized) return "Kullanıcı";
  return normalized.split(" ")[0] || "Kullanıcı";
}

function PublicProProfilePageContent() {
  const sp = useSearchParams();
  const designerId = sp.get("designerId");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [responseLabel, setResponseLabel] = useState("24 saat içinde dönüş");
  const [error, setError] = useState<string | null>(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submitState, setSubmitState] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const id = designerId;
    if (!id) {
      setLoading(false);
      setError("Designer bulunamadı.");
      return;
    }

    const safeId = id.trim();
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/designer/${encodeURIComponent(safeId)}`);
        const json = (await res.json()) as {
          ok: boolean;
          error?: string;
          profile?: PublicProfile;
          projects?: PublicProject[];
          reviews?: PublicReview[];
          rating?: number;
          reviewCount?: number;
          responseLabel?: string;
        };

        if (!json.ok || !json.profile) {
          if (!cancelled) setError(json.error || "Profil alınamadı.");
          return;
        }

        if (!cancelled) {
          setProfile(json.profile);
          setProjects(json.projects ?? []);
          setReviews(json.reviews ?? []);
          setRating(Number(json.rating ?? 0));
          setReviewCount(Number(json.reviewCount ?? 0));
          setResponseLabel(json.responseLabel || "24 saat içinde dönüş");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Profil alınamadı.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [designerId]);

  async function submitReview() {
    if (!designerId) return;
    if (reviewText.trim().length < 10) {
      setSubmitState("Yorum en az 10 karakter olmalı.");
      return;
    }
    setIsSubmitting(true);
    setSubmitState(null);
    try {
      const res = await fetch(`/api/public/designer/${encodeURIComponent(designerId)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, reviewText: reviewText.trim() }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setSubmitState(json.error || "Yorum kaydedilemedi.");
        return;
      }
      setSubmitState("Yorumun kaydedildi.");
      setReviewText("");
      setReviewRating(5);
      setIsReviewFormOpen(false);
      setLoading(true);
      const refreshRes = await fetch(`/api/public/designer/${encodeURIComponent(designerId)}`);
      const refreshJson = (await refreshRes.json()) as {
        ok: boolean;
        projects?: PublicProject[];
        reviews?: PublicReview[];
        rating?: number;
        reviewCount?: number;
        responseLabel?: string;
      };
      if (refreshJson.ok) {
        setProjects(refreshJson.projects ?? []);
        setReviews(refreshJson.reviews ?? []);
        setRating(Number(refreshJson.rating ?? 0));
        setReviewCount(Number(refreshJson.reviewCount ?? 0));
        setResponseLabel(refreshJson.responseLabel || "24 saat içinde dönüş");
      }
      setLoading(false);
    } catch (e) {
      setSubmitState(e instanceof Error ? e.message : "Yorum kaydedilemedi.");
      setLoading(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-100 px-4 py-8">Profil yükleniyor...</main>;
  }

  if (error || !profile) {
    return <main className="min-h-screen bg-slate-100 px-4 py-8">{error || "Profil bulunamadı."}</main>;
  }

  const name = profile.business_name || profile.full_name || "Profesyonel";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div
          className="h-52 bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-500"
          style={
            profile.cover_photo_url
              ? {
                  backgroundImage: `url(${profile.cover_photo_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />

        <div className="-mt-12 px-6 pb-8">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-200">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" /> : null}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
              <p className="text-sm text-slate-600">{[profile.specialty, profile.city].filter(Boolean).join(" • ")}</p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">{rating.toFixed(1)}</span> • {reviewCount} yorum • Genelde {responseLabel}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="font-semibold text-slate-900">İletişim Bilgileri</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {profile.contact_email ? <li>Email: {profile.contact_email}</li> : null}
                {profile.phone ? <li>Telefon: {profile.phone}</li> : null}
                {profile.address ? <li>Adres: {profile.address}</li> : null}
                {profile.website ? <li>Web: {profile.website}</li> : null}
              </ul>
            </aside>

            <section>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Hakkında</h3>
                <p className="mt-2 text-sm text-slate-700">{profile.about || "Henüz açıklama eklenmemiş."}</p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">Yorumlar</h3>
                  <button
                    type="button"
                    onClick={() => setIsReviewFormOpen((prev) => !prev)}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Yorum yaz
                  </button>
                </div>

                {isReviewFormOpen ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-sm font-semibold text-slate-900">Puanın</div>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`rounded-md px-2 py-1 text-sm ${star <= reviewRating ? "text-amber-500" : "text-slate-300"}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(event) => setReviewText(event.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      placeholder="Deneyimini yaz..."
                    />
                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={isSubmitting}
                      className="mt-2 rounded-full bg-sky-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {isSubmitting ? "Gönderiliyor..." : "Gönder"}
                    </button>
                    {submitState ? <p className="mt-2 text-xs text-slate-600">{submitState}</p> : null}
                  </div>
                ) : null}

                {reviews.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">Henüz yorum yok.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {reviews.slice(0, 6).map((review) => (
                      <article key={review.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">{firstNameOnly(review.author_name)}</div>
                          <div className="text-xs text-amber-500">{"★".repeat(Math.max(1, Math.min(5, review.rating)))}</div>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{review.review_text}</p>
                        {review.reply_text ? <p className="mt-2 text-xs text-slate-500">Yanıt: {review.reply_text}</p> : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Projeler</h3>
                {projects.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">Henüz proje yok.</p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {projects.map((project) => (
                      <article key={project.id} className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="aspect-[4/3] bg-slate-100">
                          {project.cover_image_url ? (
                            <img src={project.cover_image_url} alt={project.title} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-semibold">{project.title}</div>
                          <div className="text-xs text-slate-500">
                            {[project.project_type, project.location].filter(Boolean).join(" • ")}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PublicProProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 px-4 py-8">Profil yukleniyor...</main>
      }
    >
      <PublicProProfilePageContent />
    </Suspense>
  );
}
