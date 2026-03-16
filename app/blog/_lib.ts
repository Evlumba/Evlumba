export type BlogRole = "homeowner" | "designer" | "designer_pending" | null;

export function normalizeRole(raw: unknown): BlogRole {
  if (raw === "homeowner" || raw === "designer" || raw === "designer_pending") return raw;
  return null;
}

export function isProfessionalRole(role: BlogRole) {
  return role === "designer" || role === "designer_pending";
}

export function normalizeAuthorParam(raw: string | null) {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  return value.startsWith("supa_") ? value.slice(5) : value;
}

export function slugifyBlogTitle(input: string) {
  const normalized = input
    .toLowerCase()
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized.slice(0, 180) || "yazi";
}

export function formatBlogDate(value: string | null | undefined) {
  if (!value) return "Tarih yok";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Tarih yok";
  return parsed.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function fetchDesignerSlugMap(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  if (uniqueIds.length === 0) return {} as Record<string, string>;

  const params = new URLSearchParams();
  for (const id of uniqueIds) {
    params.append("id", id);
  }

  try {
    const res = await fetch(`/api/public/designers/slugs?${params.toString()}`, {
      // cache: "no-store", // COST-FIX: use default caching
    });
    if (!res.ok) return {} as Record<string, string>;

    const json = (await res.json()) as { ok?: boolean; slugs?: Record<string, unknown> } | null;
    const rawSlugs = json?.slugs;
    if (!rawSlugs || typeof rawSlugs !== "object") return {} as Record<string, string>;

    const slugs: Record<string, string> = {};
    for (const [id, slug] of Object.entries(rawSlugs)) {
      if (typeof slug === "string" && slug.trim()) {
        slugs[id] = slug.trim();
      }
    }
    return slugs;
  } catch {
    return {} as Record<string, string>;
  }
}

export function buildDesignerProfileHref({
  id,
  slugById,
}: {
  id: string;
  slugById?: Record<string, string> | null;
}) {
  const fallback = `/tasarimcilar/supa_${encodeURIComponent(id)}`;
  const slug = slugById?.[id]?.trim();
  if (!slug) return fallback;

  return `/tasarimcilar/${encodeURIComponent(slug)}`;
}
