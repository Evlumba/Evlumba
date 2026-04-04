import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogDetailClient from "./BlogDetailClient";
import { getBlogPostSeoBySlug, getBlogDetailInitialData } from "../server-data";
import { extractPlainTextFromRichText } from "../rich-text";
import { toAbsoluteUrl, trimForDescription } from "@/lib/seo";

type PageParams = {
  slug: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

function toSchemaJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostSeoBySlug(slug);

  if (!post) {
    return {
      title: "Blog yazısı bulunamadı",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = post.title;
  const description = trimForDescription(
    post.excerpt?.trim() ||
      extractPlainTextFromRichText(post.content) ||
      "İç mimar, mimar ve dekorasyon içerikleri."
  );
  const canonicalPath = `/blog/${encodeURIComponent(post.slug)}`;
  const isPublished = post.status === "published";
  const rawMetaCover = post.cover_image_url?.trim() || "";
  const imageUrl =
    rawMetaCover && !rawMetaCover.startsWith("data:")
      ? toAbsoluteUrl(rawMetaCover)
      : undefined;

  return {
    title,
    description,
    keywords: [
      "iç mimar",
      "mimar",
      "dekorasyon",
      "tasarım",
      "iç mimarlık",
      "mimari ilham",
    ],
    alternates: {
      canonical: canonicalPath,
    },
    robots: isPublished
      ? undefined
      : {
          index: false,
          follow: false,
        },
    openGraph: {
      title,
      description,
      type: "article",
      url: toAbsoluteUrl(canonicalPath),
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at || post.published_at || post.created_at,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const initialData = await getBlogDetailInitialData(slug);
  if (!initialData) {
    notFound();
  }

  const canonicalPath = `/blog/${encodeURIComponent(initialData.post.slug)}`;
  const rawCover = initialData.post.cover_image_url?.trim() || "";
  const imageUrl =
    rawCover && !rawCover.startsWith("data:")
      ? toAbsoluteUrl(rawCover)
      : undefined;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: initialData.post.title,
    description: trimForDescription(
      initialData.post.excerpt?.trim() ||
        extractPlainTextFromRichText(initialData.post.content)
    ),
    datePublished: initialData.post.published_at || initialData.post.created_at,
    dateModified: initialData.post.published_at || initialData.post.created_at,
    mainEntityOfPage: toAbsoluteUrl(canonicalPath),
    image: imageUrl ? [imageUrl] : undefined,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Blog",
        item: toAbsoluteUrl("/blog"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: initialData.post.title,
        item: toAbsoluteUrl(canonicalPath),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toSchemaJson(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toSchemaJson(breadcrumbSchema) }}
      />
      <BlogDetailClient initialData={initialData} />
    </>
  );
}
