import { NextResponse } from "next/server";
import { getCurrentAdminContext } from "@/lib/admin/access";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getCurrentAdminContext();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdminClient();

  // Get all unread messages grouped by designer
  const { data, error } = await supabaseAdmin.rpc("admin_unread_messages_by_designer");

  if (error) {
    // Fallback: manual query if RPC doesn't exist
    return await fallbackQuery(supabaseAdmin);
  }

  return NextResponse.json({ ok: true, designers: data ?? [] });
}

async function fallbackQuery(supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>) {
  // Get all unread messages with conversation + designer info
  const { data: unreadMessages, error } = await supabaseAdmin
    .from("messages")
    .select("id, sender_id, conversation_id, created_at, conversations!inner(designer_id)")
    .is("read_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (unreadMessages ?? []) as Array<{
    id: string;
    sender_id: string;
    conversation_id: string;
    created_at: string;
    conversations: { designer_id: string } | Array<{ designer_id: string }>;
  }>;

  // Group by designer
  const byDesigner = new Map<string, {
    designerId: string;
    unreadCount: number;
    senderIds: Set<string>;
    lastSenderId: string;
    lastMessageAt: string;
  }>();

  for (const row of rows) {
    const conv = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
    if (!conv) continue;
    const designerId = conv.designer_id;

    // Skip messages sent by the designer themselves
    if (row.sender_id === designerId) continue;

    const existing = byDesigner.get(designerId);
    if (existing) {
      existing.unreadCount++;
      existing.senderIds.add(row.sender_id);
      if (row.created_at > existing.lastMessageAt) {
        existing.lastSenderId = row.sender_id;
        existing.lastMessageAt = row.created_at;
      }
    } else {
      byDesigner.set(designerId, {
        designerId,
        unreadCount: 1,
        senderIds: new Set([row.sender_id]),
        lastSenderId: row.sender_id,
        lastMessageAt: row.created_at,
      });
    }
  }

  if (byDesigner.size === 0) {
    return NextResponse.json({ ok: true, designers: [] });
  }

  // Fetch designer + sender profiles
  const allUserIds = new Set<string>();
  for (const entry of byDesigner.values()) {
    allUserIds.add(entry.designerId);
    allUserIds.add(entry.lastSenderId);
  }

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, business_name")
    .in("id", Array.from(allUserIds));

  const profileMap = new Map<string, string>();
  for (const p of (profiles ?? [])) {
    profileMap.set(p.id, p.full_name?.trim() || p.business_name?.trim() || "Bilinmeyen");
  }

  const result = Array.from(byDesigner.values())
    .map((entry) => ({
      designerId: entry.designerId,
      designerName: profileMap.get(entry.designerId) ?? "Bilinmeyen",
      unreadCount: entry.unreadCount,
      uniqueSenders: entry.senderIds.size,
      lastSenderName: profileMap.get(entry.lastSenderId) ?? "Bilinmeyen",
      lastMessageAt: entry.lastMessageAt,
    }))
    .sort((a, b) => b.unreadCount - a.unreadCount);

  return NextResponse.json({ ok: true, designers: result });
}
