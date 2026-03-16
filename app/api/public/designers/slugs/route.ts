import { NextResponse } from "next/server";
import { FEATURED_DESIGNERS } from "@/app/tasarimcilar/_data/designers";
import { buildUniqueDesignerSlugs, type SlugProfile } from "@/app/tasarimcilar/_data/slugs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

// export const dynamic = "force-dynamic"; // COST-FIX
export const revalidate = 21600; // COST-FIX: 6 hours

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_REGEX.test(value);
}

function parseIds(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawValues = searchParams.getAll("id");
  const requestedIds = Array.from(
    new Set(
      rawValues
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && isUuid(value))
    )
  );

  return requestedIds.slice(0, 300);
}

export async function GET(request: Request) {
  try {
    const requestedIds = parseIds(request);
    if (requestedIds.length === 0) {
      return NextResponse.json({ ok: true, slugs: {} as Record<string, string> });
    }

    const admin = getSupabaseAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, full_name, business_name")
      .in("role", ["designer", "designer_pending"])
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const slugMap = buildUniqueDesignerSlugs(
      (profiles ?? []) as SlugProfile[],
      FEATURED_DESIGNERS.map((designer) => designer.slug)
    );

    const slugs: Record<string, string> = {};
    for (const id of requestedIds) {
      const slug = slugMap.get(id);
      if (slug) slugs[id] = slug;
    }

    return NextResponse.json({ ok: true, slugs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
