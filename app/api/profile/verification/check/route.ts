import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - email ile mevcut talep durumunu kontrol et (public, login gerektirmez)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: false, error: "E-posta gerekli." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  // Find profile by contact_email
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("contact_email", email)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ ok: true, request: null });
  }

  // Get latest request
  const { data: request } = await admin
    .from("designer_verification_requests")
    .select("id, full_name, evlumba_url, email, petition, status, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ ok: true, request: request ?? null });
}
