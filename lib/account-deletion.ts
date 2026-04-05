import { getSupabaseAdminClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

export const ACCOUNT_SELF_DELETE_REASON = "self_delete_requested";
export const ACCOUNT_DELETE_GRACE_DAYS = 7;
export const ACCOUNT_DELETE_GRACE_MS = ACCOUNT_DELETE_GRACE_DAYS * 24 * 60 * 60 * 1000;
export const ACCOUNT_DELETE_NOTICE_MESSAGE =
  "hesabın pasife alındı ve 1 hafta içerisinde silinecek, bu süre içerisinde tekrar login olursan hesabının silme süreci duracaktır.";

type ModerationStateRow = {
  user_id: string;
  is_deleted: boolean | null;
  deleted_reason: string | null;
  deleted_at: string | null;
};

function toIsoString(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

export function accountDeleteDeadlineFromDeletedAt(deletedAtIso: string | null | undefined) {
  const deletedAtMs = Number(new Date(String(deletedAtIso ?? "")).getTime());
  if (!Number.isFinite(deletedAtMs)) return null;
  return new Date(deletedAtMs + ACCOUNT_DELETE_GRACE_MS).toISOString();
}

export async function markUserAsSelfDeleteRequested(
  admin: AdminClient,
  userId: string,
  now: Date = new Date()
) {
  const nowIso = toIsoString(now);
  const { error } = await admin.from("user_moderation_states").upsert(
    {
      user_id: userId,
      is_deleted: true,
      deleted_reason: ACCOUNT_SELF_DELETE_REASON,
      deleted_at: nowIso,
      updated_by: userId,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  const deleteAfterIso = accountDeleteDeadlineFromDeletedAt(nowIso);
  return {
    notice: ACCOUNT_DELETE_NOTICE_MESSAGE,
    deletedAtIso: nowIso,
    deleteAfterIso,
  };
}

export async function cancelSelfDeleteIfWithinGracePeriod(
  admin: AdminClient,
  userId: string,
  now: Date = new Date()
) {
  const { data, error } = await admin
    .from("user_moderation_states")
    .select("user_id, is_deleted, deleted_reason, deleted_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const state = data as ModerationStateRow | null;
  if (
    !state ||
    !state.is_deleted ||
    state.deleted_reason !== ACCOUNT_SELF_DELETE_REASON ||
    !state.deleted_at
  ) {
    return {
      hadPendingSelfDelete: false,
      cancelled: false,
      expired: false,
      deleteAfterIso: null as string | null,
    };
  }

  const deleteAfterIso = accountDeleteDeadlineFromDeletedAt(state.deleted_at);
  const nowMs = now.getTime();
  const deleteAfterMs = deleteAfterIso ? new Date(deleteAfterIso).getTime() : NaN;
  const isExpired = Number.isFinite(deleteAfterMs) ? nowMs > deleteAfterMs : true;

  if (isExpired) {
    return {
      hadPendingSelfDelete: true,
      cancelled: false,
      expired: true,
      deleteAfterIso,
    };
  }

  const { error: restoreError } = await admin.from("user_moderation_states").upsert(
    {
      user_id: userId,
      is_deleted: false,
      deleted_reason: null,
      deleted_at: null,
      updated_by: userId,
    },
    { onConflict: "user_id" }
  );

  if (restoreError) throw new Error(restoreError.message);

  return {
    hadPendingSelfDelete: true,
    cancelled: true,
    expired: false,
    deleteAfterIso,
  };
}
