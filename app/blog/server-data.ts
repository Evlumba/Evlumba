import { FEATURED_DESIGNERS } from "@/app/tasarimcilar/_data/designers";
import { buildUniqueDesignerSlugs, type SlugProfile } from "@/app/tasarimcilar/_data/slugs";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@supabase/supabase-js";
import { normalizeRole } from "./_lib";
import type {
  AdminRole,
  AuthorBlogProfile,
  BlogCommentCountRow,
  BlogCommentRow,
  BlogDetailInitialData,
  BlogDetailPostRow,
  BlogLikeRow,
  BlogListPostRow,
  BlogPageInitialData,
  BlogPostSeoRow,
  BlogRole,
  ProfileBrief,
} from "./types";

type BlogReadClient = ReturnType<typeof getSupabaseAdminClient>;

async function getBlogReadClient(): Promise<BlogReadClient> {
  try {
    return getSupabaseAdminClient();
  } catch {
    const { url, anonKey } = getSupabasePublicEnv();
    return createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }) as unknown as BlogReadClient;
  }
}

async function getAuthContext(db: BlogReadClient): Promise<{ userId: string | null; userRole: BlogRole }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;
    if (!userId) return { userId: null, userRole: null };

    const { data: roleData } = await db.rpc("get_profile_role", { user_id: userId });
    return { userId, userRole: normalizeRole(roleData) };
  } catch {
    return { userId: null, userRole: null };
  }
}

async function buildDesignerSlugById(ids: string[], db: BlogReadClient) {
  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  if (uniqueIds.length === 0) return {} as Record<string, string>;

  try {
    const { data, error } = await db
      .from("profiles")
      .select("id, full_name, business_name")
      .in("role", ["designer", "designer_pending"])
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (error || !data) return {};

    const slugMap = buildUniqueDesignerSlugs(
      data as SlugProfile[],
      FEATURED_DESIGNERS.map((designer) => designer.slug)
    );

    const byId: Record<string, string> = {};
    for (const id of uniqueIds) {
      const slug = slugMap.get(id);
      if (slug) byId[id] = slug;
    }
    return byId;
  } catch {
    return {};
  }
}

function buildProfileMap(rows: ProfileBrief[]) {
  const byId: Record<string, ProfileBrief> = {};
  for (const row of rows) byId[row.id] = row;
  return byId;
}

function displayName(profile: ProfileBrief | undefined) {
  if (!profile) return "Profesyonel";
  return profile.full_name?.trim() || profile.business_name?.trim() || "Profesyonel";
}

function avatarSrc(profile: ProfileBrief | undefined) {
  const value = profile?.avatar_url?.trim() || "";
  return value || null;
}

async function loadAuthorBlogProfile(authorFilter: string, db: BlogReadClient) {
  try {
    const { data, error } = await db
      .from("profiles")
      .select("id, full_name, business_name, avatar_url, about_details")
      .eq("id", authorFilter)
      .in("role", ["designer", "designer_pending"])
      .maybeSingle();

    if (error || !data) return null;

    const row = data as {
      id: string;
      full_name: string | null;
      business_name: string | null;
      avatar_url: string | null;
      about_details: Record<string, unknown> | null;
    };

    const name = row.full_name?.trim() || row.business_name?.trim() || "Profesyonel";
    const aboutDetails = (row.about_details ?? {}) as Record<string, unknown>;

    const profile: AuthorBlogProfile = {
      id: row.id,
      name,
      avatarUrl: row.avatar_url?.trim() || null,
      blogHeaderTitle:
        typeof aboutDetails.blogHeaderTitle === "string"
          ? aboutDetails.blogHeaderTitle.trim()
          : "",
      blogHeaderDescription:
        typeof aboutDetails.blogHeaderDescription === "string"
          ? aboutDetails.blogHeaderDescription.trim()
          : "",
      blogHeaderImageUrl:
        typeof aboutDetails.blogHeaderImageUrl === "string"
          ? aboutDetails.blogHeaderImageUrl.trim()
          : "",
    };

    return profile;
  } catch {
    return null;
  }
}

export async function getBlogAuthorSeoProfile(authorId: string) {
  const value = authorId.trim();
  if (!value) return null;

  const db = await getBlogReadClient();
  const profile = await loadAuthorBlogProfile(value, db);
  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
  };
}

export async function getBlogPageInitialData({
  authorFilter,
}: {
  authorFilter: string | null;
}): Promise<BlogPageInitialData> {
  const db = await getBlogReadClient();
  const auth = await getAuthContext(db);

  const initial: BlogPageInitialData = {
    userId: auth.userId,
    userRole: auth.userRole,
    posts: [],
    profilesById: {},
    designerSlugById: {},
    authorBlogProfile: null,
    likeCounts: {},
    commentCounts: {},
    likedPostIds: [],
    error: null,
  };

  let postsQuery = db
    .from("blog_posts")
    .select("id, author_id, slug, title, excerpt, cover_image_url, status, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (authorFilter) {
    postsQuery = postsQuery.eq("author_id", authorFilter);
  }

  const { data: postRows, error: postsError } = await postsQuery;
  if (postsError) {
    initial.error = postsError.message;
    return initial;
  }

  const posts = (postRows ?? []) as BlogListPostRow[];
  const postIds = posts.map((post) => post.id);
  const authorIds = Array.from(new Set(posts.map((post) => post.author_id)));

  const [likesResult, commentsResult, profilesResult, authorBlogProfile] = await Promise.all([
    postIds.length > 0
      ? db.from("blog_post_likes").select("post_id, user_id").in("post_id", postIds)
      : Promise.resolve({ data: [] as BlogLikeRow[], error: null }),
    postIds.length > 0
      ? db.from("blog_post_comments").select("id, post_id").in("post_id", postIds)
      : Promise.resolve({ data: [] as BlogCommentCountRow[], error: null }),
    authorIds.length > 0
      ? db.rpc("get_profile_briefs", { user_ids: authorIds })
      : Promise.resolve({ data: [] as ProfileBrief[], error: null }),
    authorFilter ? loadAuthorBlogProfile(authorFilter, db) : Promise.resolve(null),
  ]);

  if (likesResult.error) {
    initial.error = likesResult.error.message;
    return initial;
  }
  if (commentsResult.error) {
    initial.error = commentsResult.error.message;
    return initial;
  }
  if (profilesResult.error) {
    initial.error = profilesResult.error.message;
    return initial;
  }

  const likeCounts: Record<string, number> = {};
  const likedPostIds = new Set<string>();
  for (const row of (likesResult.data ?? []) as BlogLikeRow[]) {
    likeCounts[row.post_id] = (likeCounts[row.post_id] ?? 0) + 1;
    if (auth.userId && row.user_id === auth.userId) {
      likedPostIds.add(row.post_id);
    }
  }

  const commentCounts: Record<string, number> = {};
  for (const row of (commentsResult.data ?? []) as BlogCommentCountRow[]) {
    commentCounts[row.post_id] = (commentCounts[row.post_id] ?? 0) + 1;
  }

  const profilesById = buildProfileMap((profilesResult.data ?? []) as ProfileBrief[]);
  const designerSlugById = await buildDesignerSlugById(authorIds, db);

  let resolvedAuthorProfile = authorBlogProfile;
  if (!resolvedAuthorProfile && authorFilter) {
    const fallback = profilesById[authorFilter];
    if (fallback) {
      resolvedAuthorProfile = {
        id: fallback.id,
        name: displayName(fallback),
        avatarUrl: avatarSrc(fallback),
        blogHeaderTitle: "",
        blogHeaderDescription: "",
        blogHeaderImageUrl: "",
      };
    }
  }

  return {
    userId: auth.userId,
    userRole: auth.userRole,
    posts,
    profilesById,
    designerSlugById,
    authorBlogProfile: resolvedAuthorProfile,
    likeCounts,
    commentCounts,
    likedPostIds: Array.from(likedPostIds),
    error: null,
  };
}

export async function getBlogDetailInitialData(slug: string): Promise<BlogDetailInitialData | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return null;

  const db = await getBlogReadClient();
  const auth = await getAuthContext(db);

  const { data: postRow, error: postError } = await db
    .from("blog_posts")
    .select("id, author_id, slug, title, excerpt, cover_image_url, content, status, published_at, created_at")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (postError || !postRow) return null;
  const post = postRow as BlogDetailPostRow;

  if (post.status !== "published" && post.author_id !== auth.userId) {
    return null;
  }

  const [{ data: likeRows, error: likesError }, { data: commentRows, error: commentsError }] = await Promise.all([
    db.from("blog_post_likes").select("post_id, user_id").eq("post_id", post.id),
    db
      .from("blog_post_comments")
      .select("id, post_id, user_id, body, created_at")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true }),
  ]);

  if (likesError || commentsError) return null;

  const comments = (commentRows ?? []) as BlogCommentRow[];
  const commentUserIds = Array.from(new Set(comments.map((comment) => comment.user_id)));
  const userIds = Array.from(new Set([post.author_id, ...commentUserIds]));

  const [profilesResult, adminResult, slugById] = await Promise.all([
    userIds.length > 0
      ? db.rpc("get_profile_briefs", { user_ids: userIds })
      : Promise.resolve({ data: [] as ProfileBrief[], error: null }),
    userIds.length > 0
      ? db
          .from("admin_users")
          .select("user_id, role")
          .in("user_id", userIds)
          .eq("is_active", true)
      : Promise.resolve({ data: [] as Array<{ user_id: string; role: AdminRole }>, error: null }),
    buildDesignerSlugById([post.author_id], db),
  ]);

  if (profilesResult.error) return null;

  const profilesById = buildProfileMap((profilesResult.data ?? []) as ProfileBrief[]);
  const adminRoleByUserId: Record<string, AdminRole> = {};
  if (!adminResult.error) {
    for (const row of ((adminResult.data ?? []) as Array<{ user_id: string; role: AdminRole }>)) {
      adminRoleByUserId[row.user_id] = row.role;
    }
  }

  const typedLikes = (likeRows ?? []) as BlogLikeRow[];
  return {
    userId: auth.userId,
    post,
    profilesById,
    designerSlugById: slugById,
    adminRoleByUserId,
    comments,
    likeCount: typedLikes.length,
    liked: Boolean(auth.userId && typedLikes.some((row) => row.user_id === auth.userId)),
    error: null,
  };
}

export async function getBlogPostSeoBySlug(slug: string): Promise<BlogPostSeoRow | null> {
  const value = slug.trim();
  if (!value) return null;

  const db = await getBlogReadClient();
  const { data, error } = await db
    .from("blog_posts")
    .select(
      "id, author_id, slug, title, excerpt, content, cover_image_url, status, published_at, created_at, updated_at"
    )
    .eq("slug", value)
    .maybeSingle();

  if (error || !data) return null;
  return data as BlogPostSeoRow;
}
