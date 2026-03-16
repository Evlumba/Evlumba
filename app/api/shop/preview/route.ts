import { NextResponse } from "next/server";

export const runtime = "nodejs";
// COST-FIX: Product previews rarely change — cache for 24 hours
export const revalidate = 86400;

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function extractMetaContent(html: string, key: string, attr: "property" | "name" = "property") {
  const pattern = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["'][^>]*>`,
    "i"
  );
  return decodeHtml(firstNonEmpty(html.match(pattern)?.[1], html.match(reversePattern)?.[1]));
}

function extractTitle(html: string) {
  const fromOg = extractMetaContent(html, "og:title");
  if (fromOg) return fromOg;

  const fromTwitter = extractMetaContent(html, "twitter:title", "name");
  if (fromTwitter) return fromTwitter;

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
  return decodeHtml(titleTag.trim());
}

function extractImage(html: string) {
  return firstNonEmpty(
    extractMetaContent(html, "og:image"),
    extractMetaContent(html, "twitter:image", "name")
  );
}

function extractPrice(html: string) {
  const metaPrice = firstNonEmpty(
    extractMetaContent(html, "product:price:amount"),
    extractMetaContent(html, "og:price:amount"),
    extractMetaContent(html, "twitter:data1", "name")
  );
  if (metaPrice) return metaPrice;

  const itemPropPrice = html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (itemPropPrice) return decodeHtml(itemPropPrice.trim());

  const jsonLdPrice = html.match(/"price"\s*:\s*"([^"]+)"/i)?.[1];
  if (jsonLdPrice) return decodeHtml(jsonLdPrice.trim());

  return "";
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const target = requestUrl.searchParams.get("url")?.trim() || "";
    if (!target) {
      return NextResponse.json({ ok: false, error: "Ürün linki zorunlu." }, { status: 400 });
    }

    let parsedTarget: URL;
    try {
      parsedTarget = new URL(target);
    } catch {
      return NextResponse.json({ ok: false, error: "Geçerli bir URL gir." }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedTarget.protocol)) {
      return NextResponse.json({ ok: false, error: "Sadece http/https linkleri destekleniyor." }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    let response: Response;
    try {
      response = await fetch(parsedTarget.toString(), {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; EvlumbaShopPreview/1.0; +https://www.evlumba.com)",
          accept: "text/html,application/xhtml+xml",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: `Linkten bilgi alınamadı (${response.status}).` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const title = extractTitle(html);
    const image = extractImage(html);
    const price = extractPrice(html);

    return NextResponse.json({
      ok: true,
      title,
      image,
      price,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ürün bilgisi çekilemedi.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
