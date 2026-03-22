import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "../_lib";

export const runtime = "nodejs";
// export const dynamic = "force-dynamic"; // COST-FIX
export const revalidate = 60; // COST-FIX: 1 min for admin

type AuditLogRow = {
  id: string;
  actor_user_id: string;
  actor_role: "super_admin" | "admin";
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

type ProfileBrief = {
  id: string;
  full_name: string | null;
  business_name: string | null;
};

function displayName(profile: ProfileBrief | undefined, fallbackId: string) {
  return profile?.full_name?.trim() || profile?.business_name?.trim() || fallbackId;
}

export async function GET() {
  try {
    const guard = await requireAdmin("admin");
    if (!guard.ok) return guard.response;

    const { admin } = guard.context;
    const nowIso = new Date().toISOString();

    const [
      profilesCountResult,
      publishedBlogCountResult,
      forumPostCountResult,
      publishedListingsCountResult,
      activeBannedCountResult,
      totalProjectsCountResult,
      logsResult,
    ] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
      admin.from("forum_posts").select("id", { count: "exact", head: true }),
      admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "published"),
      admin
        .from("user_moderation_states")
        .select("user_id", { count: "exact", head: true })
        .eq("is_banned", true)
        .or(`banned_until.is.null,banned_until.gt.${nowIso}`),
      admin.from("designer_projects").select("id", { count: "exact", head: true }),
      admin
        .from("admin_audit_logs")
        .select("id, actor_user_id, actor_role, action, target_type, target_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (profilesCountResult.error) return jsonError(profilesCountResult.error.message, 500);
    if (publishedBlogCountResult.error) return jsonError(publishedBlogCountResult.error.message, 500);
    if (forumPostCountResult.error) return jsonError(forumPostCountResult.error.message, 500);
    if (publishedListingsCountResult.error) return jsonError(publishedListingsCountResult.error.message, 500);
    if (activeBannedCountResult.error) return jsonError(activeBannedCountResult.error.message, 500);
    if (totalProjectsCountResult.error) return jsonError(totalProjectsCountResult.error.message, 500);
    if (logsResult.error) return jsonError(logsResult.error.message, 500);

    const logs = (logsResult.data ?? []) as AuditLogRow[];
    const actorIds = Array.from(new Set(logs.map((log) => log.actor_user_id).filter(Boolean)));

    let profileMap: Record<string, ProfileBrief> = {};
    if (actorIds.length > 0) {
      const profileResult = await admin.rpc("get_profile_briefs", { user_ids: actorIds });
      if (profileResult.error) {
        return jsonError(profileResult.error.message, 500);
      }

      const rows = (profileResult.data ?? []) as ProfileBrief[];
      profileMap = rows.reduce<Record<string, ProfileBrief>>((acc, row) => {
        acc[row.id] = row;
        return acc;
      }, {});
    }

    return NextResponse.json({
      ok: true,
      metrics: {
        users: profilesCountResult.count ?? 0,
        publishedBlogPosts: publishedBlogCountResult.count ?? 0,
        forumPosts: forumPostCountResult.count ?? 0,
        publishedListings: publishedListingsCountResult.count ?? 0,
        bannedUsers: activeBannedCountResult.count ?? 0,
        totalProjects: totalProjectsCountResult.count ?? 0,
      },
      recentLogs: logs.map((log) => ({
        id: log.id,
        actorUserId: log.actor_user_id,
        actorRole: log.actor_role,
        actorName: displayName(profileMap[log.actor_user_id], log.actor_user_id),
        action: log.action,
        targetType: log.target_type,
        targetId: log.target_id,
        details: log.details ?? {},
        createdAt: log.created_at,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Özet bilgileri alınamadı.";
    return jsonError(message, 500);
  }
}
