"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildDesignerProfileHref, fetchDesignerSlugMap, formatBlogDate } from "../_lib";

type BlogPostRow = {
  id: string;
  author_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
};

type BlogCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type AdminRole = "admin" | "super_admin";

type ProfileBrief = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

function displayName(profile: ProfileBrief | undefined) {
  if (!profile) return "Kullanıcı";
  return profile.full_name?.trim() || profile.business_name?.trim() || "Kullanıcı";
}

function avatarSrc(profile: ProfileBrief | undefined) {
  const value = profile?.avatar_url?.trim() || "";
  return value || null;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "K";
}

function getAdminBadgeLabel(role: AdminRole | null | undefined) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return null;
}

async function fetchUserAdminRoles(userIds: string[]) {
  const ids = Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean)));
  if (ids.length === 0) return {} as Record<string, AdminRole>;

  try {
    const response = await fetch("/api/public/user-admin-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // cache: "no-store", // COST-FIX: use default caching
      body: JSON.stringify({ userIds: ids }),
    });
    const json = (await response.json().catch(() => null)) as
      | { ok?: boolean; roles?: Record<string, AdminRole> }
      | null;
    if (!response.ok || !json?.ok) return {};
    return json.roles ?? {};
  } catch {
    return {};
  }
}

export default function BlogDetailPage() {
  const params = useParams<{ slug: string | string[] }>();
  const pathname = usePathname();
  const router = useRouter();
  const slug = useMemo(() => {
    const value = params?.slug;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileBrief>>({});
  const [designerSlugById, setDesignerSlugById] = useState<Record<string, string>>({});
  const [adminRoleByUserId, setAdminRoleByUserId] = useState<Record<string, AdminRole>>({});
  const [comments, setComments] = useState<BlogCommentRow[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSending, setCommentSending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!slug) {
        setError("Blog yazısı bulunamadı.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();

      const { data: authData } = await supabase.auth.getUser();
      if (cancelled) return;
      const uid = authData.user?.id ?? null;
      setUserId(uid);

      const { data: postRow, error: postError } = await supabase
        .from("blog_posts")
        .select("id, author_id, slug, title, excerpt, cover_image_url, content, status, published_at, created_at")
        .eq("slug", slug)
        .maybeSingle();

      if (cancelled) return;
      if (postError || !postRow) {
        setError("Blog yazısı bulunamadı.");
        setLoading(false);
        return;
      }

      const typedPost = postRow as BlogPostRow;
      if (typedPost.status !== "published" && typedPost.author_id !== uid) {
        setError("Bu yazıyı görüntüleme yetkin yok.");
        setLoading(false);
        return;
      }

      const [{ data: likeRows, error: likesError }, { data: commentRows, error: commentsError }] = await Promise.all([
        supabase.from("blog_post_likes").select("post_id, user_id").eq("post_id", typedPost.id),
        supabase
          .from("blog_post_comments")
          .select("id, post_id, user_id, body, created_at")
          .eq("post_id", typedPost.id)
          .order("created_at", { ascending: true }),
      ]);

      if (cancelled) return;
      if (likesError) {
        setError(likesError.message);
        setLoading(false);
        return;
      }
      if (commentsError) {
        setError(commentsError.message);
        setLoading(false);
        return;
      }

      const commentUserIds = Array.from(
        new Set(((commentRows ?? []) as BlogCommentRow[]).map((comment) => comment.user_id))
      );
      const userIds = Array.from(new Set([typedPost.author_id, ...commentUserIds]));
      let profileRows: ProfileBrief[] = [];
      if (userIds.length > 0) {
        const { data: rpcRows, error: profilesError } = await supabase.rpc("get_profile_briefs", {
          user_ids: userIds,
        });
        if (profilesError) {
          setError(profilesError.message);
          setLoading(false);
          return;
        }
        profileRows = (rpcRows ?? []) as ProfileBrief[];
      }

      const nextProfilesById: Record<string, ProfileBrief> = {};
      for (const row of profileRows) nextProfilesById[row.id] = row;

      const nextSlugById = await fetchDesignerSlugMap([typedPost.author_id]);
      if (cancelled) return;

      const typedLikes = (likeRows ?? []) as Array<{ post_id: string; user_id: string }>;
      const adminRoleMap = await fetchUserAdminRoles(userIds);
      if (cancelled) return;
      setPost(typedPost);
      setComments((commentRows ?? []) as BlogCommentRow[]);
      setProfilesById(nextProfilesById);
      setDesignerSlugById(nextSlugById);
      setAdminRoleByUserId(adminRoleMap);
      setLikeCount(typedLikes.length);
      setLiked(Boolean(uid && typedLikes.some((row) => row.user_id === uid)));
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const ensureLoggedInForInteraction = () => {
    if (userId) return true;
    const redirect = encodeURIComponent(pathname || "/blog");
    router.push(`/giris?redirect=${redirect}`);
    return false;
  };

  const toggleLike = async () => {
    if (!post || !ensureLoggedInForInteraction() || !userId || likeLoading) return;
    setLikeLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const query = liked
      ? supabase.from("blog_post_likes").delete().eq("post_id", post.id).eq("user_id", userId)
      : supabase.from("blog_post_likes").insert({ post_id: post.id, user_id: userId });

    const { error: mutationError } = await query;
    if (mutationError) {
      setError(mutationError.message);
      setLikeLoading(false);
      return;
    }

    setLiked((prev) => !prev);
    setLikeCount((prev) => Math.max(0, prev + (liked ? -1 : 1)));
    setLikeLoading(false);
  };

  const submitComment = async () => {
    if (!post || !ensureLoggedInForInteraction() || !userId || commentSending) return;
    const body = commentDraft.trim();
    if (body.length < 1) {
      setError("Yorum boş olamaz.");
      return;
    }

    setCommentSending(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("blog_post_comments").insert({
      post_id: post.id,
      user_id: userId,
      body,
    });

    if (insertError) {
      setError(insertError.message);
      setCommentSending(false);
      return;
    }

    const { data: nextComments, error: reloadError } = await supabase
      .from("blog_post_comments")
      .select("id, post_id, user_id, body, created_at")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    if (reloadError) {
      setError(reloadError.message);
      setCommentSending(false);
      return;
    }

    const nextCommentRows = (nextComments ?? []) as BlogCommentRow[];
    const nextAdminRoles = await fetchUserAdminRoles(nextCommentRows.map((comment) => comment.user_id));
    const missingUserIds = Array.from(
      new Set(nextCommentRows.map((comment) => comment.user_id).filter((id) => !profilesById[id]))
    );
    if (missingUserIds.length > 0) {
      const { data: profileRows } = await supabase.rpc("get_profile_briefs", { user_ids: missingUserIds });
      const nextProfiles = { ...profilesById };
      for (const row of ((profileRows ?? []) as ProfileBrief[])) {
        nextProfiles[row.id] = row;
      }
      setProfilesById(nextProfiles);
    }

    setComments(nextCommentRows);
    setAdminRoleByUserId(nextAdminRoles);
    setCommentDraft("");
    setCommentSending(false);
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl py-4">
        <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-600">
          Yazı yükleniyor...
        </section>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto w-full max-w-4xl py-4">
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error || "Blog yazısı bulunamadı."}
        </section>
      </main>
    );
  }

  const author = profilesById[post.author_id];
  const authorName = displayName(author);
  const authorAvatar = avatarSrc(author);
  const authorAdminBadge = getAdminBadgeLabel(adminRoleByUserId[post.author_id]);
  const authorHref = buildDesignerProfileHref({
    id: post.author_id,
    slugById: designerSlugById,
  });
  const authorBlogHref = `/blog?author=${encodeURIComponent(post.author_id)}`;

  return (
    <main className="mx-auto w-full max-w-4xl py-4">
      <Link href="/blog" className="inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-900">
        ← Blog akışına dön
      </Link>

      <article className="mt-3 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_24px_60px_-45px_rgba(0,0,0,0.35)]">
        <div className="relative h-64 w-full bg-slate-100 md:h-80">
          {post.cover_image_url ? (
            <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
              Kapak görseli yok
            </div>
          )}
        </div>
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{post.title}</h1>
          {post.excerpt?.trim() ? <p className="mt-3 text-base leading-7 text-slate-700">{post.excerpt.trim()}</p> : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-slate-50 px-3 py-2.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link
                href={authorHref}
                className="inline-flex min-w-0 items-center gap-2"
              >
                <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-200">
                  {authorAvatar ? (
                    <Image src={authorAvatar} alt={authorName} width={36} height={36} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-600">
                      {initials(authorName)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p
                      className={[
                        "truncate text-sm font-semibold",
                        authorAdminBadge
                          ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800"
                          : "text-slate-900",
                      ].join(" ")}
                    >
                      {authorName}
                    </p>
                    {authorAdminBadge ? (
                      <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                        {authorAdminBadge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">{formatBlogDate(post.published_at || post.created_at)}</p>
                </div>
              </Link>
              <Link
                href={authorBlogHref}
                className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
              >
                Yazarın Blogu
              </Link>
            </div>

            <button
              type="button"
              onClick={() => void toggleLike()}
              disabled={likeLoading}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                liked
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-black/10 bg-white text-slate-700 hover:bg-slate-100"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {liked ? "♥" : "♡"} {likeCount}
            </button>
          </div>

          <div className="prose prose-slate mt-6 max-w-none whitespace-pre-wrap text-base leading-8 text-slate-800">
            {post.content}
          </div>
        </div>
      </article>

      <section id="yorumlar" className="mt-4 rounded-3xl border border-black/10 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Yorumlar ({comments.length})</h2>

        {error ? (
          <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {comments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Henüz yorum yok. İlk yorumu sen bırak.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {comments.map((comment) => {
              const commentAuthor = profilesById[comment.user_id];
              const commentAuthorName = displayName(commentAuthor);
              const commentAuthorAvatar = avatarSrc(commentAuthor);
              const commentAuthorAdminBadge = getAdminBadgeLabel(adminRoleByUserId[comment.user_id]);
              return (
                <article key={comment.id} className="rounded-2xl border border-black/10 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200">
                      {commentAuthorAvatar ? (
                        <Image
                          src={commentAuthorAvatar}
                          alt={commentAuthorName}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] font-semibold text-slate-600">
                          {initials(commentAuthorName)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={[
                            "truncate text-sm font-semibold",
                            commentAuthorAdminBadge
                              ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800"
                              : "text-slate-900",
                          ].join(" ")}
                        >
                          {commentAuthorName}
                        </p>
                        {commentAuthorAdminBadge ? (
                          <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                            {commentAuthorAdminBadge}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500">{formatBlogDate(comment.created_at)}</p>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{comment.body}</p>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-4">
          <textarea
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            rows={4}
            placeholder="Yorumunu yaz..."
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={commentSending}
              className="rounded-xl border border-black/10 bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {commentSending ? "Gönderiliyor..." : "Yorum Gönder"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
