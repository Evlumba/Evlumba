import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{ id: string }>;
};

function firstNameOnly(fullName: string | null | undefined) {
  const normalized = (fullName || "").trim().replace(/\s+/g, " ");
  if (!normalized) return "Kullanıcı";
  return normalized.split(" ")[0] || "Kullanıcı";
}

function isMissingShopLinksTableError(message?: string | null) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("designer_project_shop_links") &&
    (normalized.includes("schema cache") || normalized.includes("could not find the table"))
  );
}

export async function GET(_req: Request, context: Params) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Eksik designer id" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select(
        "id, full_name, business_name, specialty, city, about, phone, contact_email, address, website, instagram, facebook, linkedin, cover_photo_url, avatar_url"
      )
      .eq("id", id)
      .in("role", ["designer", "designer_pending"])
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "Profesyonel bulunamadı" }, { status: 404 });
    }

    const projectsWithShopLinks = await admin
      .from("designer_projects")
      .select(
        "id, title, project_type, location, description, tags, color_palette, budget_level, cover_image_url, created_at, designer_project_images(image_url, sort_order), designer_project_shop_links(id, image_url, pos_x, pos_y, product_url, product_title, product_image_url, product_price)"
      )
      .eq("designer_id", id)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    let projects = projectsWithShopLinks.data ?? [];
    if (projectsWithShopLinks.error && isMissingShopLinksTableError(projectsWithShopLinks.error.message)) {
      const projectsWithoutShopLinks = await admin
        .from("designer_projects")
        .select(
          "id, title, project_type, location, description, tags, color_palette, budget_level, cover_image_url, created_at, designer_project_images(image_url, sort_order)"
        )
        .eq("designer_id", id)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      projects = (projectsWithoutShopLinks.data ?? []).map((item) => ({
        ...item,
        designer_project_shop_links: [],
      }));
    }

    const { data: reviewRows } = await admin
      .from("designer_reviews")
      .select("id, homeowner_id, project_id, rating, work_quality_rating, communication_rating, value_rating, review_text, reply_text, helpful_count, is_pinned, created_at")
      .eq("designer_id", id)
      .order("created_at", { ascending: false });

    const reviews = reviewRows ?? [];
    const reviewCount = reviews.length;
    const rating =
      reviewCount > 0
        ? Number((reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0) / reviewCount).toFixed(1))
        : 0;

    let responseLabel = "24 saat içinde dönüş";
    const { data: conversations } = await admin
      .from("conversations")
      .select("id, homeowner_id, designer_id")
      .eq("designer_id", id);

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map((c) => c.id);
      const convById = new Map(conversations.map((c) => [c.id, c]));

      const { data: messages } = await admin
        .from("messages")
        .select("conversation_id, sender_id, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true });

      if (messages && messages.length > 0) {
        const msgByConversation = new Map<string, Array<{ sender_id: string; created_at: string }>>();
        for (const msg of messages) {
          if (!msgByConversation.has(msg.conversation_id)) {
            msgByConversation.set(msg.conversation_id, []);
          }
          msgByConversation.get(msg.conversation_id)?.push({
            sender_id: msg.sender_id,
            created_at: msg.created_at,
          });
        }

        let totalMin = 0;
        let count = 0;
        for (const [conversationId, rows] of msgByConversation) {
          const conversation = convById.get(conversationId);
          if (!conversation) continue;

          let pendingHomeownerAt: number | null = null;
          for (const row of rows) {
            const ts = Date.parse(row.created_at);
            if (Number.isNaN(ts)) continue;

            if (row.sender_id === conversation.homeowner_id) {
              pendingHomeownerAt = ts;
              continue;
            }
            if (row.sender_id === conversation.designer_id && pendingHomeownerAt) {
              const diffMin = (ts - pendingHomeownerAt) / (1000 * 60);
              if (diffMin > 0) {
                totalMin += diffMin;
                count += 1;
              }
              pendingHomeownerAt = null;
            }
          }
        }

        if (count > 0) {
          const avgMinutes = totalMin / count;
          if (avgMinutes < 60) responseLabel = `${Math.max(1, Math.round(avgMinutes))} dk içinde dönüş`;
          else if (avgMinutes < 60 * 24) responseLabel = `${Math.max(1, Math.round(avgMinutes / 60))} saat içinde dönüş`;
          else responseLabel = `${Math.max(1, Math.round(avgMinutes / (60 * 24)))} gün içinde dönüş`;
        }
      }
    }

    const homeownerIds = Array.from(new Set(reviews.map((r) => r.homeowner_id).filter(Boolean)));
    let authorNameById = new Map<string, string>();
    if (homeownerIds.length > 0) {
      const { data: reviewerProfiles } = await admin
        .from("profiles")
        .select("id, full_name")
        .in("id", homeownerIds);

      authorNameById = new Map((reviewerProfiles ?? []).map((row) => [row.id, firstNameOnly(row.full_name)]));
    }

    const normalizedProjects = (projects ?? []).map((project) => {
      const sortedImages = [...(project.designer_project_images ?? [])]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((img) => (img.image_url ?? "").trim())
        .filter(Boolean);
      const shopLinks = (project.designer_project_shop_links ?? [])
        .map((item) => ({
          id: item.id,
          image_url: (item.image_url ?? "").trim(),
          pos_x: Number(item.pos_x ?? 50),
          pos_y: Number(item.pos_y ?? 50),
          product_url: (item.product_url ?? "").trim(),
          product_title: (item.product_title ?? "").trim(),
          product_image_url: (item.product_image_url ?? "").trim(),
          product_price: (item.product_price ?? "").trim(),
        }))
        .filter((item) => item.image_url && item.product_url);
      const fallbackCover = (project.cover_image_url ?? "").trim();
      return {
        ...project,
        cover_image_url: sortedImages[0] || fallbackCover || null,
        designer_project_shop_links: shopLinks,
      };
    });

    return NextResponse.json({
      ok: true,
      profile,
      projects: normalizedProjects,
      rating,
      reviewCount,
      responseLabel,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        work_quality_rating: review.work_quality_rating,
        communication_rating: review.communication_rating,
        value_rating: review.value_rating,
        review_text: review.review_text,
        reply_text: review.reply_text,
        helpful_count: review.helpful_count,
        is_pinned: review.is_pinned,
        created_at: review.created_at,
        author_name: authorNameById.get(review.homeowner_id) || "Kullanıcı",
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
