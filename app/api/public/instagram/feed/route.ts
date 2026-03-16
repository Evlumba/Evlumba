import { NextResponse } from "next/server";

// export const dynamic = "force-dynamic"; // COST-FIX
export const revalidate = 21600; // COST-FIX: 6 hours
export const runtime = "nodejs";

type InstagramPost = {
  id: string;
  shortcode: string;
  postUrl: string;
  imageUrl: string;
  caption: string;
  takenAt: number;
};

const USERNAME_REGEX = /^[a-zA-Z0-9._]{1,30}$/;
const REQUEST_TIMEOUT_MS = 9000;

function decodeEscaped(value: string) {
  return value
    .replaceAll("\\u0026", "&")
    .replaceAll("\\u003d", "=")
    .replaceAll("\\u0025", "%")
    .replaceAll("\\/", "/")
    .replaceAll("\\\"", "\"")
    .replaceAll("&amp;", "&");
}

function normalizeImageUrl(value: unknown) {
  const decoded = decodeEscaped(String(value ?? "").trim());
  if (!decoded) return "";
  if (decoded.startsWith("//")) return `https:${decoded}`;
  return decoded;
}

function pickLargestThumbnail(
  values:
    | Array<{ src?: string; url?: string; width?: number; config_width?: number }>
    | undefined
) {
  if (!Array.isArray(values) || values.length === 0) return "";
  const sorted = [...values].sort(
    (a, b) =>
      Number(b.width ?? b.config_width ?? 0) - Number(a.width ?? a.config_width ?? 0)
  );
  return normalizeImageUrl(sorted[0]?.src ?? sorted[0]?.url ?? "");
}

function normalizeInstagramUsername(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (raw.includes("instagram.com")) {
    try {
      const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      const firstPath = parsed.pathname
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)[0];
      return (firstPath ?? "").replace(/^@+/, "");
    } catch {
      return "";
    }
  }

  return raw.replace(/^@+/, "");
}

function buildPostFromNode(node: Record<string, unknown>): InstagramPost | null {
  const shortcode = String(node.shortcode ?? node.code ?? "").trim();
  if (!shortcode) return null;

  const takenAt =
    Number(node.taken_at_timestamp ?? node.taken_at ?? node.device_timestamp ?? 0) || 0;
  const imageVersions2 = node.image_versions2 as
    | { candidates?: Array<{ url?: string }> }
    | undefined;
  const carouselMedia = node.carousel_media as
    | Array<{
        image_versions2?: { candidates?: Array<{ url?: string }> };
      }>
    | undefined;
  const thumbnailResources = node.thumbnail_resources as
    | Array<{ src?: string; width?: number }>
    | undefined;
  const displayResources = node.display_resources as
    | Array<{ src?: string; config_width?: number }>
    | undefined;

  const imageUrl = normalizeImageUrl(
    node.display_url ??
      node.thumbnail_src ??
      node.thumbnail_url ??
      node.media_url ??
      node.image_url ??
      imageVersions2?.candidates?.[0]?.url ??
      carouselMedia?.[0]?.image_versions2?.candidates?.[0]?.url ??
      pickLargestThumbnail(thumbnailResources) ??
      pickLargestThumbnail(displayResources) ??
      ""
  );
  if (!imageUrl) return null;

  const captionEdges =
    (node.edge_media_to_caption as { edges?: Array<{ node?: { text?: string } }> } | undefined)?.edges ?? [];
  const caption = String(
    captionEdges[0]?.node?.text ??
      ((node.caption as { text?: string } | undefined)?.text ?? node.accessibility_caption ?? "")
  ).trim();

  return {
    id: String(node.id ?? shortcode),
    shortcode,
    postUrl: `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/`,
    imageUrl,
    caption,
    takenAt,
  };
}

function dedupeAndSlice(posts: InstagramPost[]) {
  const unique = new Map<string, InstagramPost>();
  for (const post of posts) {
    if (!unique.has(post.shortcode)) unique.set(post.shortcode, post);
  }
  return Array.from(unique.values())
    .sort((a, b) => b.takenAt - a.takenAt)
    .slice(0, 5);
}

function findUserId(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const queue: unknown[] = [value];
  const visited = new WeakSet<object>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }

    const obj = current as Record<string, unknown>;
    const userId = String(obj.id ?? obj.pk ?? "").trim();
    const username = String(obj.username ?? "").trim();
    if (userId && /^\d+$/.test(userId) && username) return userId;

    for (const child of Object.values(obj)) queue.push(child);
  }

  return "";
}

function collectPostsFromUnknown(value: unknown, target: InstagramPost[], seen: WeakSet<object>) {
  if (value === null || value === undefined) return;
  if (typeof value !== "object") return;

  if (Array.isArray(value)) {
    for (const item of value) {
      collectPostsFromUnknown(item, target, seen);
    }
    return;
  }

  if (seen.has(value)) return;
  seen.add(value);

  const obj = value as Record<string, unknown>;
  const maybePost = buildPostFromNode(obj);
  if (maybePost) target.push(maybePost);

  for (const child of Object.values(obj)) {
    collectPostsFromUnknown(child, target, seen);
  }
}

function extractPostsFromJsonPayload(payload: unknown) {
  const result: InstagramPost[] = [];
  collectPostsFromUnknown(payload, result, new WeakSet<object>());
  return dedupeAndSlice(result);
}

async function fetchJsonPayload(url: string, username: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      // cache: "no-store", // COST-FIX: use default caching
      signal: controller.signal,
      headers: {
        "x-ig-app-id": "936619743392459",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        accept: "application/json,text/plain,*/*",
        referer: `https://www.instagram.com/${encodeURIComponent(username)}/`,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchInstagramPrimaryJson(username: string): Promise<InstagramPost[]> {
  const payload = await fetchJsonPayload(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    username
  );
  if (!payload) return [];
  return extractPostsFromJsonPayload(payload);
}

async function fetchInstagramLegacyJson(username: string): Promise<InstagramPost[]> {
  const payload = await fetchJsonPayload(
    `https://www.instagram.com/${encodeURIComponent(username)}/?__a=1&__d=dis`,
    username
  );
  if (!payload) return [];
  return extractPostsFromJsonPayload(payload);
}

async function fetchInstagramMobileFeed(username: string): Promise<InstagramPost[]> {
  const profilePayload = await fetchJsonPayload(
    `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    username
  );
  if (!profilePayload) return [];

  const userId = findUserId(profilePayload);
  if (!userId) return [];

  const feedPayload = await fetchJsonPayload(
    `https://i.instagram.com/api/v1/feed/user/${encodeURIComponent(userId)}/username/?count=12`,
    username
  );
  if (!feedPayload) return [];

  return extractPostsFromJsonPayload(feedPayload);
}

function extractPostsFromHtmlChunks(html: string): InstagramPost[] {
  const parts = html.split('"shortcode":"');
  if (parts.length <= 1) return [];

  const posts: InstagramPost[] = [];
  for (let i = 1; i < parts.length; i += 1) {
    const section = parts[i];
    const shortcode = section.split('"')[0]?.trim() ?? "";
    if (!shortcode) continue;

    const snippet = section.slice(0, 12000);
    const imageMatch = snippet.match(/"(?:display_url|thumbnail_src)":"([^"]+)"/);
    const timeMatch = snippet.match(/"taken_at_timestamp":(\d+)/);
    const captionMatch = snippet.match(/"accessibility_caption":"([^"]*)"/);

    const imageUrl = normalizeImageUrl(imageMatch?.[1] ?? "");
    if (!imageUrl) continue;

    posts.push({
      id: `${shortcode}-${i}`,
      shortcode,
      postUrl: `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/`,
      imageUrl,
      caption: decodeEscaped(captionMatch?.[1] ?? "").trim(),
      takenAt: Number(timeMatch?.[1] ?? 0) || 0,
    });
  }

  return dedupeAndSlice(posts);
}

async function fetchInstagramHtml(username: string): Promise<InstagramPost[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      // cache: "no-store", // COST-FIX: use default caching
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return [];

    const html = await res.text();

    const jsonScriptMatches = Array.from(
      html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi)
    );
    for (const match of jsonScriptMatches) {
      const rawJson = match[1]?.trim() ?? "";
      if (!rawJson.startsWith("{") && !rawJson.startsWith("[")) continue;
      try {
        const payload = JSON.parse(rawJson) as unknown;
        const posts = extractPostsFromJsonPayload(payload);
        if (posts.length > 0) return posts;
      } catch {
        // continue fallback path
      }
    }

    return extractPostsFromHtmlChunks(html);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const normalizedUsername = normalizeInstagramUsername(searchParams.get("username"));

    if (!normalizedUsername || !USERNAME_REGEX.test(normalizedUsername)) {
      return NextResponse.json(
        { ok: false, error: "Geçerli bir Instagram kullanıcı adı gerekli." },
        { status: 400 }
      );
    }

    let posts = await fetchInstagramPrimaryJson(normalizedUsername);
    if (posts.length === 0) posts = await fetchInstagramLegacyJson(normalizedUsername);
    if (posts.length === 0) posts = await fetchInstagramMobileFeed(normalizedUsername);
    if (posts.length === 0) posts = await fetchInstagramHtml(normalizedUsername);

    if (posts.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Instagram gönderileri şu an alınamadı. Lütfen biraz sonra tekrar dene." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      username: normalizedUsername,
      profileUrl: `https://www.instagram.com/${encodeURIComponent(normalizedUsername)}/`,
      posts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram içerikleri yüklenemedi.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
