import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

type Params = {
  params: Promise<{ id: string; reviewId: string }>;
};

type PatchPayload = {
  rating?: number;
  reviewText?: string;
};

async function loadOwnedReview(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  reviewId: string,
  designerId: string
) {
  const { data, error } = await supabase
    .from("designer_reviews")
    .select("id, designer_id, homeowner_id")
    .eq("id", reviewId)
    .eq("designer_id", designerId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Yorum bulunamadı." };
  return { data, error: null };
}

export async function PATCH(req: Request, context: Params) {
  try {
    const { id: designerId, reviewId } = await context.params;
    if (!designerId || !reviewId) {
      return NextResponse.json({ ok: false, error: "Eksik parametre." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: "Bu işlem için giriş yapmalısın." }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();
    const ownedReview = await loadOwnedReview(admin, reviewId, designerId);
    if (!ownedReview.data) {
      return NextResponse.json({ ok: false, error: ownedReview.error || "Yorum bulunamadı." }, { status: 404 });
    }
    if (ownedReview.data.homeowner_id !== authData.user.id) {
      return NextResponse.json({ ok: false, error: "Sadece kendi yorumunu düzenleyebilirsin." }, { status: 403 });
    }

    const payload = (await req.json()) as PatchPayload;
    const updates: Record<string, string | number> = {};

    if (payload.rating !== undefined) {
      const nextRating = Number(payload.rating);
      if (!Number.isInteger(nextRating) || nextRating < 1 || nextRating > 5) {
        return NextResponse.json({ ok: false, error: "Yıldız puanı 1 ile 5 arasında olmalı." }, { status: 400 });
      }
      updates.rating = nextRating;
    }

    if (payload.reviewText !== undefined) {
      const nextText = String(payload.reviewText || "").trim();
      if (nextText.length < 10) {
        return NextResponse.json({ ok: false, error: "Yorum metni en az 10 karakter olmalı." }, { status: 400 });
      }
      updates.review_text = nextText;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "Güncellenecek bir alan gönderilmedi." }, { status: 400 });
    }

    const { data: updatedRow, error: updateError } = await admin
      .from("designer_reviews")
      .update(updates)
      .eq("id", reviewId)
      .eq("designer_id", designerId)
      .eq("homeowner_id", authData.user.id)
      .select("id, rating, review_text")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 400 });
    }
    if (!updatedRow) {
      return NextResponse.json(
        {
          ok: false,
          error: "Yorum güncellenemedi. Yetki/policy nedeniyle işlem uygulanmamış olabilir.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      review: {
        id: updatedRow.id,
        rating: Number(updatedRow.rating || 0),
        reviewText: updatedRow.review_text || "",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: Params) {
  try {
    const { id: designerId, reviewId } = await context.params;
    if (!designerId || !reviewId) {
      return NextResponse.json({ ok: false, error: "Eksik parametre." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: "Bu işlem için giriş yapmalısın." }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();
    const ownedReview = await loadOwnedReview(admin, reviewId, designerId);
    if (!ownedReview.data) {
      return NextResponse.json({ ok: false, error: ownedReview.error || "Yorum bulunamadı." }, { status: 404 });
    }
    if (ownedReview.data.homeowner_id !== authData.user.id) {
      return NextResponse.json({ ok: false, error: "Sadece kendi yorumunu silebilirsin." }, { status: 403 });
    }

    const { data: deletedRows, error: deleteError } = await admin
      .from("designer_reviews")
      .delete()
      .eq("id", reviewId)
      .eq("designer_id", designerId)
      .eq("homeowner_id", authData.user.id)
      .select("id");

    if (deleteError) {
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 400 });
    }
    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Yorum silinemedi. Yetki/policy nedeniyle işlem uygulanmamış olabilir.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
