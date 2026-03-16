import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Params = {
  params: Promise<{ id: string }>;
};

type Payload = {
  rating?: number;
  reviewText?: string;
  workQualityRating?: number | null;
  communicationRating?: number | null;
  valueRating?: number | null;
  projectId?: string | null;
};

function sanitizeSubRating(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  const clamped = Math.max(1, Math.min(5, value));
  return Number(clamped.toFixed(1));
}

export async function POST(req: Request, context: Params) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Eksik designer id" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: "Yorum yazmak için giriş yapmalısın." }, { status: 401 });
    }

    const payload = (await req.json()) as Payload;
    const rating = Number(payload.rating);
    const reviewText = payload.reviewText?.trim() ?? "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: "Yıldız puanı 1 ile 5 arasında olmalı." }, { status: 400 });
    }

    if (reviewText.length < 10) {
      return NextResponse.json({ ok: false, error: "Yorum metni en az 10 karakter olmalı." }, { status: 400 });
    }

    if (authData.user.id === id) {
      return NextResponse.json({ ok: false, error: "Kendi profiline yorum yazamazsın." }, { status: 400 });
    }

    const { error: insertError } = await supabase.from("designer_reviews").insert({
      designer_id: id,
      homeowner_id: authData.user.id,
      project_id: payload.projectId?.trim() || null,
      rating,
      work_quality_rating: sanitizeSubRating(payload.workQualityRating),
      communication_rating: sanitizeSubRating(payload.communicationRating),
      value_rating: sanitizeSubRating(payload.valueRating),
      review_text: reviewText,
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
