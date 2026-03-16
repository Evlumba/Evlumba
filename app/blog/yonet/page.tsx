"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatBlogDate, isProfessionalRole, normalizeRole, type BlogRole } from "../_lib";

type BlogPostRow = {
  id: string;
  author_id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type CountRow = {
  post_id: string;
};

const BLOG_HEADER_WIDTH = 1600;
const BLOG_HEADER_HEIGHT = 520;
const MAX_BLOG_IMAGE_MB = 5;
const MAX_BLOG_IMAGE_BYTES = MAX_BLOG_IMAGE_MB * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel yüklenemedi"));
    img.src = src;
  });
}

async function normalizeImageToSize(file: File, width: number, height: number): Promise<string> {
  const sourceDataUrl = await fileToDataUrl(file);
  const image = await loadImage(sourceDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas başlatılamadı");

  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;

  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;

  // Center-crop to target ratio.
  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else if (sourceRatio < targetRatio) {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function ManageBlogPostsPage() {
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [headerSaving, setHeaderSaving] = useState(false);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [headerNotice, setHeaderNotice] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<BlogRole>(null);
  const [aboutDetailsBase, setAboutDetailsBase] = useState<Record<string, unknown>>({});
  const [blogHeaderTitle, setBlogHeaderTitle] = useState("");
  const [blogHeaderDescription, setBlogHeaderDescription] = useState("");
  const [blogHeaderImageUrl, setBlogHeaderImageUrl] = useState("");
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    setHeaderError(null);

    const supabase = getSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id ?? null;
    setUserId(uid);

    if (!uid) {
      setRole(null);
      setPosts([]);
      setLikeCounts({});
      setCommentCounts({});
      setAboutDetailsBase({});
      setBlogHeaderTitle("");
      setBlogHeaderDescription("");
      setBlogHeaderImageUrl("");
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase.rpc("get_profile_role", { user_id: uid });
    const nextRole = normalizeRole(roleData);
    setRole(nextRole);

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("about_details")
      .eq("id", uid)
      .maybeSingle();
    if (profileError) {
      setHeaderError(profileError.message);
      setAboutDetailsBase({});
      setBlogHeaderTitle("");
      setBlogHeaderDescription("");
      setBlogHeaderImageUrl("");
    } else {
      const aboutDetails =
        profileRow?.about_details && typeof profileRow.about_details === "object"
          ? (profileRow.about_details as Record<string, unknown>)
          : {};
      setAboutDetailsBase(aboutDetails);
      setBlogHeaderTitle(
        typeof aboutDetails.blogHeaderTitle === "string" ? aboutDetails.blogHeaderTitle : ""
      );
      setBlogHeaderDescription(
        typeof aboutDetails.blogHeaderDescription === "string"
          ? aboutDetails.blogHeaderDescription
          : ""
      );
      setBlogHeaderImageUrl(
        typeof aboutDetails.blogHeaderImageUrl === "string" ? aboutDetails.blogHeaderImageUrl : ""
      );
    }

    const { data: postRows, error: postsError } = await supabase
      .from("blog_posts")
      .select("id, author_id, slug, title, status, published_at, created_at, updated_at")
      .eq("author_id", uid)
      .order("created_at", { ascending: false });

    if (postsError) {
      setError(postsError.message);
      setLoading(false);
      return;
    }

    const nextPosts = (postRows ?? []) as BlogPostRow[];
    const postIds = nextPosts.map((post) => post.id);
    if (postIds.length === 0) {
      setPosts(nextPosts);
      setLikeCounts({});
      setCommentCounts({});
      setLoading(false);
      return;
    }

    const [likesResult, commentsResult] = await Promise.all([
      supabase.from("blog_post_likes").select("post_id").in("post_id", postIds),
      supabase.from("blog_post_comments").select("post_id").in("post_id", postIds),
    ]);

    if (likesResult.error) {
      setError(likesResult.error.message);
      setLoading(false);
      return;
    }
    if (commentsResult.error) {
      setError(commentsResult.error.message);
      setLoading(false);
      return;
    }

    const nextLikeCounts: Record<string, number> = {};
    for (const row of (likesResult.data ?? []) as CountRow[]) {
      nextLikeCounts[row.post_id] = (nextLikeCounts[row.post_id] ?? 0) + 1;
    }

    const nextCommentCounts: Record<string, number> = {};
    for (const row of (commentsResult.data ?? []) as CountRow[]) {
      nextCommentCounts[row.post_id] = (nextCommentCounts[row.post_id] ?? 0) + 1;
    }

    setPosts(nextPosts);
    setLikeCounts(nextLikeCounts);
    setCommentCounts(nextCommentCounts);
    setLoading(false);
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  const pickBlogHeaderImage = async (file: File | null) => {
    if (!file) return;
    setHeaderError(null);
    setHeaderNotice(null);

    if (file.size > MAX_BLOG_IMAGE_BYTES) {
      const selectedMb = (file.size / (1024 * 1024)).toFixed(2);
      setHeaderError(
        `Header görseli en fazla ${MAX_BLOG_IMAGE_MB} MB olabilir. Seçilen dosya: ${selectedMb} MB.`
      );
      return;
    }

    try {
      const normalized = await normalizeImageToSize(file, BLOG_HEADER_WIDTH, BLOG_HEADER_HEIGHT);
      setBlogHeaderImageUrl(normalized);
      setHeaderNotice(
        `Header görseli otomatik ${BLOG_HEADER_WIDTH}x${BLOG_HEADER_HEIGHT} boyutuna ayarlandı.`
      );
    } catch (normalizeError) {
      const message =
        normalizeError instanceof Error ? normalizeError.message : "Header görseli işlenemedi.";
      setHeaderError(message);
    }
  };

  const saveBlogHeader = async () => {
    if (!userId || headerSaving) return;

    setHeaderSaving(true);
    setHeaderError(null);
    setHeaderNotice(null);

    const normalizedTitle = blogHeaderTitle.trim();
    const normalizedDescription = blogHeaderDescription.trim();
    const normalizedImageUrl = blogHeaderImageUrl.trim();

    const nextAboutDetails: Record<string, unknown> = { ...aboutDetailsBase };

    if (normalizedTitle) nextAboutDetails.blogHeaderTitle = normalizedTitle;
    else delete nextAboutDetails.blogHeaderTitle;

    if (normalizedDescription) nextAboutDetails.blogHeaderDescription = normalizedDescription;
    else delete nextAboutDetails.blogHeaderDescription;

    if (normalizedImageUrl) nextAboutDetails.blogHeaderImageUrl = normalizedImageUrl;
    else delete nextAboutDetails.blogHeaderImageUrl;

    const supabase = getSupabaseBrowserClient();
    const upsertRole = role === "designer_pending" ? "designer_pending" : "designer";
    const { error: saveError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        role: upsertRole,
        about_details: nextAboutDetails,
      },
      { onConflict: "id" }
    );

    if (saveError) {
      setHeaderError(saveError.message);
      setHeaderSaving(false);
      return;
    }

    setAboutDetailsBase(nextAboutDetails);
    setBlogHeaderTitle(normalizedTitle);
    setBlogHeaderDescription(normalizedDescription);
    setBlogHeaderImageUrl(normalizedImageUrl);
    setHeaderNotice("Kişisel blog header alanları kaydedildi.");
    setHeaderSaving(false);
  };

  const publishStateAction = async (post: BlogPostRow, nextStatus: "draft" | "published") => {
    if (workingId) return;
    setWorkingId(post.id);
    setError(null);
    setNotice(null);

    const supabase = getSupabaseBrowserClient();
    const payload =
      nextStatus === "published"
        ? {
            status: "published" as const,
            published_at: post.published_at ?? new Date().toISOString(),
          }
        : {
            status: "draft" as const,
            published_at: null,
          };

    const { error: updateError } = await supabase.from("blog_posts").update(payload).eq("id", post.id);
    if (updateError) {
      setError(updateError.message);
      setWorkingId(null);
      return;
    }

    setNotice(nextStatus === "published" ? "Yazı yayına alındı." : "Yazı taslağa alındı.");
    await load();
    setWorkingId(null);
  };

  const deletePost = async (post: BlogPostRow) => {
    if (workingId) return;
    if (!window.confirm(`"${post.title}" başlıklı yazıyı silmek istediğine emin misin?`)) return;

    setWorkingId(post.id);
    setError(null);
    setNotice(null);

    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase.from("blog_posts").delete().eq("id", post.id);
    if (deleteError) {
      setError(deleteError.message);
      setWorkingId(null);
      return;
    }

    setNotice("Yazı silindi.");
    await load();
    setWorkingId(null);
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl py-4">
        <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-600">
          Yazıların yükleniyor...
        </section>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="mx-auto w-full max-w-5xl py-4">
        <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-700">
          Yazılarını yönetmek için önce{" "}
          <Link href="/giris?redirect=%2Fblog%2Fyonet" className="font-semibold text-slate-900 underline">
            giriş yap
          </Link>
          .
        </section>
      </main>
    );
  }

  if (!isProfessionalRole(role)) {
    return (
      <main className="mx-auto w-full max-w-5xl py-4">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Blog yönetimi yalnızca profesyonel hesaplar için açık.
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl py-4">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[0_22px_55px_-40px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Yazılarımı Yönet</h1>
            <p className="mt-1 text-sm text-slate-600">Taslaklarını düzenle, yayınla veya kaldır.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/blog"
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Blog Akışı
            </Link>
            <Link
              href="/blog/yeni"
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Yeni Yazı
            </Link>
          </div>
        </div>

        <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80">
          <summary className="cursor-pointer px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Blogumu Yönet: Kişisel Header</h2>
                <p className="mt-1 text-xs text-slate-600">
                  Bu bölüm varsayılan kapalıdır. Tıklayıp açarak header bilgilerini düzenleyebilirsin.
                </p>
              </div>
              {headerError ? (
                <span className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
                  Hata var
                </span>
              ) : headerNotice ? (
                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                  Kaydedildi
                </span>
              ) : (
                <span className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
                  Aç / Düzenle
                </span>
              )}
            </div>
          </summary>

          <div className="border-t border-slate-200 px-4 pb-4 pt-3">
            <p className="text-xs text-slate-600">
              Bu alanları doldurursan, blog sayfanda üst bölümde görünür. Boş bırakırsan gösterilmez.
            </p>

            <div className="mt-3 grid gap-3">
              <input
                type="text"
                value={blogHeaderTitle}
                onChange={(event) => setBlogHeaderTitle(event.target.value)}
                placeholder="Header başlığı (opsiyonel)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <textarea
                value={blogHeaderDescription}
                onChange={(event) => setBlogHeaderDescription(event.target.value)}
                rows={3}
                placeholder="Header açıklaması (opsiyonel)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              />

              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
                <p className="text-xs text-slate-600">
                  Header görseli ({BLOG_HEADER_WIDTH}x{BLOG_HEADER_HEIGHT})
                </p>
                <div className="mt-2">
                  {blogHeaderImageUrl ? (
                    <img
                      src={blogHeaderImageUrl}
                      alt="Blog header önizleme"
                      className="h-40 w-full rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-400">
                      Henüz header görseli yok
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-3 w-full text-xs"
                  onChange={(event) => void pickBlogHeaderImage(event.target.files?.[0] ?? null)}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Yüklediğin görsel sistemde otomatik olarak {BLOG_HEADER_WIDTH}x{BLOG_HEADER_HEIGHT} boyutuna çevrilir.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Bozulma olmaması için bu orana yakın yüklemeni öneririz: 1600x520, 2400x780, 3200x1040.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Maksimum dosya boyutu: {MAX_BLOG_IMAGE_MB} MB.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBlogHeaderImageUrl("")}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Görseli Kaldır
                </button>
                <button
                  type="button"
                  onClick={() => void saveBlogHeader()}
                  disabled={headerSaving}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {headerSaving ? "Kaydediliyor..." : "Header Bilgilerini Kaydet"}
                </button>
              </div>
            </div>

            {headerError ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {headerError}
              </p>
            ) : null}
            {headerNotice ? (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {headerNotice}
              </p>
            ) : null}
          </div>
        </details>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {notice ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        {posts.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-slate-50 p-5 text-sm text-slate-600">
            Henüz yazın yok. İlk blog yazını oluşturmak için “Yeni Yazı” butonunu kullanabilirsin.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {posts.map((post) => {
              const isWorking = workingId === post.id;
              const likes = likeCounts[post.id] ?? 0;
              const comments = commentCounts[post.id] ?? 0;
              const isPublished = post.status === "published";
              const publishLabel = isPublished ? "Taslağa Al" : "Yayınla";

              return (
                <article key={post.id} className="rounded-2xl border border-black/10 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="block">
                        <h2 className="truncate text-base font-semibold text-slate-900">{post.title}</h2>
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {isPublished
                          ? `Yayında • ${formatBlogDate(post.published_at || post.created_at)}`
                          : `Taslak • ${formatBlogDate(post.updated_at || post.created_at)}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {likes} beğeni • {comments} yorum
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/blog/yeni?edit=${encodeURIComponent(post.id)}`}
                        className={`rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 ${
                          isWorking || Boolean(workingId) ? "pointer-events-none opacity-60" : ""
                        }`}
                      >
                        Düzenle
                      </Link>
                      <button
                        type="button"
                        onClick={() => void publishStateAction(post, isPublished ? "draft" : "published")}
                        disabled={isWorking || Boolean(workingId)}
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isWorking ? "İşleniyor..." : publishLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deletePost(post)}
                        disabled={isWorking || Boolean(workingId)}
                        className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
