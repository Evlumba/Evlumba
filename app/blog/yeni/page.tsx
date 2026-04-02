"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isProfessionalRole, normalizeRole, slugifyBlogTitle, type BlogRole } from "../_lib";
import {
  extractPlainTextFromRichText,
  sanitizeBlogRichTextHtml,
  toEditableBlogHtml,
} from "../rich-text";

type BlogStatus = "draft" | "published";
const BLOG_COVER_WIDTH = 1600;
const BLOG_COVER_HEIGHT = 900;
const MAX_BLOG_IMAGE_MB = 5;
const MAX_BLOG_IMAGE_BYTES = MAX_BLOG_IMAGE_MB * 1024 * 1024;
const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 22, 28, 34];

async function buildUniqueSlug(baseSlug: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug")
    .ilike("slug", `${baseSlug}%`);

  if (error || !data) return baseSlug;
  const taken = new Set(data.map((item) => item.slug));
  if (!taken.has(baseSlug)) return baseSlug;

  let index = 2;
  while (taken.has(`${baseSlug}-${index}`)) index += 1;
  return `${baseSlug}-${index}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Görsel yüklenemedi"));
    image.src = src;
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

  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else if (sourceRatio < targetRatio) {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.84);
}

function NewBlogPostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPostId = searchParams.get("edit")?.trim() || null;
  const isEditMode = Boolean(editPostId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<BlogRole>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [editorSeed, setEditorSeed] = useState("");
  const [selectedFontSize, setSelectedFontSize] = useState(16);
  const [status, setStatus] = useState<BlogStatus>("draft");
  const [existingPublishedAt, setExistingPublishedAt] = useState<string | null>(null);
  const [hasEditablePost, setHasEditablePost] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const pickCoverImage = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setNotice(null);

    if (file.size > MAX_BLOG_IMAGE_BYTES) {
      const selectedMb = (file.size / (1024 * 1024)).toFixed(2);
      setError(
        `Kapak görseli en fazla ${MAX_BLOG_IMAGE_MB} MB olabilir. Seçilen dosya: ${selectedMb} MB.`
      );
      return;
    }

    try {
      const normalized = await normalizeImageToSize(file, BLOG_COVER_WIDTH, BLOG_COVER_HEIGHT);
      setCoverImageUrl(normalized);
      setNotice(`Kapak görseli ${BLOG_COVER_WIDTH}x${BLOG_COVER_HEIGHT} olarak ayarlandı.`);
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Kapak görseli yüklenemedi.");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      if (cancelled) return;

      const uid = authData.user?.id ?? null;
      setUserId(uid);

      if (uid) {
        const { data: roleData } = await supabase.rpc("get_profile_role", { user_id: uid });
        if (!cancelled) setRole(normalizeRole(roleData));
      } else {
        setRole(null);
        setHasEditablePost(false);
      }

      if (uid && editPostId) {
        const { data: postRow, error: postError } = await supabase
          .from("blog_posts")
          .select("id, author_id, title, excerpt, cover_image_url, content, status, published_at")
          .eq("id", editPostId)
          .maybeSingle();

        if (!cancelled) {
          if (postError) {
            setError(postError.message);
            setHasEditablePost(false);
          } else if (!postRow || postRow.author_id !== uid) {
            setError("Düzenlenecek yazı bulunamadı.");
            setHasEditablePost(false);
          } else {
            setTitle(postRow.title ?? "");
            setExcerpt(postRow.excerpt ?? "");
            setCoverImageUrl(postRow.cover_image_url ?? "");
            setContent(postRow.content ?? "");
            setEditorSeed(postRow.content ?? "");
            setStatus((postRow.status as BlogStatus) ?? "draft");
            setExistingPublishedAt(postRow.published_at ?? null);
            setHasEditablePost(true);
          }
        }
      } else if (!cancelled) {
        setHasEditablePost(false);
        setEditorSeed("");
      }

      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [editPostId]);

  useEffect(() => {
    if (loading) return;
    if (!editorRef.current) return;
    editorRef.current.innerHTML = toEditableBlogHtml(editorSeed);
    setContent(editorRef.current.innerHTML);
  }, [editorSeed, loading]);

  const canCreate = Boolean(userId && isProfessionalRole(role));

  const syncContentFromEditor = () => {
    if (!editorRef.current) return;
    setContent(editorRef.current.innerHTML);
  };

  const runCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    syncContentFromEditor();
  };

  const applyFontSize = (sizePx: number) => {
    if (!editorRef.current) return;
    setSelectedFontSize(sizePx);
    editorRef.current.focus();
    document.execCommand("fontSize", false, "7");

    const fontTags = editorRef.current.querySelectorAll("font[size='7']");
    fontTags.forEach((fontTag) => {
      const span = document.createElement("span");
      span.style.fontSize = `${sizePx}px`;
      span.innerHTML = fontTag.innerHTML;
      fontTag.replaceWith(span);
    });
    syncContentFromEditor();
  };

  const insertLink = () => {
    if (!editorRef.current) return;
    const raw = window.prompt("Link URL (https://...)");
    if (!raw) return;
    const value = raw.trim();
    if (!value) return;

    const normalized = value.startsWith("/") ? value : /^https?:\/\//i.test(value) ? value : `https://${value}`;
    runCommand("createLink", normalized);
  };

  const submit = async () => {
    const rawEditorHtml = editorRef.current?.innerHTML ?? content;
    const safeContentHtml = sanitizeBlogRichTextHtml(rawEditorHtml);
    const plainContent = extractPlainTextFromRichText(safeContentHtml);

    if (!userId) {
      setError("Yazı oluşturmak için giriş yapman gerekiyor.");
      return;
    }
    if (!canCreate) {
      setError("Blog yazısı paylaşımı yalnızca profesyoneller için açık.");
      return;
    }
    if (title.trim().length < 5) {
      setError("Başlık en az 5 karakter olmalı.");
      return;
    }
    if (plainContent.length < 20) {
      setError("İçerik en az 20 karakter olmalı.");
      return;
    }
    if (isEditMode && !hasEditablePost) {
      setError("Düzenlenecek yazı bulunamadı.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = getSupabaseBrowserClient();

      if (isEditMode && editPostId) {
        const payload = {
          title: title.trim(),
          excerpt: excerpt.trim() || null,
          cover_image_url: coverImageUrl.trim() || null,
          content: safeContentHtml,
          status,
          published_at:
            status === "published"
              ? existingPublishedAt ?? new Date().toISOString()
              : null,
        };

        const { error: updateError } = await supabase
          .from("blog_posts")
          .update(payload)
          .eq("id", editPostId)
          .eq("author_id", userId);

        if (updateError) {
          setError(updateError.message || "Yazı güncellenemedi.");
          setSubmitting(false);
          return;
        }

        setNotice(status === "published" ? "Yazı güncellendi ve yayında." : "Yazı güncellendi (taslak).");
        router.push("/blog/yonet");
        return;
      }

      const baseSlug = slugifyBlogTitle(title.trim());
      const slug = await buildUniqueSlug(baseSlug);

      const { data: inserted, error: insertError } = await supabase
        .from("blog_posts")
        .insert({
          author_id: userId,
          slug,
          title: title.trim(),
          excerpt: excerpt.trim() || null,
          cover_image_url: coverImageUrl.trim() || null,
          content: safeContentHtml,
          status,
          published_at: status === "published" ? new Date().toISOString() : null,
        })
        .select("slug")
        .single();

      if (insertError || !inserted) {
        setError(insertError?.message || "Yazı oluşturulamadı.");
        setSubmitting(false);
        return;
      }

      setNotice(status === "published" ? "Yazın yayına alındı." : "Yazın taslak olarak kaydedildi.");
      router.push("/blog/yonet");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Yazı oluşturulamadı.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl py-4">
        <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-600">
          Blog editörü hazırlanıyor...
        </section>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="mx-auto w-full max-w-4xl py-4">
        <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-700">
          Yazı oluşturmak için önce{" "}
          <Link href="/giris?redirect=%2Fblog%2Fyeni" className="font-semibold text-slate-900 underline">
            giriş yap
          </Link>
          .
        </section>
      </main>
    );
  }

  if (!canCreate) {
    return (
      <main className="mx-auto w-full max-w-4xl py-4">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Blog yazısı oluşturma yalnızca profesyonel hesaplar için açık.
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl py-4">
      <section className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[0_22px_55px_-40px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isEditMode ? "Blog Yazısını Düzenle" : "Yeni Blog Yazısı"}
          </h1>
          <Link
            href="/blog/yonet"
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Yazılarımı Yönet
          </Link>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {notice ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Başlık"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            disabled={submitting}
          />
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={3}
            placeholder="Kısa özet (opsiyonel)"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            disabled={submitting}
          />
          <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-600">
              Kapak görseli ({BLOG_COVER_WIDTH}x{BLOG_COVER_HEIGHT})
            </div>
            <div className="mt-2">
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="Kapak önizleme" className="h-44 w-full rounded-xl border object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center rounded-xl border bg-white text-xs text-slate-400">
                  Kapak görseli seçilmedi
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="mt-3 w-full text-xs"
              onChange={(event) => void pickCoverImage(event.target.files?.[0] ?? null)}
              disabled={submitting}
            />
            <p className="mt-2 text-xs text-slate-500">
              Sadece bilgisayardan görsel yüklenir; sistem otomatik kırpıp ölçekler. Maksimum dosya boyutu {MAX_BLOG_IMAGE_MB} MB.
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-black/10 bg-slate-50 px-3 py-2">
              <button
                type="button"
                onClick={() => runCommand("bold")}
                disabled={submitting}
                className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                title="Kalın"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => runCommand("italic")}
                disabled={submitting}
                className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold italic text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                title="İtalik"
              >
                I
              </button>
              <button
                type="button"
                onClick={insertLink}
                disabled={submitting}
                className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                title="Link ekle"
              >
                Link
              </button>
              <label className="ml-1 text-xs font-semibold text-slate-600">
                Punto
                <select
                  value={selectedFontSize}
                  onChange={(event) => applyFontSize(Number(event.target.value))}
                  disabled={submitting}
                  className="ml-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-slate-700"
                >
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div
              ref={editorRef}
              contentEditable={!submitting}
              suppressContentEditableWarning
              onInput={syncContentFromEditor}
              className="min-h-[340px] w-full px-3 py-3 text-sm leading-7 text-slate-900 outline-none [&_a]:text-sky-700 [&_a]:underline"
              role="textbox"
              aria-label="Blog içeriği"
            />
          </div>
          <p className="text-xs text-slate-500">
            Metni seçip <strong>kalın</strong>, <em>italik</em>, <span style={{ fontSize: 18 }}>punto</span> veya link uygulayabilirsin.
          </p>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as BlogStatus)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            disabled={submitting}
          >
            <option value="draft">Taslak kaydet</option>
            <option value="published">Hemen yayınla</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting || (isEditMode && !hasEditablePost)}
            className="rounded-xl border border-black/10 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Kaydediliyor..." : isEditMode ? "Güncelle" : "Kaydet"}
          </button>
        </div>
      </section>
    </main>
  );
}

function NewBlogPostPageFallback() {
  return (
    <main className="mx-auto w-full max-w-4xl py-4">
      <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-600">
        Blog editörü hazırlanıyor...
      </section>
    </main>
  );
}

export default function NewBlogPostPage() {
  return (
    <Suspense fallback={<NewBlogPostPageFallback />}>
      <NewBlogPostPageContent />
    </Suspense>
  );
}
