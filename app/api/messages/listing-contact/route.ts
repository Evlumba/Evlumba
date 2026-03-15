import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type AppRole = "homeowner" | "designer" | "designer_pending";

function normalizeRole(raw: unknown): AppRole | null {
  if (raw === "homeowner" || raw === "designer" || raw === "designer_pending") return raw;
  return null;
}

function isDesignerRole(role: AppRole | null) {
  return role === "designer" || role === "designer_pending";
}

function listingNumberFromId(id: string) {
  return id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { ok: false, error: authError?.message || "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const senderId = authData.user.id;
    const payload = (await request.json().catch(() => null)) as
      | { listingId?: string; applicationId?: string; message?: string }
      | null;

    const listingId = String(payload?.listingId ?? "").trim();
    const applicationId = String(payload?.applicationId ?? "").trim();
    const message = String(payload?.message ?? "").trim();

    if (!listingId || message.length < 3) {
      return NextResponse.json(
        { ok: false, error: "Geçersiz istek. İlan ve mesaj zorunludur." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { data: listing, error: listingError } = await admin
      .from("listings")
      .select("id, owner_id, owner_role, listing_type, title")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError || !listing) {
      return NextResponse.json({ ok: false, error: "İlan bulunamadı." }, { status: 404 });
    }

    let recipientId: string;
    if (applicationId) {
      const { data: application, error: applicationError } = await admin
        .from("listing_applications")
        .select("id, listing_id, applicant_id, status")
        .eq("id", applicationId)
        .maybeSingle();

      if (applicationError || !application) {
        return NextResponse.json({ ok: false, error: "Başvuru bulunamadı." }, { status: 404 });
      }
      if (application.listing_id !== listing.id) {
        return NextResponse.json({ ok: false, error: "Başvuru bu ilana ait değil." }, { status: 400 });
      }
      if (listing.owner_id !== senderId) {
        return NextResponse.json({ ok: false, error: "Bu işlem için yetkin yok." }, { status: 403 });
      }
      if (application.status !== "accepted") {
        return NextResponse.json(
          { ok: false, error: "Mesaj göndermek için başvuru kabul edilmiş olmalı." },
          { status: 400 }
        );
      }
      recipientId = application.applicant_id;
    } else {
      if (listing.listing_type !== "offer_service") {
        return NextResponse.json(
          { ok: false, error: "Doğrudan mesaj sadece hizmet verilen ilanlarda kullanılabilir." },
          { status: 400 }
        );
      }
      if (listing.owner_id === senderId) {
        return NextResponse.json(
          { ok: false, error: "Kendi ilanına doğrudan mesaj gönderemezsin." },
          { status: 400 }
        );
      }
      recipientId = listing.owner_id;
    }

    const [
      { data: senderRoleFromDb, error: senderRoleError },
      { data: recipientRoleFromDb, error: recipientRoleError },
    ] = await Promise.all([
      admin.rpc("get_profile_role", { user_id: senderId }),
      admin.rpc("get_profile_role", { user_id: recipientId }),
    ]);

    if (senderRoleError || recipientRoleError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            senderRoleError?.message ||
            recipientRoleError?.message ||
            "Rol bilgisi okunamadı.",
        },
        { status: 500 }
      );
    }

    const senderRole =
      normalizeRole(senderRoleFromDb) ??
      normalizeRole(authData.user.user_metadata?.role) ??
      (senderId === listing.owner_id ? normalizeRole(listing.owner_role) : null);
    const recipientRole =
      normalizeRole(recipientRoleFromDb) ??
      (recipientId === listing.owner_id ? normalizeRole(listing.owner_role) : null);

    let homeownerId: string | null = null;
    let designerId: string | null = null;

    if (senderRole === "homeowner" && isDesignerRole(recipientRole)) {
      homeownerId = senderId;
      designerId = recipientId;
    } else if (recipientRole === "homeowner" && isDesignerRole(senderRole)) {
      homeownerId = recipientId;
      designerId = senderId;
    } else if (isDesignerRole(senderRole) && isDesignerRole(recipientRole)) {
      homeownerId = senderId;
      designerId = recipientId;
    } else {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Mesajlaşma şu an kullanıcı-profesyonel veya profesyonel-profesyonel eşleşmelerinde destekleniyor.",
        },
        { status: 400 }
      );
    }

    const conversationQuery =
      isDesignerRole(senderRole) && isDesignerRole(recipientRole)
        ? admin
            .from("conversations")
            .select("id")
            .or(
              `and(homeowner_id.eq.${homeownerId},designer_id.eq.${designerId}),and(homeowner_id.eq.${designerId},designer_id.eq.${homeownerId})`
            )
            .limit(1)
            .maybeSingle()
        : admin
            .from("conversations")
            .select("id")
            .eq("homeowner_id", homeownerId)
            .eq("designer_id", designerId)
            .maybeSingle();

    const { data: existingConversation, error: conversationFindError } = await conversationQuery;

    if (conversationFindError) {
      return NextResponse.json(
        { ok: false, error: conversationFindError.message },
        { status: 500 }
      );
    }

    let conversationId = existingConversation?.id ?? null;
    if (!conversationId) {
      const { data: insertedConversation, error: conversationInsertError } = await admin
        .from("conversations")
        .insert({
          homeowner_id: homeownerId,
          designer_id: designerId,
        })
        .select("id")
        .single();

      if (conversationInsertError || !insertedConversation) {
        return NextResponse.json(
          { ok: false, error: conversationInsertError?.message || "Konuşma açılamadı." },
          { status: 500 }
        );
      }
      conversationId = insertedConversation.id;
    }

    const listingNumber = listingNumberFromId(listing.id);
    const messageBody = `Konu: ${listing.title}\nİlan No: ${listingNumber}\n\n${message}`;

    const { error: messageInsertError } = await admin.from("messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: messageBody,
    });

    if (messageInsertError) {
      return NextResponse.json(
        { ok: false, error: messageInsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      conversationId,
      listingNumber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mesaj gönderilemedi.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
