import { NextResponse } from "next/server";
import { type AdminRole, hasRequiredAdminRole, getCurrentAdminContext } from "@/lib/admin/access";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminRouteContext = {
  actorUserId: string;
  actorRole: AdminRole;
  admin: ReturnType<typeof getSupabaseAdminClient>;
};

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function requireAdmin(requiredRole: AdminRole = "admin") {
  const adminContext = await getCurrentAdminContext();
  if (!adminContext) {
    return { ok: false as const, response: jsonError("Bu alan için admin yetkisi gerekiyor.", 403) };
  }
  if (!hasRequiredAdminRole(adminContext.role, requiredRole)) {
    return { ok: false as const, response: jsonError("Bu işlem için yetkin yetersiz.", 403) };
  }

  return {
    ok: true as const,
    context: {
      actorUserId: adminContext.userId,
      actorRole: adminContext.role,
      admin: getSupabaseAdminClient(),
    } satisfies AdminRouteContext,
  };
}

type AdminAuditPayload = {
  actorUserId: string;
  actorRole: AdminRole;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
};

export async function writeAdminAuditLog(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  payload: AdminAuditPayload
) {
  await admin.from("admin_audit_logs").insert({
    actor_user_id: payload.actorUserId,
    actor_role: payload.actorRole,
    action: payload.action,
    target_type: payload.targetType,
    target_id: payload.targetId,
    details: payload.details ?? {},
  });
}
