import Link from "next/link";
import { formatBlogDate } from "@/app/blog/_lib";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { Designer } from "../../_data/designers";

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  created_at: string;
};

function resolveDesignerId(designer: Designer) {
  if (designer.liveDesignerId) return designer.liveDesignerId;
  if (designer.slug.startsWith("supa_")) return designer.slug.slice(5);
  return null;
}

function isMissingBlogPostsTableError(message?: string | null) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("blog_posts") &&
    (normalized.includes("schema cache") ||
      normalized.includes("could not find the table") ||
      normalized.includes("does not exist") ||
      normalized.includes("relation"))
  );
}

export default async function BlogSection({ designer }: { designer: Designer }) {
  const designerId = resolveDesignerId(designer);
  const admin = getSupabaseAdminClient();
  const blogHeaderTitle = designer.about?.blogHeaderTitle?.trim() || "";
  const blogHeaderDescription = designer.about?.blogHeaderDescription?.trim() || "";
  const blogHeaderImageUrl = designer.about?.blogHeaderImageUrl?.trim() || "";

  let posts: BlogPostRow[] = [];
  let loadError: string | null = null;

  if (designerId) {
    const { data, error } = await admin
      .from("blog_posts")
      .select("id, slug, title, excerpt, published_at, created_at")
      .eq("author_id", designerId)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      if (!isMissingBlogPostsTableError(error.message)) {
        loadError = error.message;
      }
    } else {
      posts = (data ?? []) as BlogPostRow[];
    }
  }

  return (
    <section id="blog" className="scroll-mt-16">
      <div className="mx-auto mt-8 max-w-6xl px-4">
        <div className="rounded-[28px] border border-black/5 bg-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.18)]">
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{designer.name} Blog Yazıları</h2>
              {designerId ? (
                <Link
                  href={`/blog?author=${encodeURIComponent(designerId)}`}
                  className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"
                >
                  Tümünü Gör
                </Link>
              ) : null}
            </div>

            {blogHeaderImageUrl ? (
              <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-violet-100">
                <img
                  src={blogHeaderImageUrl}
                  alt={`${designer.name} blog header`}
                  className="h-40 w-full object-cover"
                />
              </div>
            ) : null}

            {blogHeaderTitle || blogHeaderDescription ? (
              <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
                {blogHeaderTitle ? <h3 className="text-base font-semibold text-violet-900">{blogHeaderTitle}</h3> : null}
                {blogHeaderDescription ? <p className="mt-1 text-sm leading-6 text-violet-800">{blogHeaderDescription}</p> : null}
              </div>
            ) : null}

            {!designerId ? (
              <p className="mt-4 text-sm text-gray-500">Bu profil için blog bağlantısı henüz hazır değil.</p>
            ) : loadError ? (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                Blog yazıları yüklenemedi: {loadError}
              </p>
            ) : posts.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">Bu profesyonel henüz blog yazısı paylaşmadı.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {posts.map((post) => (
                  <article key={post.id} className="rounded-2xl bg-gray-50/80 p-4 ring-1 ring-gray-100">
                    <Link
                      href={`/blog/${encodeURIComponent(post.slug)}`}
                      className="text-base font-semibold text-gray-900 hover:text-violet-700"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">{formatBlogDate(post.published_at || post.created_at)}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">
                      {post.excerpt?.trim() || "Bu yazı için kısa bir özet paylaşılmadı."}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
