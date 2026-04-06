import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST - login olmadan doğrulama talebi gönder
export async function POST(req: Request) {
  const body = (await req.json()) as {
    fullName?: string;
    evlumbaUrl?: string;
    email?: string;
    petition?: string;
  };

  const fullName = (body.fullName ?? "").trim();
  const evlumbaUrl = (body.evlumbaUrl ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const petition = (body.petition ?? "").trim();

  if (fullName.length < 2) {
    return NextResponse.json({ ok: false, error: "Ad soyad en az 2 karakter olmalı." }, { status: 400 });
  }
  if (!evlumbaUrl) {
    return NextResponse.json({ ok: false, error: "Evlumba profil URL'si gerekli." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Geçerli bir e-posta adresi gir." }, { status: 400 });
  }
  if (petition.length < 20) {
    return NextResponse.json({ ok: false, error: "Dilekçe metni en az 20 karakter olmalı." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  // Try to find profile by slug from URL (optional, for admin convenience)
  const slugMatch = evlumbaUrl.match(/\/tasarimcilar\/([^/?#]+)/);
  const slug = slugMatch?.[1] ?? null;
  let userId: string | null = null;

  if (slug) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    userId = profile?.id ?? null;
  }

  const row: Record<string, unknown> = {
    full_name: fullName,
    evlumba_url: evlumbaUrl,
    email,
    petition,
  };
  if (userId) {
    row.user_id = userId;
  }

  const { error } = await admin.from("designer_verification_requests").insert(row);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Doğrulama talebin gönderildi. Admin ekibi en kısa sürede inceleyecek." });
}
