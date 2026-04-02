import type { Metadata } from "next";
import BlogPageClient from "./BlogPageClient";
import { normalizeAuthorParam } from "./_lib";
import { getBlogAuthorSeoProfile, getBlogPageInitialData } from "./server-data";
import { toAbsoluteUrl, trimForDescription } from "@/lib/seo";

export const revalidate = 300;

type PageSearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams: Promise<PageSearchParams>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toSchemaJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const authorFilter = normalizeAuthorParam(firstParam(params.author));
  const query = firstParam(params.q).trim();

  const defaultTitle = "İç Mimar, Mimar ve Dekorasyon Blogu";
  const defaultDescription =
    "İç mimarlık, mimarlık, dekorasyon ve tasarım dünyasından gerçek deneyimler, uygulama fikirleri ve profesyonel ipuçları.";

  const authorProfile = authorFilter ? await getBlogAuthorSeoProfile(authorFilter) : null;
  const title = authorProfile
    ? `${authorProfile.name} yazıları`
    : defaultTitle;
  const description = authorProfile
    ? trimForDescription(
        `${authorProfile.name} tarafından paylaşılan iç mimar, mimar ve dekorasyon içeriklerini keşfet.`
      )
    : defaultDescription;

  const canonicalPath =
    authorFilter && !query ? `/blog?author=${encodeURIComponent(authorFilter)}` : "/blog";
  const shouldNoindex = query.length > 0;

  return {
    title,
    description,
    keywords: [
      "iç mimar",
      "mimar",
      "dekorasyon",
      "tasarım",
      "iç mimarlık blog",
      "ev dekorasyonu fikirleri",
      "mimari ilham",
    ],
    alternates: {
      canonical: canonicalPath,
    },
    robots: shouldNoindex
      ? {
          index: false,
          follow: true,
        }
      : undefined,
    openGraph: {
      title,
      description,
      url: toAbsoluteUrl(canonicalPath),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const authorFilter = normalizeAuthorParam(firstParam(params.author));
  const queryFilter = firstParam(params.q).trim();
  const initialData = await getBlogPageInitialData({ authorFilter });

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: initialData.posts.slice(0, 12).map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: post.title,
      url: toAbsoluteUrl(`/blog/${encodeURIComponent(post.slug)}`),
    })),
  };

  return (
    <>
      {initialData.posts.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toSchemaJson(itemListSchema) }}
        />
      ) : null}
      <BlogPageClient
        key={`${authorFilter ?? "all"}::${queryFilter}`}
        initialData={initialData}
      />
    </>
  );
}
