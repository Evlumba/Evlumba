import { NextResponse } from "next/server";

// export const dynamic = "force-dynamic"; // COST-FIX
export const revalidate = 86400; // COST-FIX: 24 hours
export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 10000;

function isAllowedInstagramImageHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "cdninstagram.com" ||
    host.endsWith(".cdninstagram.com") ||
    host === "fbcdn.net" ||
    host.endsWith(".fbcdn.net")
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get("url")?.trim() || "";
    if (!rawUrl) {
      return NextResponse.json({ ok: false, error: "Görsel URL zorunlu." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz görsel URL." }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ ok: false, error: "Sadece http/https destekleniyor." }, { status: 400 });
    }

    if (!isAllowedInstagramImageHost(parsed.hostname)) {
      return NextResponse.json({ ok: false, error: "Desteklenmeyen görsel kaynağı." }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let upstream: Response;
    try {
      upstream = await fetch(parsed.toString(), {
        // cache: "no-store", // COST-FIX: use default caching
        signal: controller.signal,
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          referer: "https://www.instagram.com/",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { ok: false, error: `Instagram görseli alınamadı (${upstream.status}).` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram görseli yüklenemedi.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
