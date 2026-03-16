export type SlugProfile = {
  id: string;
  full_name: string | null;
  business_name?: string | null;
};

export function slugifyDesignerName(input: string) {
  return input
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildUniqueDesignerSlugs(
  profiles: SlugProfile[],
  reservedSlugs: string[] = []
) {
  const used = new Set(reservedSlugs.filter(Boolean));
  const out = new Map<string, string>();

  for (const profile of profiles) {
    const displayName = (profile.full_name || profile.business_name || "mimar").trim();
    const base = slugifyDesignerName(displayName) || "mimar";

    let slug = base;
    let counter = 1;
    while (used.has(slug)) {
      slug = `${base}${counter}`;
      counter += 1;
    }

    used.add(slug);
    out.set(profile.id, slug);
  }

  return out;
}
