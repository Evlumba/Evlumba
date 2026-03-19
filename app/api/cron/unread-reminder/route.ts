import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// Vercel Cron calls this with a secret to prevent unauthorized triggers
function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  // Find designers who have unread messages sent in the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: unreadMessages, error } = await admin
    .from("messages")
    .select(`
      id,
      sender_id,
      conversation_id,
      conversations!inner(designer_id)
    `)
    .eq("is_read", false)
    .gte("created_at", since);

  if (error) {
    console.error("unread-reminder: query error", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!unreadMessages || unreadMessages.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group unread message counts by designer_id, exclude messages sent by the designer themselves
  const unreadByDesigner = new Map<string, number>();
  for (const msg of unreadMessages) {
    const conv = msg.conversations as unknown as { designer_id: string } | null;
    if (!conv) continue;
    const designerId = conv.designer_id;
    // Only count messages NOT sent by the designer (i.e. incoming messages)
    if (msg.sender_id === designerId) continue;
    unreadByDesigner.set(designerId, (unreadByDesigner.get(designerId) ?? 0) + 1);
  }

  if (unreadByDesigner.size === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Fetch auth emails for these designers
  const designerIds = Array.from(unreadByDesigner.keys());
  const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const authEmailById = new Map(authUsers.users.map((u) => [u.id, u.email]));

  // Fetch profile names
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", designerIds);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  let sent = 0;
  for (const [designerId, count] of unreadByDesigner) {
    const email = authEmailById.get(designerId);
    if (!email) continue;

    const name = nameById.get(designerId) || "Profesyonel";

    const { error: mailError } = await resend.emails.send({
      from: "Evlumba <info@evlumba.com>",
      to: email,
      subject: `${count} okunmamış mesajın var`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <img src="https://www.evlumba.com/web_icon2.png" alt="Evlumba" style="height:40px;margin-bottom:24px" />
          <h2 style="margin:0 0 12px;font-size:20px;color:#111">Merhaba ${name},</h2>
          <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6">
            Bugün gelen <strong>${count} okunmamış mesajın</strong> var. Müşterilerine hızlı dönüş yapmak profilini öne çıkarır.
          </p>
          <a href="https://www.evlumba.com/messages"
             style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
            Mesajlarımı Gör
          </a>
          <p style="margin:32px 0 0;font-size:12px;color:#999">
            Bu maili Evlumba üzerinden aldın. <a href="https://www.evlumba.com" style="color:#999">evlumba.com</a>
          </p>
        </div>
      `,
    });

    if (mailError) {
      console.error(`unread-reminder: mail failed for ${designerId}:`, mailError.message);
    } else {
      sent++;
    }
  }

  console.log(`unread-reminder: sent ${sent} emails`);
  return NextResponse.json({ sent });
}
