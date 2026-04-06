import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - kullanıcının kendi doğrulama taleplerini getir
export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user?.id) {
    return NextResponse.json({ ok: false, error: "Giriş yapmalısın." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("designer_verification_requests")
    .select("id, full_name, evlumba_url, email, petition, status, created_at, reviewed_at")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, requests: data ?? [] });
}

// POST - yeni doğrulama talebi oluştur
export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user?.id) {
    return NextResponse.json({ ok: false, error: "Giriş yapmalısın." }, { status: 401 });
  }

  const body = (await req.json()) as {
    fullName?: string;
    evlumbaUrl?: string;
    email?: string;
    petition?: string;
  };

  const fullName = (body.fullName ?? "").trim();
  const evlumbaUrl = (body.evlumbaUrl ?? "").trim();
  const email = (body.email ?? "").trim();
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

  // Check if already has pending request
  const { data: existing } = await supabase
    .from("designer_verification_requests")
    .select("id")
    .eq("user_id", authData.user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: false, error: "Zaten bekleyen bir doğrulama talebin var." }, { status: 409 });
  }

  const { error } = await supabase.from("designer_verification_requests").insert({
    user_id: authData.user.id,
    full_name: fullName,
    evlumba_url: evlumbaUrl,
    email,
    petition,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Doğrulama talebin gönderildi." });
}
