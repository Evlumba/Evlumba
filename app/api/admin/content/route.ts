import { NextResponse } from "next/server";
import { jsonError, requireAdmin, UUID_REGEX, writeAdminAuditLog } from "../_lib";

export const runtime = "nodejs";
// export const dynamic = "force-dynamic"; // COST-FIX
export const revalidate = 60; // COST-FIX: 1 min for admin

type ContentTarget =
  | "blog_post"
  | "forum_post"
  | "listing"
  | "blog_comment"
  | "forum_reply"
  | "project_review"
  | "designer_project";

type ContentAction = "delete" | "send_to_draft";

type BlogPostRow = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  created_at: string;
  published_at: string | null;
};

type ForumPostRow = {
  id: string;
  topic_id: string;
  author_id: string;
  body: string;
  created_at: string;
  forum_topics: { title: string | null } | Array<{ title: string | null }> | null;
};

type BlogCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  blog_posts:
    | {
        title: string | null;
        slug: string | null;
      }
    | Array<{
        title: string | null;
        slug: string | null;
      }>
    | null;
};

type ForumReplyRow = {
  id: string;
  topic_id: string;
  author_id: string;
  parent_post_id: string | null;
  body: string;
  created_at: string;
  forum_topics: { title: string | null } | Array<{ title: string | null }> | null;
};

type ProjectReviewRow = {
  id: string;
  designer_id: string;
  homeowner_id: string;
  project_id: string | null;
  rating: number | null;
  review_text: string | null;
  created_at: string;
  designer_projects: { title: string | null } | Array<{ title: string | null }> | null;
};

type ListingRow = {
  id: string;
  owner_id: string;
  title: string;
  city: string;
  status: "draft" | "published" | "closed";
  created_at: string;
};

type DesignerProjectRow = {
  id: string;
  designer_id: string;
  title: string;
  is_published: boolean;
  created_at: string;
};

type ProfileBrief = {
  id: string;
  full_name: string | null;
  business_name: string | null;
};

function isContentTarget(value: unknown): value is ContentTarget {
  return (
    value === "blog_post" ||
    value === "forum_post" ||
    value === "listing" ||
    value === "blog_comment" ||
    value === "forum_reply" ||
    value === "project_review" ||
    value === "designer_project"
  );
}

function isContentAction(value: unknown): value is ContentAction {
  return value === "delete" || value === "send_to_draft";
}

function sanitizeLikeInput(value: string) {
  return value.replace(/[%_]/g, "").trim();
}

function displayName(profileMap: Record<string, ProfileBrief>, userId: string) {
  const profile = profileMap[userId];
  return profile?.full_name?.trim() || profile?.business_name?.trim() || userId;
}

function topicTitleFromRow(row: ForumPostRow) {
  if (!row.forum_topics) return "";
  if (Array.isArray(row.forum_topics)) {
    return row.forum_topics[0]?.title?.trim() || "";
  }
  return row.forum_topics.title?.trim() || "";
}

function topicTitleFromReplyRow(row: ForumReplyRow) {
  if (!row.forum_topics) return "";
  if (Array.isArray(row.forum_topics)) {
    return row.forum_topics[0]?.title?.trim() || "";
  }
  return row.forum_topics.title?.trim() || "";
}

function blogTitleFromCommentRow(row: BlogCommentRow) {
  if (!row.blog_posts) return "";
  if (Array.isArray(row.blog_posts)) {
    return row.blog_posts[0]?.title?.trim() || "";
  }
  return row.blog_posts.title?.trim() || "";
}

function blogSlugFromCommentRow(row: BlogCommentRow) {
  if (!row.blog_posts) return "";
  if (Array.isArray(row.blog_posts)) {
    return row.blog_posts[0]?.slug?.trim() || "";
  }
  return row.blog_posts.slug?.trim() || "";
}

function projectTitleFromReviewRow(row: ProjectReviewRow) {
  if (!row.designer_projects) return "";
  if (Array.isArray(row.designer_projects)) {
    return row.designer_projects[0]?.title?.trim() || "";
  }
  return row.designer_projects.title?.trim() || "";
}

export async function GET(request: Request) {
  try {
    const guard = await requireAdmin("admin");
    if (!guard.ok) return guard.response;

    const { admin } = guard.context;
    const { searchParams } = new URL(request.url);
    const q = sanitizeLikeInput(searchParams.get("q") ?? "");

    let blogQuery = admin
      .from("blog_posts")
      .select("id, author_id, title, slug, status, created_at, published_at")
      .order("created_at", { ascending: false })
      .limit(40);

    let forumQuery = admin
      .from("forum_posts")
      .select("id, topic_id, author_id, body, created_at, forum_topics(title)")
      .is("parent_post_id", null)
      .order("created_at", { ascending: false })
      .limit(40);

    let blogCommentQuery = admin
      .from("blog_post_comments")
      .select("id, post_id, user_id, body, created_at, blog_posts(title, slug)")
      .order("created_at", { ascending: false })
      .limit(40);

    let forumReplyQuery = admin
      .from("forum_posts")
      .select("id, topic_id, author_id, parent_post_id, body, created_at, forum_topics(title)")
      .not("parent_post_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(40);

    let projectReviewQuery = admin
      .from("designer_reviews")
      .select("id, designer_id, homeowner_id, project_id, rating, review_text, created_at, designer_projects(title)")
      .order("created_at", { ascending: false })
      .limit(40);

    let listingQuery = admin
      .from("listings")
      .select("id, owner_id, title, city, status, created_at")
      .order("created_at", { ascending: false })
      .limit(40);

    let projectQuery = admin
      .from("designer_projects")
      .select("id, designer_id, title, is_published, created_at")
      .order("created_at", { ascending: false })
      .limit(40);

    if (q) {
      blogQuery = blogQuery.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);
      forumQuery = forumQuery.ilike("body", `%${q}%`);
      blogCommentQuery = blogCommentQuery.ilike("body", `%${q}%`);
      forumReplyQuery = forumReplyQuery.ilike("body", `%${q}%`);
      projectReviewQuery = projectReviewQuery.ilike("review_text", `%${q}%`);
      listingQuery = listingQuery.or(`title.ilike.%${q}%,city.ilike.%${q}%`);
      projectQuery = projectQuery.ilike("title", `%${q}%`);
    }

    const [blogResult, forumResult, blogCommentResult, forumReplyResult, projectReviewResult, listingResult, projectResult] =
      await Promise.all([blogQuery, forumQuery, blogCommentQuery, forumReplyQuery, projectReviewQuery, listingQuery, projectQuery]);

    if (blogResult.error) return jsonError(blogResult.error.message, 500);
    if (forumResult.error) return jsonError(forumResult.error.message, 500);
    if (blogCommentResult.error) return jsonError(blogCommentResult.error.message, 500);
    if (forumReplyResult.error) return jsonError(forumReplyResult.error.message, 500);
    if (projectReviewResult.error) return jsonError(projectReviewResult.error.message, 500);
    if (listingResult.error) return jsonError(listingResult.error.message, 500);
    if (projectResult.error) return jsonError(projectResult.error.message, 500);

    const blogPosts = (blogResult.data ?? []) as BlogPostRow[];
    const forumPosts = (forumResult.data ?? []) as ForumPostRow[];
    const blogComments = (blogCommentResult.data ?? []) as BlogCommentRow[];
    const forumReplies = (forumReplyResult.data ?? []) as ForumReplyRow[];
    const projectReviews = (projectReviewResult.data ?? []) as ProjectReviewRow[];
    const listings = (listingResult.data ?? []) as ListingRow[];
    const designerProjects = (projectResult.data ?? []) as DesignerProjectRow[];

    const authorIds = Array.from(
      new Set([
        ...blogPosts.map((item) => item.author_id),
        ...forumPosts.map((item) => item.author_id),
        ...blogComments.map((item) => item.user_id),
        ...forumReplies.map((item) => item.author_id),
        ...projectReviews.map((item) => item.homeowner_id),
        ...projectReviews.map((item) => item.designer_id),
        ...listings.map((item) => item.owner_id),
        ...designerProjects.map((item) => item.designer_id),
      ].filter(Boolean))
    );

    let profileMap: Record<string, ProfileBrief> = {};
    if (authorIds.length > 0) {
      const profileResult = await admin.rpc("get_profile_briefs", { user_ids: authorIds });
      if (profileResult.error) return jsonError(profileResult.error.message, 500);

      profileMap = ((profileResult.data ?? []) as ProfileBrief[]).reduce<Record<string, ProfileBrief>>(
        (acc, row) => {
          acc[row.id] = row;
          return acc;
        },
        {}
      );
    }

    return NextResponse.json({
      ok: true,
      blogPosts: blogPosts.map((item) => ({
        id: item.id,
        authorId: item.author_id,
        authorName: displayName(profileMap, item.author_id),
        title: item.title,
        slug: item.slug,
        status: item.status,
        createdAt: item.created_at,
        publishedAt: item.published_at,
      })),
      forumPosts: forumPosts.map((item) => ({
        id: item.id,
        topicId: item.topic_id,
        topicTitle: topicTitleFromRow(item),
        authorId: item.author_id,
        authorName: displayName(profileMap, item.author_id),
        body: item.body,
        createdAt: item.created_at,
      })),
      blogComments: blogComments.map((item) => ({
        id: item.id,
        postId: item.post_id,
        postTitle: blogTitleFromCommentRow(item),
        postSlug: blogSlugFromCommentRow(item),
        userId: item.user_id,
        userName: displayName(profileMap, item.user_id),
        body: item.body,
        createdAt: item.created_at,
      })),
      forumReplies: forumReplies.map((item) => ({
        id: item.id,
        topicId: item.topic_id,
        topicTitle: topicTitleFromReplyRow(item),
        parentPostId: item.parent_post_id,
        authorId: item.author_id,
        authorName: displayName(profileMap, item.author_id),
        body: item.body,
        createdAt: item.created_at,
      })),
      projectReviews: projectReviews.map((item) => ({
        id: item.id,
        designerId: item.designer_id,
        designerName: displayName(profileMap, item.designer_id),
        homeownerId: item.homeowner_id,
        homeownerName: displayName(profileMap, item.homeowner_id),
        projectId: item.project_id,
        projectTitle: projectTitleFromReviewRow(item),
        rating: item.rating,
        reviewText: item.review_text ?? "",
        createdAt: item.created_at,
      })),
      listings: listings.map((item) => ({
        id: item.id,
        ownerId: item.owner_id,
        ownerName: displayName(profileMap, item.owner_id),
        title: item.title,
        city: item.city,
        status: item.status,
        createdAt: item.created_at,
      })),
      designerProjects: designerProjects.map((item) => ({
        id: item.id,
        designerId: item.designer_id,
        designerName: displayName(profileMap, item.designer_id),
        title: item.title,
        isPublished: item.is_published,
        createdAt: item.created_at,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İçerikler alınamadı.";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdmin("admin");
    if (!guard.ok) return guard.response;

    const { actorRole, actorUserId, admin } = guard.context;
    const body = (await request.json().catch(() => null)) as
      | {
          targetType?: ContentTarget;
          targetId?: string;
          action?: ContentAction;
          reason?: string;
        }
      | null;

    const targetType = body?.targetType;
    if (!isContentTarget(targetType)) {
      return jsonError("Geçersiz içerik türü.");
    }

    const targetId = String(body?.targetId ?? "").trim();
    if (!UUID_REGEX.test(targetId)) {
      return jsonError("Geçerli bir içerik id gönderilmedi.");
    }

    const action = body?.action ?? "delete";
    if (!isContentAction(action)) {
      return jsonError("Geçersiz içerik aksiyonu.");
    }

    if (action === "send_to_draft" && targetType !== "designer_project") {
      return jsonError("Taslağa gönderme aksiyonu yalnızca projeler için kullanılabilir.");
    }

    if (targetType === "blog_post" && action === "delete") {
      const { error } = await admin.from("blog_posts").delete().eq("id", targetId);
      if (error) return jsonError(error.message, 500);
    }

    if (targetType === "forum_post" && action === "delete") {
      const { error } = await admin.from("forum_posts").delete().eq("id", targetId);
      if (error) return jsonError(error.message, 500);
    }

    if (targetType === "listing" && action === "delete") {
      const { error } = await admin.from("listings").delete().eq("id", targetId);
      if (error) return jsonError(error.message, 500);
    }

    if (targetType === "blog_comment" && action === "delete") {
      const { error } = await admin.from("blog_post_comments").delete().eq("id", targetId);
      if (error) return jsonError(error.message, 500);
    }

    if (targetType === "forum_reply" && action === "delete") {
      const { error } = await admin
        .from("forum_posts")
        .delete()
        .eq("id", targetId)
        .not("parent_post_id", "is", null);
      if (error) return jsonError(error.message, 500);
    }

    if (targetType === "project_review" && action === "delete") {
      const { error } = await admin.from("designer_reviews").delete().eq("id", targetId);
      if (error) return jsonError(error.message, 500);
    }

    if (targetType === "designer_project" && action === "delete") {
      const { error } = await admin.from("designer_projects").delete().eq("id", targetId);
      if (error) return jsonError(error.message, 500);
    }

    if (targetType === "designer_project" && action === "send_to_draft") {
      const { error } = await admin
        .from("designer_projects")
        .update({ is_published: false })
        .eq("id", targetId);
      if (error) return jsonError(error.message, 500);
    }

    await writeAdminAuditLog(admin, {
      actorUserId,
      actorRole,
      action: action === "send_to_draft" ? "content_send_to_draft" : "content_delete",
      targetType,
      targetId,
      details: {
        action,
        reason: String(body?.reason ?? "").trim().slice(0, 600) || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İçerik moderasyonu başarısız oldu.";
    return jsonError(message, 500);
  }
}
