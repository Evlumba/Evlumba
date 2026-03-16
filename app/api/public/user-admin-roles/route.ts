import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

// export const dynamic = "force-dynamic"; // COST-FIX
export const revalidate = 3600; // COST-FIX: 1 hour

type AdminRole = "admin" | "super_admin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { userIds?: unknown } | null;
    const rawUserIds = Array.isArray(body?.userIds) ? body?.userIds : [];

    const userIds = Array.from(
      new Set(
        rawUserIds
          .map((value) => String(value ?? "").trim())
          .filter((value) => UUID_REGEX.test(value))
      )
    ).slice(0, 120);

    if (userIds.length === 0) {
      return NextResponse.json({ ok: true, roles: {} });
    }

    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("admin_users")
      .select("user_id, role")
      .in("user_id", userIds)
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const roles = ((data ?? []) as Array<{ user_id: string; role: AdminRole }>).reduce<
      Record<string, AdminRole>
    >((acc, row) => {
      acc[row.user_id] = row.role;
      return acc;
    }, {});

    return NextResponse.json({ ok: true, roles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
