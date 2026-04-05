import { NextResponse } from "next/server";
import {
  ACCOUNT_DELETE_GRACE_MS,
  ACCOUNT_SELF_DELETE_REASON,
} from "@/lib/account-deletion";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ModerationDeleteRow = {
  user_id: string;
  deleted_at: string | null;
};

function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const cutoffIso = new Date(Date.now() - ACCOUNT_DELETE_GRACE_MS).toISOString();

  const { data, error } = await admin
    .from("user_moderation_states")
    .select("user_id, deleted_at")
    .eq("is_deleted", true)
    .eq("deleted_reason", ACCOUNT_SELF_DELETE_REASON)
    .not("deleted_at", "is", null)
    .lte("deleted_at", cutoffIso)
    .limit(500);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as ModerationDeleteRow[];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, candidates: 0, deleted: 0, failed: 0 });
  }

  let deleted = 0;
  let failed = 0;
  const failures: Array<{ userId: string; error: string }> = [];

  for (const row of rows) {
    const userId = String(row.user_id ?? "").trim();
    if (!userId) continue;

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      failed += 1;
      failures.push({ userId, error: deleteError.message });
      continue;
    }
    deleted += 1;
  }

  return NextResponse.json({
    ok: true,
    candidates: rows.length,
    deleted,
    failed,
    failures,
  });
}
