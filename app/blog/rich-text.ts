const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "pre",
  "code",
  "span",
  "a",
  "img",
]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function hasLikelyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function normalizeHref(raw: string | null) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (value.startsWith("/")) return value;

  try {
    const parsed = new URL(value);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:" || protocol === "mailto:" || protocol === "tel:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeImageSrc(raw: string | null) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (value.startsWith("/")) return value;

  const lower = value.toLowerCase();
  if (lower.startsWith("data:image/")) {
    const match = value.match(
      /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,([a-z0-9+/=\s]+)$/i
    );
    if (!match) return null;
    return value.replace(/\s+/g, "");
  }

  try {
    const parsed = new URL(value);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeFontSize(style: string | null) {
  const value = String(style ?? "");
  const match = value.match(/font-size\s*:\s*([0-9]{1,3})(px|rem|em|%)?/i);
  if (!match) return null;

  const rawSize = Number(match[1]);
  if (!Number.isFinite(rawSize)) return null;

  const unit = (match[2] || "px").toLowerCase();
  let sizePx = rawSize;
  if (unit === "rem" || unit === "em") sizePx = rawSize * 16;
  if (unit === "%") sizePx = (rawSize / 100) * 16;

  const clamped = Math.max(12, Math.min(40, Math.round(sizePx)));
  return `font-size:${clamped}px`;
}

function sizeAttrToFontSize(sizeAttr: string | null) {
  const value = Number(sizeAttr);
  if (!Number.isFinite(value)) return null;
  const map: Record<number, number> = {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 22,
    6: 28,
    7: 34,
  };
  return map[Math.max(1, Math.min(7, Math.round(value)))] ?? 16;
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();

  if (tag === "script" || tag === "style" || tag === "iframe" || tag === "object" || tag === "embed") {
    return "";
  }

  const children = Array.from(element.childNodes).map(sanitizeNode).join("");

  if (tag === "br") return "<br>";

  if (tag === "a") {
    const href = normalizeHref(element.getAttribute("href"));
    if (!href) return children;
    const label = children || escapeHtml(href);
    return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer nofollow">${label}</a>`;
  }

  if (tag === "img") {
    const src = normalizeImageSrc(element.getAttribute("src"));
    if (!src) return "";
    const alt = String(element.getAttribute("alt") ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy">`;
  }

  if (tag === "font") {
    const size = sizeAttrToFontSize(element.getAttribute("size"));
    if (!size) return children;
    return `<span style="font-size:${size}px">${children}</span>`;
  }

  if (tag === "span") {
    const fontSize = normalizeFontSize(element.getAttribute("style"));
    if (!fontSize) return children;
    return `<span style="${fontSize}">${children}</span>`;
  }

  if (tag === "div") {
    return `<p>${children}</p>`;
  }

  if (!ALLOWED_TAGS.has(tag)) return children;
  return `<${tag}>${children}</${tag}>`;
}

export function extractPlainTextFromRichText(value: string) {
  const text = String(value ?? "");
  if (!text.trim()) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeBlogRichTextHtml(value: string) {
  const input = String(value ?? "").trim();
  if (!input) return "";

  if (!hasLikelyHtml(input)) {
    return escapeHtml(input).replace(/\r?\n/g, "<br>");
  }

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return escapeHtml(extractPlainTextFromRichText(input)).replace(/\r?\n/g, "<br>");
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(input, "text/html");
  return Array.from(document.body.childNodes).map(sanitizeNode).join("").trim();
}

export function toEditableBlogHtml(value: string) {
  const input = String(value ?? "").trim();
  if (!input) return "<p></p>";

  if (!hasLikelyHtml(input)) {
    return escapeHtml(input).replace(/\r?\n/g, "<br>");
  }

  const sanitized = sanitizeBlogRichTextHtml(input);
  return sanitized || "<p></p>";
}
