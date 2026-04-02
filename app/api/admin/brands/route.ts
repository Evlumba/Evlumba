import { NextResponse } from "next/server";
import { BRANDS } from "@/lib/brands";
import { jsonError, requireAdmin, writeAdminAuditLog } from "../_lib";

export const runtime = "nodejs";
export const revalidate = 60;

const CATEGORY_VALUES = ["mobilya", "dekorasyon", "aydınlatma", "tekstil", "yapı-market"] as const;
type BrandCategory = (typeof CATEGORY_VALUES)[number];

type BrandRow = {
  slug: string;
  name: string;
  category: BrandCategory;
  summary: string;
  banner_image_url: string | null;
  sort_order: number | null;
};

type UpsertPayload = {
  action: "upsert";
  item: {
    slug?: string;
    name?: string;
    category?: string;
    summary?: string;
    bannerImageUrl?: string | null;
    sortOrder?: number | null;
  };
};

type DeletePayload = {
  action: "delete";
  slug?: string;
};

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return /brand_directory_entries/i.test(error.message ?? "") && /does not exist/i.test(error.message ?? "");
}

function isCategory(value: string): value is BrandCategory {
  return (CATEGORY_VALUES as readonly string[]).includes(value);
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function sanitizeBannerUrl(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (!/^https?:\/\//i.test(text)) return null;
  if (text.length > 3000) return null;
  return text;
}

function normalizeSortOrder(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1000;
  return Math.max(1, Math.min(9999, Math.trunc(parsed)));
}

export async function GET() {
  try {
    const guard = await requireAdmin("admin");
    if (!guard.ok) return guard.response;

    const { admin } = guard.context;
    const { data, error } = await admin
      .from("brand_directory_entries")
      .select("slug, name, category, summary, banner_image_url, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({
          ok: true,
          needsSetup: true,
          brands: BRANDS.map((item, index) => ({
            slug: item.slug,
            name: item.name,
            category: item.category,
            summary: item.summary,
            bannerImageUrl: null,
            sortOrder: index + 1,
          })),
        });
      }
      return jsonError(error.message, 500);
    }

    const brands = ((data ?? []) as BrandRow[]).map((row, index) => ({
      slug: row.slug,
      name: row.name,
      category: row.category,
      summary: row.summary,
      bannerImageUrl: row.banner_image_url ?? null,
      sortOrder: row.sort_order ?? index + 1,
    }));

    return NextResponse.json({ ok: true, needsSetup: false, brands });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marka verileri alınamadı.";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdmin("admin");
    if (!guard.ok) return guard.response;

    const { actorRole, actorUserId, admin } = guard.context;
    const body = (await request.json().catch(() => null)) as UpsertPayload | DeletePayload | null;
    if (!body) return jsonError("Geçersiz istek gövdesi.", 400);
    const action = body?.action;

    if (action === "delete") {
      const deleteBody = body as DeletePayload;
      const slug = slugify(String(deleteBody.slug ?? ""));
      if (!slug) return jsonError("Silinecek marka slug zorunlu.", 400);

      const { error: deleteError } = await admin
        .from("brand_directory_entries")
        .delete()
        .eq("slug", slug);

      if (deleteError) {
        if (isMissingTableError(deleteError)) {
          return jsonError("brand_directory_entries tablosu bulunamadı. Önce migration çalıştır.", 400);
        }
        return jsonError(deleteError.message, 500);
      }

      await writeAdminAuditLog(admin, {
        actorRole,
        actorUserId,
        action: "brand_directory_delete",
        targetType: "brand_directory_entry",
        targetId: slug,
        details: {},
      });

      return NextResponse.json({ ok: true });
    }

    if (action !== "upsert") return jsonError("Geçersiz işlem.", 400);

    const upsertBody = body as UpsertPayload;
    const name = String(upsertBody.item?.name ?? "").trim();
    const normalizedSlug = slugify(String(upsertBody.item?.slug ?? "") || name);
    const category = String(upsertBody.item?.category ?? "").trim();
    const summary = String(upsertBody.item?.summary ?? "").trim();
    const bannerImageUrl = sanitizeBannerUrl(upsertBody.item?.bannerImageUrl);
    const sortOrder = normalizeSortOrder(upsertBody.item?.sortOrder);

    if (!name) return jsonError("Marka adı zorunlu.", 400);
    if (!normalizedSlug) return jsonError("Geçerli bir slug üretilemedi.", 400);
    if (!isCategory(category)) return jsonError("Geçersiz kategori.", 400);
    if (!summary) return jsonError("Kısa özet zorunlu.", 400);
    if (name.length > 120) return jsonError("Marka adı en fazla 120 karakter olabilir.", 400);
    if (summary.length > 500) return jsonError("Özet en fazla 500 karakter olabilir.", 400);

    const payload = {
      slug: normalizedSlug,
      name,
      category,
      summary,
      banner_image_url: bannerImageUrl,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await admin
      .from("brand_directory_entries")
      .upsert(payload, { onConflict: "slug" });

    if (upsertError) {
      if (isMissingTableError(upsertError)) {
        return jsonError("brand_directory_entries tablosu bulunamadı. Önce migration çalıştır.", 400);
      }
      return jsonError(upsertError.message, 500);
    }

    await writeAdminAuditLog(admin, {
      actorRole,
      actorUserId,
      action: "brand_directory_upsert",
      targetType: "brand_directory_entry",
      targetId: normalizedSlug,
      details: {
        category,
        sortOrder,
      },
    });

    return NextResponse.json({ ok: true, slug: normalizedSlug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marka kaydı tamamlanamadı.";
    return jsonError(message, 500);
  }
}
