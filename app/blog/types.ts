export type BlogRole = "homeowner" | "designer" | "designer_pending" | null;

export type BlogListPostRow = {
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

export type BlogDetailPostRow = BlogListPostRow & {
  content: string;
};

export type BlogLikeRow = {
  post_id: string;
  user_id: string;
};

export type BlogCommentCountRow = {
  id: string;
  post_id: string;
};

export type BlogCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type AdminRole = "admin" | "super_admin";

export type ProfileBrief = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

export type AuthorBlogProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  blogHeaderTitle: string;
  blogHeaderDescription: string;
  blogHeaderImageUrl: string;
};

export type BlogPageInitialData = {
  userId: string | null;
  userRole: BlogRole;
  posts: BlogListPostRow[];
  profilesById: Record<string, ProfileBrief>;
  designerSlugById: Record<string, string>;
  authorBlogProfile: AuthorBlogProfile | null;
  likeCounts: Record<string, number>;
  commentCounts: Record<string, number>;
  likedPostIds: string[];
  error: string | null;
};

export type BlogDetailInitialData = {
  userId: string | null;
  post: BlogDetailPostRow;
  profilesById: Record<string, ProfileBrief>;
  designerSlugById: Record<string, string>;
  adminRoleByUserId: Record<string, AdminRole>;
  comments: BlogCommentRow[];
  likeCount: number;
  liked: boolean;
  error: string | null;
};

export type BlogPostSeoRow = {
  id: string;
  author_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
