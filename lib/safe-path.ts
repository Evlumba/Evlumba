const APP_CANONICAL_ORIGIN = "https://www.evlumba.com";
const APP_ALLOWED_HOSTS = new Set(["evlumba.com", "www.evlumba.com", "localhost", "127.0.0.1"]);

export function sanitizeInternalPath(raw: string | null | undefined, fallback = "/"): string {
  const value = String(raw ?? "").trim();
  if (!value || !value.startsWith("/")) return fallback;

  try {
    const parsed = new URL(value, APP_CANONICAL_ORIGIN);
    if (parsed.origin !== APP_CANONICAL_ORIGIN) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function normalizeAppUrlToPath(raw: string | null | undefined): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;

  if (value.startsWith("/")) {
    const path = sanitizeInternalPath(value, "");
    return path || null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (!APP_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) return null;
  const path = sanitizeInternalPath(`${parsed.pathname}${parsed.search}${parsed.hash}`, "");
  return path || null;
}
