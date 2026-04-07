import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET - aktif popup'i getir (public, cache'li)
export async function GET() {
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("popup_banners")
    .select("id, title, image_url, link_url, max_impressions_per_user, start_date, end_date")
    .eq("is_active", true)
    .lte("start_date", now)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: true, popup: null });
  }

  return NextResponse.json(
    { ok: true, popup: data },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
