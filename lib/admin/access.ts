import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export type AdminRole = "super_admin" | "admin";

const ROLE_RANK: Record<AdminRole, number> = {
  admin: 1,
  super_admin: 2,
};

export function isAdminRole(value: string | null | undefined): value is AdminRole {
  return value === "admin" || value === "super_admin";
}

export function hasRequiredAdminRole(current: AdminRole, required: AdminRole) {
  return ROLE_RANK[current] >= ROLE_RANK[required];
}

export async function getCurrentSessionUserId() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getActiveAdminRoleByUserId(userId: string | null | undefined) {
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserId) return null;

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_users")
    .select("role, is_active")
    .eq("user_id", normalizedUserId)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;
  return isAdminRole(data.role) ? data.role : null;
}

export async function getCurrentAdminContext() {
  const userId = await getCurrentSessionUserId();
  if (!userId) return null;

  const role = await getActiveAdminRoleByUserId(userId);
  if (!role) return null;

  return { userId, role } as const;
}
