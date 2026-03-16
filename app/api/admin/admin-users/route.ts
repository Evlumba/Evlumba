import { NextResponse } from "next/server";
import { jsonError, requireAdmin, UUID_REGEX, writeAdminAuditLog } from "../_lib";

export const runtime = "nodejs";
// export const dynamic = "force-dynamic"; // COST-FIX
export const revalidate = 60; // COST-FIX: 1 min for admin

type AdminRole = "super_admin" | "admin";

type AdminUserRow = {
  user_id: string;
  role: AdminRole;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileBrief = {
  id: string;
  full_name: string | null;
  business_name: string | null;
};

function isAdminRole(value: unknown): value is AdminRole {
  return value === "super_admin" || value === "admin";
}

function displayName(profileMap: Record<string, ProfileBrief>, userId: string | null) {
  if (!userId) return "-";
  const profile = profileMap[userId];
  return profile?.full_name?.trim() || profile?.business_name?.trim() || userId;
}

export async function GET() {
  try {
    const guard = await requireAdmin("admin");
    if (!guard.ok) return guard.response;

    const { admin } = guard.context;
    const { data, error } = await admin
      .from("admin_users")
      .select("user_id, role, is_active, created_by, created_at, updated_at")
      .order("role", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) return jsonError(error.message, 500);

    const rows = (data ?? []) as AdminUserRow[];
    const profileIds = Array.from(
      new Set(rows.flatMap((row) => [row.user_id, row.created_by]).filter(Boolean) as string[])
    );

    let profileMap: Record<string, ProfileBrief> = {};
    if (profileIds.length > 0) {
      const profileResult = await admin.rpc("get_profile_briefs", { user_ids: profileIds });
      if (profileResult.error) return jsonError(profileResult.error.message, 500);

      profileMap = ((profileResult.data ?? []) as ProfileBrief[]).reduce<Record<string, ProfileBrief>>(
        (acc, row) => {
          acc[row.id] = row;
          return acc;
        },
        {}
      );
    }

    return NextResponse.json({
      ok: true,
      adminUsers: rows.map((row) => ({
        userId: row.user_id,
        role: row.role,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdByName: displayName(profileMap, row.created_by),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userName: displayName(profileMap, row.user_id),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin listesi alınamadı.";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdmin("super_admin");
    if (!guard.ok) return guard.response;

    const { actorRole, actorUserId, admin } = guard.context;
    const body = (await request.json().catch(() => null)) as
      | {
          userId?: string;
          role?: AdminRole;
          isActive?: boolean;
        }
      | null;

    const userId = String(body?.userId ?? "").trim();
    if (!UUID_REGEX.test(userId)) {
      return jsonError("Geçerli bir kullanıcı id gönderilmedi.");
    }

    if (!isAdminRole(body?.role)) {
      return jsonError("Geçersiz admin rolü.");
    }

    const isActive = body?.isActive !== false;

    const { data: existingRow, error: existingError } = await admin
      .from("admin_users")
      .select("user_id, role, is_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) return jsonError(existingError.message, 500);

    const existing = existingRow as { user_id: string; role: AdminRole; is_active: boolean } | null;

    const promotingToSuperAdmin = body.role === "super_admin" && existing?.role !== "super_admin";
    if (promotingToSuperAdmin && (!existing || existing.role !== "admin" || !existing.is_active)) {
      return jsonError("Kullanıcı super admin olmadan önce aktif admin olmalı.", 400);
    }

    const isDowngradeOrDeactivationOfSuperAdmin =
      existing?.role === "super_admin" &&
      existing.is_active &&
      (body.role !== "super_admin" || !isActive);

    if (isDowngradeOrDeactivationOfSuperAdmin) {
      const { count, error: countError } = await admin
        .from("admin_users")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "super_admin")
        .eq("is_active", true);
      if (countError) return jsonError(countError.message, 500);

      if ((count ?? 0) <= 1) {
        return jsonError("Aktif son super admin yetkisini kaldıramazsın.", 400);
      }
    }

    if (existing) {
      const { error } = await admin
        .from("admin_users")
        .update({ role: body.role, is_active: isActive })
        .eq("user_id", userId);
      if (error) return jsonError(error.message, 500);
    } else {
      const { error } = await admin.from("admin_users").insert({
        user_id: userId,
        role: body.role,
        is_active: isActive,
        created_by: actorUserId,
      });
      if (error) return jsonError(error.message, 500);
    }

    await writeAdminAuditLog(admin, {
      actorUserId,
      actorRole,
      action: existing ? "admin_user_update" : "admin_user_create",
      targetType: "admin_user",
      targetId: userId,
      details: {
        role: body.role,
        isActive,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin güncellemesi başarısız oldu.";
    return jsonError(message, 500);
  }
}
