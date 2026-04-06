import { NextResponse } from "next/server";
import { getCurrentAdminContext } from "@/lib/admin/access";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - tüm doğrulama taleplerini listele (admin only)
export async function GET(req: Request) {
  const admin = await getCurrentAdminContext();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "pending";

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("designer_verification_requests")
    .select("id, user_id, full_name, evlumba_url, email, petition, status, created_at, reviewed_at, reviewed_by")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, requests: data ?? [] });
}

// POST - doğrula veya reddet (admin only)
export async function POST(req: Request) {
  const admin = await getCurrentAdminContext();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 403 });
  }

  const body = (await req.json()) as {
    requestId?: string;
    action?: "approve" | "reject";
  };

  const requestId = (body.requestId ?? "").trim();
  const action = body.action;

  if (!requestId || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdminClient();

  // Fetch the request
  const { data: request, error: fetchError } = await supabaseAdmin
    .from("designer_verification_requests")
    .select("id, user_id, status, email")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError || !request) {
    return NextResponse.json({ ok: false, error: "Talep bulunamadı." }, { status: 404 });
  }

  if (request.status !== "pending") {
    return NextResponse.json({ ok: false, error: "Bu talep zaten işlenmiş." }, { status: 409 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  // Update request status
  const { error: updateError } = await supabaseAdmin
    .from("designer_verification_requests")
    .update({
      status: newStatus,
      reviewed_by: admin.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  // If approved, set is_verified + update contact_email with the one from the form
  if (action === "approve" && request.user_id) {
    await supabaseAdmin
      .from("profiles")
      .update({
        is_verified: true,
        contact_email: request.email,
      })
      .eq("id", request.user_id);
  }

  // If rejected, ensure is_verified stays false
  if (action === "reject" && request.user_id) {
    await supabaseAdmin
      .from("profiles")
      .update({ is_verified: false })
      .eq("id", request.user_id);
  }

  return NextResponse.json({
    ok: true,
    message: action === "approve" ? "Hesap doğrulandı." : "Talep reddedildi.",
  });
}
