import type { MetadataRoute } from "next";
import { getBrandDirectoryEntries } from "@/lib/brand-directory";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";

type BlogSitemapRow = {
  slug: string;
  published_at: string | null;
  updated_at: string;
  created_at: string;
};

type DesignerSitemapRow = {
  slug: string | null;
  updated_at: string | null;
};

function buildStaticEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [
    "/",
    "/kesfet",
    "/tasarimcilar",
    "/blog",
    "/markalar",
    "/ilanlar",
    "/forum",
    "/oyun",
    "/sss",
    "/iletisim",
    "/gizlilik",
    "/kvkk",
    "/kullanim",
  ];

  return pages.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

async function loadBlogEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("blog_posts")
      .select("slug, published_at, updated_at, created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(5000);

    if (error || !data) return [];

    return (data as BlogSitemapRow[])
      .map((row) => {
        const slug = row.slug?.trim();
        if (!slug) return null;
        const lastModified = row.updated_at || row.published_at || row.created_at;
        return {
          url: `${SITE_URL}/blog/${encodeURIComponent(slug)}`,
          lastModified: lastModified ? new Date(lastModified) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;
  } catch {
    return [];
  }
}

async function loadDesignerEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("slug, updated_at")
      .in("role", ["designer", "designer_pending"])
      .not("slug", "is", null)
      .neq("slug", "")
      .limit(5000);

    if (error || !data) return [];

    return (data as DesignerSitemapRow[])
      .map((row) => {
        const slug = row.slug?.trim();
        if (!slug) return null;
        return {
          url: `${SITE_URL}/tasarimcilar/${encodeURIComponent(slug)}`,
          lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [staticEntries, blogEntries, brands, designerEntries] = await Promise.all([
    Promise.resolve(buildStaticEntries()),
    loadBlogEntries(),
    getBrandDirectoryEntries(),
    loadDesignerEntries(),
  ]);

  const brandEntries: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${SITE_URL}/markalar/${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...designerEntries, ...blogEntries, ...brandEntries];
}
