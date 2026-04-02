import "server-only";

import { BRANDS, type BrandEntry } from "@/lib/brands";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type BrandDirectoryEntry = BrandEntry & {
  bannerImageUrl: string | null;
  sortOrder: number;
};

type BrandDirectoryRow = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  banner_image_url: string | null;
  sort_order: number | null;
};

const CATEGORY_SET = new Set<BrandEntry["category"]>([
  "mobilya",
  "dekorasyon",
  "aydınlatma",
  "tekstil",
  "yapı-market",
]);

function normalizeCategory(value: string): BrandEntry["category"] {
  if (CATEGORY_SET.has(value as BrandEntry["category"])) {
    return value as BrandEntry["category"];
  }
  return "dekorasyon";
}

function staticDirectoryEntries() {
  return BRANDS.map<BrandDirectoryEntry>((brand, index) => ({
    ...brand,
    bannerImageUrl: null,
    sortOrder: index + 1,
  }));
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return /brand_directory_entries/i.test(error.message ?? "") && /does not exist/i.test(error.message ?? "");
}

export async function getBrandDirectoryEntries(): Promise<BrandDirectoryEntry[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("brand_directory_entries")
      .select("slug, name, category, summary, banner_image_url, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      if (isMissingTableError(error)) return staticDirectoryEntries();
      console.error("brand-directory: fetch failed", error.message);
      return staticDirectoryEntries();
    }

    const rows = (data ?? []) as BrandDirectoryRow[];
    if (rows.length === 0) return staticDirectoryEntries();

    return rows.map((row, index) => ({
      slug: row.slug.trim(),
      name: row.name.trim(),
      category: normalizeCategory(row.category),
      summary: row.summary.trim(),
      bannerImageUrl: row.banner_image_url?.trim() || null,
      sortOrder: row.sort_order ?? index + 1,
    }));
  } catch (error) {
    console.error("brand-directory: unexpected error", error);
    return staticDirectoryEntries();
  }
}

export async function getBrandDirectoryEntryBySlug(slug: string): Promise<BrandDirectoryEntry | null> {
  const brands = await getBrandDirectoryEntries();
  return brands.find((item) => item.slug === slug) || null;
}
