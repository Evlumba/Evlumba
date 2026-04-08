import { NextResponse } from "next/server";
import { getCurrentAdminContext } from "@/lib/admin/access";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - tum popup'lari listele
export async function GET() {
  const admin = await getCurrentAdminContext();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("popup_banners")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, popups: data ?? [] });
}

// POST - yeni popup olustur veya guncelle
export async function POST(req: Request) {
  const admin = await getCurrentAdminContext();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 403 });
  }

  const body = (await req.json()) as {
    id?: string;
    title?: string;
    imageUrl?: string;
    linkUrl?: string;
    isActive?: boolean;
    maxImpressionsPerUser?: number;
    startDate?: string;
    endDate?: string | null;
    pages?: string[];
    mediaType?: string;
  };

  const supabaseAdmin = getSupabaseAdminClient();

  // Update existing
  if (body.id) {
    const { error } = await supabaseAdmin
      .from("popup_banners")
      .update({
        title: body.title ?? "",
        image_url: body.imageUrl ?? "",
        link_url: body.linkUrl || null,
        is_active: body.isActive ?? false,
        max_impressions_per_user: body.maxImpressionsPerUser ?? 3,
        start_date: body.startDate || new Date().toISOString(),
        end_date: body.endDate || null,
        pages: body.pages ?? [],
        media_type: body.mediaType ?? "image",
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "Popup güncellendi." });
  }

  // Create new
  const title = (body.title ?? "").trim();
  const imageUrl = (body.imageUrl ?? "").trim();

  if (!title || !imageUrl) {
    return NextResponse.json({ ok: false, error: "Başlık ve görsel gerekli." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("popup_banners").insert({
    title,
    image_url: imageUrl,
    link_url: body.linkUrl || null,
    is_active: body.isActive ?? false,
    max_impressions_per_user: body.maxImpressionsPerUser ?? 3,
    start_date: body.startDate || new Date().toISOString(),
    end_date: body.endDate || null,
    pages: body.pages ?? [],
    media_type: body.mediaType ?? "image",
    created_by: admin.userId,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Popup oluşturuldu." });
}

// DELETE - popup sil
export async function DELETE(req: Request) {
  const admin = await getCurrentAdminContext();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 403 });
  }

  const body = (await req.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ ok: false, error: "ID gerekli." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from("popup_banners")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Popup silindi." });
}
