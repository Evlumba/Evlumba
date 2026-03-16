import { NextResponse } from "next/server";
import { jsonError, requireAdmin, UUID_REGEX, writeAdminAuditLog } from "../_lib";

export const runtime = "nodejs";
// export const dynamic = "force-dynamic"; // COST-FIX
export const revalidate = 60; // COST-FIX: 1 min for admin

type UserAction = "ban" | "unban" | "soft_delete" | "restore" | "hard_delete";

type ProfileRow = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  role: string | null;
  contact_email: string | null;
  city: string | null;
  created_at: string;
};

type ModerationRow = {
  user_id: string;
  is_banned: boolean;
  banned_reason: string | null;
  banned_until: string | null;
  is_deleted: boolean;
  deleted_reason: string | null;
  deleted_at: string | null;
};

type AdminUserRow = {
  user_id: string;
  role: "super_admin" | "admin";
  is_active: boolean;
};

function sanitizeLikeInput(value: string) {
  return value.replace(/[%_]/g, "").trim();
}

function normalizeReason(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text.slice(0, 600) : null;
}

function isValidAction(value: unknown): value is UserAction {
  return (
    value === "ban" ||
    value === "unban" ||
    value === "soft_delete" ||
    value === "restore" ||
    value === "hard_delete"
  );
}

function parseBannedUntil(value: unknown) {
  if (value == null || value === "") return null;
  const iso = String(value);
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function GET(request: Request) {
  try {
    const guard = await requireAdmin("admin");
    if (!guard.ok) return guard.response;

    const { admin } = guard.context;
    const { searchParams } = new URL(request.url);
    const q = sanitizeLikeInput(searchParams.get("q") ?? "");
    const limitRaw = Number(searchParams.get("limit") ?? "80");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 20), 150) : 80;

    let query = admin
      .from("profiles")
      .select("id, full_name, business_name, role, contact_email, city, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,business_name.ilike.%${q}%,contact_email.ilike.%${q}%,city.ilike.%${q}%`
      );
    }

    const { data: profileRows, error: profileError } = await query;
    if (profileError) return jsonError(profileError.message, 500);

    const profiles = (profileRows ?? []) as ProfileRow[];
    const userIds = profiles.map((profile) => profile.id);

    let moderationMap: Record<string, ModerationRow> = {};
    let adminRoleMap: Record<string, AdminUserRow> = {};

    if (userIds.length > 0) {
      const [moderationResult, adminUsersResult] = await Promise.all([
        admin
          .from("user_moderation_states")
          .select("user_id, is_banned, banned_reason, banned_until, is_deleted, deleted_reason, deleted_at")
          .in("user_id", userIds),
        admin.from("admin_users").select("user_id, role, is_active").in("user_id", userIds),
      ]);

      if (moderationResult.error) return jsonError(moderationResult.error.message, 500);
      if (adminUsersResult.error) return jsonError(adminUsersResult.error.message, 500);

      moderationMap = ((moderationResult.data ?? []) as ModerationRow[]).reduce<
        Record<string, ModerationRow>
      >((acc, row) => {
        acc[row.user_id] = row;
        return acc;
      }, {});

      adminRoleMap = ((adminUsersResult.data ?? []) as AdminUserRow[]).reduce<
        Record<string, AdminUserRow>
      >((acc, row) => {
        acc[row.user_id] = row;
        return acc;
      }, {});
    }

    const nowTime = Date.now();
    const users = profiles.map((profile) => {
      const moderation = moderationMap[profile.id];
      const adminRole = adminRoleMap[profile.id];
      const bannedUntilTime = moderation?.banned_until ? Date.parse(moderation.banned_until) : NaN;
      const isBanActive =
        Boolean(moderation?.is_banned) &&
        (!moderation?.banned_until || Number.isNaN(bannedUntilTime) || bannedUntilTime > nowTime);

      return {
        id: profile.id,
        fullName: profile.full_name?.trim() || "",
        businessName: profile.business_name?.trim() || "",
        role: profile.role ?? "homeowner",
        email: profile.contact_email?.trim() || "",
        city: profile.city?.trim() || "",
        createdAt: profile.created_at,
        moderation: {
          isBanned: isBanActive,
          bannedReason: moderation?.banned_reason ?? null,
          bannedUntil: moderation?.banned_until ?? null,
          isDeleted: moderation?.is_deleted ?? false,
          deletedReason: moderation?.deleted_reason ?? null,
          deletedAt: moderation?.deleted_at ?? null,
        },
        adminRole: adminRole?.is_active ? adminRole.role : null,
      };
    });

    return NextResponse.json({ ok: true, users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kullanıcılar alınamadı.";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdmin("admin");
    if (!guard.ok) return guard.response;

    const { actorRole, actorUserId, admin } = guard.context;
    const body = (await request.json().catch(() => null)) as
      | {
          userId?: string;
          action?: UserAction;
          reason?: string;
          bannedUntil?: string | null;
        }
      | null;

    const userId = String(body?.userId ?? "").trim();
    if (!UUID_REGEX.test(userId)) {
      return jsonError("Geçerli bir kullanıcı id gönderilmedi.");
    }

    const action = body?.action;
    if (!isValidAction(action)) {
      return jsonError("Geçersiz moderasyon aksiyonu.");
    }

    const reason = normalizeReason(body?.reason);
    const bannedUntil = parseBannedUntil(body?.bannedUntil);
    const nowIso = new Date().toISOString();

    if (action === "ban") {
      const { error } = await admin.from("user_moderation_states").upsert(
        {
          user_id: userId,
          is_banned: true,
          banned_reason: reason,
          banned_until: bannedUntil,
          updated_by: actorUserId,
        },
        { onConflict: "user_id" }
      );
      if (error) return jsonError(error.message, 500);
    }

    if (action === "unban") {
      const { error } = await admin.from("user_moderation_states").upsert(
        {
          user_id: userId,
          is_banned: false,
          banned_reason: null,
          banned_until: null,
          updated_by: actorUserId,
        },
        { onConflict: "user_id" }
      );
      if (error) return jsonError(error.message, 500);
    }

    if (action === "soft_delete") {
      const { error } = await admin.from("user_moderation_states").upsert(
        {
          user_id: userId,
          is_deleted: true,
          deleted_reason: reason,
          deleted_at: nowIso,
          updated_by: actorUserId,
        },
        { onConflict: "user_id" }
      );
      if (error) return jsonError(error.message, 500);
    }

    if (action === "restore") {
      const { error } = await admin.from("user_moderation_states").upsert(
        {
          user_id: userId,
          is_deleted: false,
          deleted_reason: null,
          deleted_at: null,
          updated_by: actorUserId,
        },
        { onConflict: "user_id" }
      );
      if (error) return jsonError(error.message, 500);
    }

    if (action === "hard_delete") {
      if (userId === actorUserId) {
        return jsonError("Kendi hesabını admin panelinden kalıcı olarak silemezsin.", 400);
      }

      const { data: targetAdminRow, error: targetAdminError } = await admin
        .from("admin_users")
        .select("role, is_active")
        .eq("user_id", userId)
        .maybeSingle();
      if (targetAdminError) return jsonError(targetAdminError.message, 500);

      const targetAdmin = targetAdminRow as { role: "super_admin" | "admin"; is_active: boolean } | null;

      if (targetAdmin?.is_active && targetAdmin.role === "super_admin") {
        const { count, error: countError } = await admin
          .from("admin_users")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "super_admin")
          .eq("is_active", true);
        if (countError) return jsonError(countError.message, 500);

        if ((count ?? 0) <= 1) {
          return jsonError("Aktif son super admin hesabı kalıcı silinemez.", 400);
        }
      }

      if (targetAdmin?.is_active && actorRole !== "super_admin") {
        return jsonError("Aktif admin hesaplarını sadece super admin kalıcı silebilir.", 403);
      }

      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) return jsonError(deleteError.message, 500);
    }

    await writeAdminAuditLog(admin, {
      actorUserId,
      actorRole,
      action: `user_${action}`,
      targetType: "user",
      targetId: userId,
      details: {
        reason,
        bannedUntil,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Moderasyon işlemi tamamlanamadı.";
    return jsonError(message, 500);
  }
}
