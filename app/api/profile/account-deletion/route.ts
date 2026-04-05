import { NextResponse } from "next/server";
import {
  ACCOUNT_DELETE_NOTICE_MESSAGE,
  cancelSelfDeleteIfWithinGracePeriod,
  markUserAsSelfDeleteRequested,
} from "@/lib/account-deletion";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAuthUserId() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

export async function POST() {
  try {
    const userId = await requireAuthUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Bu işlem için giriş yapmalısın." }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();
    const result = await markUserAsSelfDeleteRequested(admin, userId);

    return NextResponse.json({
      ok: true,
      message: result.notice || ACCOUNT_DELETE_NOTICE_MESSAGE,
      deletedAt: result.deletedAtIso,
      deleteAfter: result.deleteAfterIso,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Hesap silme süreci başlatılamadı.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const userId = await requireAuthUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Bu işlem için giriş yapmalısın." }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();
    const result = await cancelSelfDeleteIfWithinGracePeriod(admin, userId);

    return NextResponse.json({
      ok: true,
      hadPendingSelfDelete: result.hadPendingSelfDelete,
      cancelled: result.cancelled,
      expired: result.expired,
      deleteAfter: result.deleteAfterIso,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Hesap silme süreci kontrol edilemedi.",
      },
      { status: 500 }
    );
  }
}
