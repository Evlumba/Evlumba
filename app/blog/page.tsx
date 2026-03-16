"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  buildDesignerProfileHref,
  fetchDesignerSlugMap,
  formatBlogDate,
  isProfessionalRole,
  normalizeAuthorParam,
  normalizeRole,
  type BlogRole,
} from "./_lib";

type BlogPostRow = {
  id: string;
  author_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
};

type BlogLikeRow = {
  post_id: string;
  user_id: string;
};

type BlogCommentRow = {
  id: string;
  post_id: string;
};

type ProfileBrief = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

type AuthorBlogProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  blogHeaderTitle: string;
  blogHeaderDescription: string;
  blogHeaderImageUrl: string;
};

function displayName(profile: ProfileBrief | undefined) {
  if (!profile) return "Profesyonel";
  return profile.full_name?.trim() || profile.business_name?.trim() || "Profesyonel";
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
    .join("") || "P";
}

function BlogPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const authorFilter = useMemo(
    () => normalizeAuthorParam(searchParams.get("author")),
    [searchParams]
  );
  const queryFilter = useMemo(() => searchParams.get("q")?.trim().toLowerCase() || "", [searchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<BlogRole>(null);
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileBrief>>({});
  const [designerSlugById, setDesignerSlugById] = useState<Record<string, string>>({});
  const [authorBlogProfile, setAuthorBlogProfile] = useState<AuthorBlogProfile | null>(null);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likeLoadingPostId, setLikeLoadingPostId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();

      const { data: authData } = await supabase.auth.getUser();
      if (cancelled) return;

      const uid = authData.user?.id ?? null;
      setUserId(uid);

      if (uid) {
        const { data: roleData } = await supabase.rpc("get_profile_role", { user_id: uid });
        if (!cancelled) setUserRole(normalizeRole(roleData));
      } else {
        setUserRole(null);
      }

      let postsQuery = supabase
        .from("blog_posts")
        .select("id, author_id, slug, title, excerpt, cover_image_url, status, published_at, created_at")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (authorFilter) {
        postsQuery = postsQuery.eq("author_id", authorFilter);
      }

      const { data: postRows, error: postsError } = await postsQuery;
      if (cancelled) return;
      if (postsError) {
        setError(postsError.message);
        setLoading(false);
        return;
      }

      const nextPosts = (postRows ?? []) as BlogPostRow[];
      const postIds = nextPosts.map((post) => post.id);
      const authorIds = Array.from(new Set(nextPosts.map((post) => post.author_id)));

      const [likesResult, commentsResult, profilesResult] = await Promise.all([
        postIds.length > 0
          ? supabase.from("blog_post_likes").select("post_id, user_id").in("post_id", postIds)
          : Promise.resolve({ data: [] as BlogLikeRow[], error: null }),
        postIds.length > 0
          ? supabase.from("blog_post_comments").select("id, post_id").in("post_id", postIds)
          : Promise.resolve({ data: [] as BlogCommentRow[], error: null }),
        authorIds.length > 0
          ? supabase.rpc("get_profile_briefs", { user_ids: authorIds })
          : Promise.resolve({ data: [] as ProfileBrief[], error: null }),
      ]);

      if (cancelled) return;
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
      if (profilesResult.error) {
        setError(profilesResult.error.message);
        setLoading(false);
        return;
      }

      const nextLikeCounts: Record<string, number> = {};
      const nextLikedIds = new Set<string>();
      for (const row of (likesResult.data ?? []) as BlogLikeRow[]) {
        nextLikeCounts[row.post_id] = (nextLikeCounts[row.post_id] ?? 0) + 1;
        if (uid && row.user_id === uid) nextLikedIds.add(row.post_id);
      }

      const nextCommentCounts: Record<string, number> = {};
      for (const row of (commentsResult.data ?? []) as BlogCommentRow[]) {
        nextCommentCounts[row.post_id] = (nextCommentCounts[row.post_id] ?? 0) + 1;
      }

      const nextProfilesById: Record<string, ProfileBrief> = {};
      for (const row of (profilesResult.data ?? []) as ProfileBrief[]) {
        nextProfilesById[row.id] = row;
      }

      const nextSlugById = await fetchDesignerSlugMap(authorIds);
      if (cancelled) return;

      let nextAuthorBlogProfile: AuthorBlogProfile | null = null;
      if (authorFilter) {
        try {
          const res = await fetch(`/api/public/blog/author/${encodeURIComponent(authorFilter)}`, {
            // cache: "no-store", // COST-FIX: use default caching
          });
          if (res.ok) {
            const json = (await res.json()) as {
              ok?: boolean;
              profile?: {
                id?: string;
                name?: string;
                avatarUrl?: string | null;
                blogHeaderTitle?: string;
                blogHeaderDescription?: string;
                blogHeaderImageUrl?: string;
              };
            } | null;
            const profile = json?.profile;
            if (profile?.id && profile?.name) {
              nextAuthorBlogProfile = {
                id: profile.id,
                name: profile.name.trim(),
                avatarUrl: profile.avatarUrl?.trim() || null,
                blogHeaderTitle: profile.blogHeaderTitle?.trim() || "",
                blogHeaderDescription: profile.blogHeaderDescription?.trim() || "",
                blogHeaderImageUrl: profile.blogHeaderImageUrl?.trim() || "",
              };
            }
          }
        } catch {
          // no-op
        }
      }

      if (!nextAuthorBlogProfile && authorFilter) {
        const fallback = nextProfilesById[authorFilter];
        if (fallback) {
          nextAuthorBlogProfile = {
            id: fallback.id,
            name: displayName(fallback),
            avatarUrl: avatarSrc(fallback),
            blogHeaderTitle: "",
            blogHeaderDescription: "",
            blogHeaderImageUrl: "",
          };
        }
      }

      setPosts(nextPosts);
      setProfilesById(nextProfilesById);
      setDesignerSlugById(nextSlugById);
      setAuthorBlogProfile(nextAuthorBlogProfile);
      setLikeCounts(nextLikeCounts);
      setCommentCounts(nextCommentCounts);
      setLikedPostIds(nextLikedIds);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authorFilter]);

  const filteredPosts = useMemo(() => {
    if (!queryFilter) return posts;
    return posts.filter((post) => {
      const haystack = `${post.title} ${post.excerpt ?? ""}`.toLowerCase();
      return haystack.includes(queryFilter);
    });
  }, [posts, queryFilter]);

  const ensureLoggedInForInteraction = () => {
    if (userId) return true;
    const redirect = encodeURIComponent(
      `${pathname}${searchParams.toString().length ? `?${searchParams.toString()}` : ""}`
    );
    router.push(`/giris?redirect=${redirect}`);
    return false;
  };

  const toggleLike = async (postId: string) => {
    if (!ensureLoggedInForInteraction() || !userId) return;
    if (likeLoadingPostId) return;

    setLikeLoadingPostId(postId);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const hasLiked = likedPostIds.has(postId);

    const query = hasLiked
      ? supabase.from("blog_post_likes").delete().eq("post_id", postId).eq("user_id", userId)
      : supabase.from("blog_post_likes").insert({ post_id: postId, user_id: userId });

    const { error: mutationError } = await query;
    if (mutationError) {
      setError(mutationError.message);
      setLikeLoadingPostId(null);
      return;
    }

    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (hasLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] ?? 0) + (hasLiked ? -1 : 1)),
    }));
    setLikeLoadingPostId(null);
  };

  const roleNotice = isProfessionalRole(userRole)
    ? "Profesyonel olarak yazı paylaşabilirsin."
    : "Blog yazısı paylaşımı yalnızca profesyoneller için açık.";
  const canManageOwnBlog = Boolean(userId && isProfessionalRole(userRole));
  const myBlogHref = userId ? `/blog?author=${encodeURIComponent(userId)}` : "/blog";

  const personalBlogTitle = authorBlogProfile?.blogHeaderTitle?.trim() || "";
  const personalBlogDescription = authorBlogProfile?.blogHeaderDescription?.trim() || "";
  const hasAuthorBlogHeader = Boolean(
    authorBlogProfile &&
      (personalBlogTitle ||
        personalBlogDescription ||
        authorBlogProfile.blogHeaderImageUrl?.trim())
  );
  const authorProfileHref = authorBlogProfile
    ? buildDesignerProfileHref({
        id: authorBlogProfile.id,
        slugById: designerSlugById,
      })
    : null;

  return (
    <main className="mx-auto w-full max-w-6xl py-4">
      <section className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-[0_22px_55px_-40px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              Evlumba Blog
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">İlham veren gerçek deneyimler</h1>
            <p className="mt-1 text-sm text-slate-600">
              Herkes okuyabilir, beğenebilir, yorum yapabilir. {roleNotice}
            </p>
            {authorFilter ? (
              <p className="mt-2 text-xs font-semibold text-slate-500">Filtre: Bu profesyonele ait yazılar</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageOwnBlog ? (
              <>
                <Link
                  href={myBlogHref}
                  className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
                >
                  Blogumu Görüntüle
                </Link>
                <Link
                  href="/blog/yonet"
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Yazılarımı Yönet
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {authorFilter && authorBlogProfile && hasAuthorBlogHeader ? (
        <section className="mt-4 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.3)]">
          {authorBlogProfile.blogHeaderImageUrl ? (
            <div className="relative mb-4 h-40 w-full overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src={authorBlogProfile.blogHeaderImageUrl}
                alt={`${authorBlogProfile.name} blog header`}
                fill
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100">
                {authorBlogProfile.avatarUrl ? (
                  <Image src={authorBlogProfile.avatarUrl} alt={authorBlogProfile.name} width={48} height={48} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-600">
                    {initials(authorBlogProfile.name)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{authorBlogProfile.name} kişisel blog</p>
                {personalBlogTitle ? (
                  <h2 className="truncate text-xl font-bold tracking-tight text-slate-900">{personalBlogTitle}</h2>
                ) : null}
                {personalBlogDescription ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">{personalBlogDescription}</p>
                ) : null}
              </div>
            </div>

            {authorProfileHref ? (
              <Link
                href={authorProfileHref}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Profili Gör
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {error ? (
        <section className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

      {loading ? (
        <section className="mt-4 rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-600">
          Blog yazıları yükleniyor...
        </section>
      ) : filteredPosts.length === 0 ? (
        <section className="mt-4 rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-600">
          Henüz gösterilecek blog yazısı yok.
        </section>
      ) : (
        <section className="mt-4 grid gap-4 md:grid-cols-2">
          {filteredPosts.map((post) => {
            const author = profilesById[post.author_id];
            const authorName = displayName(author);
            const authorAvatar = avatarSrc(author);
            const authorHref = buildDesignerProfileHref({
              id: post.author_id,
              slugById: designerSlugById,
            });
            const liked = likedPostIds.has(post.id);
            const likeCount = likeCounts[post.id] ?? 0;
            const commentCount = commentCounts[post.id] ?? 0;

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_45px_-36px_rgba(0,0,0,0.25)]"
              >
                <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="block">
                  <div className="relative h-52 w-full bg-slate-100">
                    {post.cover_image_url ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        className="object-cover transition duration-300 hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
                        Kapak görseli yok
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="block">
                    <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">{post.title}</h2>
                  </Link>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                    {post.excerpt?.trim() || "Bu yazı için kısa bir özet eklenmedi."}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatBlogDate(post.published_at || post.created_at)}</span>
                    <span>•</span>
                    <span>{commentCount} yorum</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Link
                      href={authorHref}
                      className="inline-flex min-w-0 items-center gap-2"
                    >
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-100">
                        {authorAvatar ? (
                          <Image src={authorAvatar} alt={authorName} width={32} height={32} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] font-semibold text-slate-600">
                            {initials(authorName)}
                          </div>
                        )}
                      </div>
                      <span className="truncate text-sm font-semibold text-slate-800">{authorName}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => void toggleLike(post.id)}
                      disabled={likeLoadingPostId === post.id}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                        liked
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-black/10 bg-white text-slate-700 hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {liked ? "♥" : "♡"} {likeCount}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function BlogPageFallback() {
  return (
    <main className="mx-auto w-full max-w-6xl py-4">
      <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-slate-600">
        Blog sayfası yükleniyor...
      </section>
    </main>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<BlogPageFallback />}>
      <BlogPageContent />
    </Suspense>
  );
}
