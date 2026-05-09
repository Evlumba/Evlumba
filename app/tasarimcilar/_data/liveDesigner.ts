import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { FEATURED_DESIGNERS, type Designer, type PortfolioItem, type ReviewItem } from "./designers";
import {
  PROFESSIONAL_TYPE_ALIASES,
  PROFESSIONAL_TYPE_OPTIONS,
  PROJECT_TYPE_ALIASES,
  PROJECT_TYPE_OPTIONS,
  SERVICE_ALIASES,
  SERVICE_AREA_OPTIONS,
  SERVICE_OPTIONS,
  SERVICE_REGION_OPTIONS,
  STARTING_BUDGET_OPTIONS,
  STYLE_OPTIONS,
  TAG_OPTIONS,
  WORKING_MODEL_OPTIONS,
  profileGeneralArray,
  profileGeneralString,
  professionalTitle,
  uniqueAllowedValues,
} from "./profileGeneralMapping";
import { buildUniqueDesignerSlugs } from "./slugs";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  business_name: string | null;
  specialty: string | null;
  city: string | null;
  about: string | null;
  phone: string | null;
  contact_email: string | null;
  konum: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  cover_photo_url: string | null;
  tags: string[] | null;
  starting_from: string | null;
  about_details: Record<string, unknown> | null;
};

type ProjectRow = {
  id: string;
  title: string;
  project_type: string | null;
  location: string | null;
  description: string | null;
  tags: string[] | null;
  budget_level: string | null;
  cover_image_url: string | null;
  created_at: string;
  designer_project_images?: Array<{
    image_url: string;
    sort_order: number | null;
  }>;
  designer_project_shop_links?: Array<{
    id: string;
    image_url: string;
    pos_x: number | null;
    pos_y: number | null;
    product_url: string;
    product_title: string | null;
    product_image_url: string | null;
    product_price: string | null;
  }>;
};

type ReviewRow = {
  id: string;
  homeowner_id: string;
  project_id: string | null;
  rating: number;
  work_quality_rating: number | null;
  communication_rating: number | null;
  value_rating: number | null;
  review_text: string;
  reply_text: string | null;
  helpful_count: number | null;
  is_pinned: boolean | null;
  created_at: string;
};

type AdminRole = "admin" | "super_admin";

type SupabaseReadClient =
  | ReturnType<typeof getSupabaseAdminClient>
  | Awaited<ReturnType<typeof getSupabaseServerClient>>;

async function getLiveDesignerReadClient(): Promise<SupabaseReadClient> {
  try {
    return getSupabaseAdminClient();
  } catch {
    return await getSupabaseServerClient();
  }
}

function firstNameOnly(fullName: string | null | undefined) {
  const normalized = (fullName || "").trim().replace(/\s+/g, " ");
  if (!normalized) return "Kullanıcı";
  return normalized.split(" ")[0] || "Kullanıcı";
}

function normalizeInstagramHandle(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (raw.includes("instagram.com")) {
    try {
      const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      const firstPath = parsed.pathname
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)[0];
      return (firstPath ?? "").replace(/^@+/, "");
    } catch {
      return "";
    }
  }

  return raw.replace(/^@+/, "");
}

function budgetLabel(value: string | null) {
  if (value === "low") return "₺";
  if (value === "medium") return "₺₺";
  if (value === "high") return "₺₺₺";
  if (value === "pro") return "Pro";
  return "";
}

function isMissingShopLinksTableError(message?: string | null) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("designer_project_shop_links") &&
    (normalized.includes("schema cache") || normalized.includes("could not find the table"))
  );
}

function isMissingBlogPostsTableError(message?: string | null) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("blog_posts") &&
    (normalized.includes("could not find the table") ||
      normalized.includes("schema cache") ||
      normalized.includes("does not exist") ||
      normalized.includes("relation"))
  );
}

function formatResponseFromMinutes(avgMinutes: number | null) {
  if (!avgMinutes || Number.isNaN(avgMinutes) || avgMinutes <= 0) return "24 saat içinde dönüş";
  if (avgMinutes < 60) return `${Math.max(1, Math.round(avgMinutes))} dk içinde dönüş`;
  if (avgMinutes < 60 * 24) return `${Math.max(1, Math.round(avgMinutes / 60))} saat içinde dönüş`;
  return `${Math.max(1, Math.round(avgMinutes / (60 * 24)))} gün içinde dönüş`;
}

function toYearMonth(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "2026-01";
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${m}`;
}

async function computeResponseLabel(designerId: string, db: SupabaseReadClient) {
  const { data: conversations, error: conversationsError } = await db
    .from("conversations")
    .select("id, homeowner_id, designer_id")
    .eq("designer_id", designerId);

  if (conversationsError || !conversations || conversations.length === 0) return "24 saat içinde dönüş";

  const conversationIds = conversations.map((c) => c.id);
  const convById = new Map(conversations.map((c) => [c.id, c]));
  const { data: messages, error: messagesError } = await db
    .from("messages")
    .select("conversation_id, sender_id, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  if (messagesError || !messages || messages.length === 0) return "24 saat içinde dönüş";

  const grouped = new Map<string, Array<{ sender_id: string; created_at: string }>>();
  for (const row of messages) {
    if (!grouped.has(row.conversation_id)) grouped.set(row.conversation_id, []);
    grouped.get(row.conversation_id)?.push({ sender_id: row.sender_id, created_at: row.created_at });
  }

  let totalMin = 0;
  let count = 0;
  for (const [conversationId, rows] of grouped) {
    const conv = convById.get(conversationId);
    if (!conv) continue;

    let pendingHomeownerAt: number | null = null;
    for (const row of rows) {
      const ts = Date.parse(row.created_at);
      if (Number.isNaN(ts)) continue;
      if (row.sender_id === conv.homeowner_id) {
        pendingHomeownerAt = ts;
        continue;
      }
      if (row.sender_id === conv.designer_id && pendingHomeownerAt) {
        const diffMin = (ts - pendingHomeownerAt) / (1000 * 60);
        if (diffMin > 0) {
          totalMin += diffMin;
          count += 1;
        }
        pendingHomeownerAt = null;
      }
    }
  }

  return formatResponseFromMinutes(count > 0 ? totalMin / count : null);
}

export async function loadLiveDesignerBySlug(slug: string): Promise<Designer | null> {
  const db = await getLiveDesignerReadClient();
  let designerId: string | null = null;

  // Backward compatibility for older supa_<uuid> urls.
  if (slug.startsWith("supa_")) {
    const parsed = slug.slice(5).trim();
    if (parsed) designerId = parsed;
  }

  if (!designerId) {
    const { data: slugProfiles } = await db
      .from("profiles")
      .select("id, full_name, business_name")
      .in("role", ["designer", "designer_pending"])
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (!slugProfiles || slugProfiles.length === 0) return null;
    const slugMap = buildUniqueDesignerSlugs(
      slugProfiles as Array<{ id: string; full_name: string | null; business_name: string | null }>,
      FEATURED_DESIGNERS.map((d) => d.slug)
    );
    for (const [id, s] of slugMap.entries()) {
      if (s === slug) {
        designerId = id;
        break;
      }
    }
  }

  if (!designerId) return null;

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select(
      "id, full_name, role, avatar_url, business_name, specialty, city, about, phone, contact_email, konum, address, website, instagram, facebook, linkedin, cover_photo_url, tags, starting_from, about_details"
    )
    .eq("id", designerId)
    .in("role", ["designer", "designer_pending"])
    .maybeSingle();

  if (profileError || !profile) return null;

  const projectsWithShopLinks = await db
    .from("designer_projects")
    .select(
      "id, title, project_type, location, description, tags, budget_level, cover_image_url, created_at, designer_project_images(image_url, sort_order), designer_project_shop_links(id, image_url, pos_x, pos_y, product_url, product_title, product_image_url, product_price)"
    )
    .eq("designer_id", designerId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  let projectRows = (projectsWithShopLinks.data ?? []) as ProjectRow[];
  if (projectsWithShopLinks.error && isMissingShopLinksTableError(projectsWithShopLinks.error.message)) {
    const projectsWithoutShopLinks = await db
      .from("designer_projects")
      .select(
        "id, title, project_type, location, description, tags, budget_level, cover_image_url, created_at, designer_project_images(image_url, sort_order)"
      )
      .eq("designer_id", designerId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    projectRows = (projectsWithoutShopLinks.data ?? []).map((item) => ({
      ...(item as ProjectRow),
      designer_project_shop_links: [],
    })) as ProjectRow[];
  }
  const projectById = new Map(projectRows.map((p) => [p.id, p]));

  const { data: reviewRows } = await db
    .from("designer_reviews")
    .select("id, homeowner_id, project_id, rating, work_quality_rating, communication_rating, value_rating, review_text, reply_text, helpful_count, is_pinned, created_at")
    .eq("designer_id", designerId)
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []) as ReviewRow[];
  const reviewCount = reviews.length;
  const rating =
    reviewCount > 0
      ? Number((reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewCount).toFixed(1))
      : 0;

  const reviewerIds = Array.from(new Set(reviews.map((r) => r.homeowner_id).filter(Boolean)));
  let reviewerMap = new Map<string, string>();
  let reviewerAdminRoleMap = new Map<string, AdminRole>();
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await db.from("profiles").select("id, full_name").in("id", reviewerIds);
    const { data: reviewerAdminRoles } = await db
      .from("admin_users")
      .select("user_id, role")
      .in("user_id", reviewerIds)
      .eq("is_active", true);
    reviewerMap = new Map((reviewers ?? []).map((r) => [r.id, firstNameOnly(r.full_name)]));
    reviewerAdminRoleMap = new Map(
      ((reviewerAdminRoles ?? []) as Array<{ user_id: string; role: AdminRole }>).map((row) => [
        row.user_id,
        row.role,
      ])
    );
  }

  const response = await computeResponseLabel(designerId, db);
  const blogPostsResult = await db
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", designerId)
    .eq("status", "published");
  const blogPostCount = blogPostsResult.error
    ? isMissingBlogPostsTableError(blogPostsResult.error.message)
      ? 0
      : undefined
    : blogPostsResult.count ?? 0;

  const portfolio: PortfolioItem[] = projectRows.map((project) => {
    const sortedImages = [...(project.designer_project_images ?? [])]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((img) => (img.image_url ?? "").trim())
      .filter(Boolean);
    const shopLinks = (project.designer_project_shop_links ?? [])
      .map((item) => ({
        id: item.id,
        imageUrl: (item.image_url ?? "").trim(),
        x: Number(item.pos_x ?? 50),
        y: Number(item.pos_y ?? 50),
        productUrl: (item.product_url ?? "").trim(),
        productTitle: (item.product_title ?? "").trim(),
        productImageUrl: (item.product_image_url ?? "").trim(),
        productPrice: (item.product_price ?? "").trim(),
      }))
      .filter((item) => item.imageUrl && item.productUrl);

    const fallbackCover = (project.cover_image_url ?? "").trim();
    const cover = sortedImages[0] || fallbackCover;

    return {
      id: project.id,
      title: project.title,
      coverUrl: cover,
      room: project.project_type || undefined,
      style: (project.tags ?? [])[0] || undefined,
      location: project.location || undefined,
      description: project.description || undefined,
      tags: project.tags ?? undefined,
      budget: budgetLabel(project.budget_level),
      images: sortedImages.length > 0 ? sortedImages : cover ? [cover] : [],
      shopLinks,
    };
  });

  const reviewsList: ReviewItem[] = reviews.map((review) => ({
    id: review.id,
    homeownerId: review.homeowner_id,
    author: reviewerMap.get(review.homeowner_id) || "Kullanıcı",
    authorAdminRole: reviewerAdminRoleMap.get(review.homeowner_id) ?? null,
    rating: Number(review.rating || 0),
    date: toYearMonth(review.created_at),
    text: review.review_text || "",
    project: review.project_id ? projectById.get(review.project_id)?.title : undefined,
    ratings: {
      workQuality: review.work_quality_rating ?? undefined,
      communication: review.communication_rating ?? undefined,
      value: review.value_rating ?? undefined,
    },
    reply: review.reply_text
      ? {
          text: review.reply_text,
          date: toYearMonth(review.created_at),
        }
      : undefined,
    pinned: Boolean(review.is_pinned),
    helpfulCount: review.helpful_count ?? 0,
  }));

  const pinned = reviewsList.find((r) => r.pinned);
  const aboutDetails = (profile as ProfileRow).about_details ?? {};
  const profileGeneral = (aboutDetails.profileGeneral ?? {}) as Record<string, unknown>;
  const p = profile as ProfileRow;
  const instagramHandle = normalizeInstagramHandle(p.instagram);
  const generalProfessionalTypes = profileGeneralArray(profileGeneral, "professionalTypes", PROFESSIONAL_TYPE_OPTIONS);
  const fallbackProfessionalTypes = uniqueAllowedValues(
    p.specialty?.replace(/\s*-\s*/g, ",").replace(/\s*\/\s*/g, ",") ?? "",
    PROFESSIONAL_TYPE_OPTIONS,
    PROFESSIONAL_TYPE_ALIASES
  );
  const professionalTypes = generalProfessionalTypes.length ? generalProfessionalTypes : fallbackProfessionalTypes;
  const generalProjectTypes = profileGeneralArray(profileGeneral, "projectTypes", PROJECT_TYPE_OPTIONS);
  const legacyProjectTypes = uniqueAllowedValues(aboutDetails.projectTypes, PROJECT_TYPE_OPTIONS, PROJECT_TYPE_ALIASES);
  const generalServices = profileGeneralArray(profileGeneral, "services", SERVICE_OPTIONS);
  const legacyServices = uniqueAllowedValues(aboutDetails.services, SERVICE_OPTIONS, SERVICE_ALIASES);
  const generalServiceAreas = profileGeneralArray(profileGeneral, "serviceAreas", SERVICE_AREA_OPTIONS);
  const generalStyleExpertise = profileGeneralArray(profileGeneral, "styleExpertise", STYLE_OPTIONS);
  const generalServiceRegions = profileGeneralArray(profileGeneral, "serviceRegions", SERVICE_REGION_OPTIONS);
  const generalTags = profileGeneralArray(profileGeneral, "tags", TAG_OPTIONS);
  const generalWorkingModels = profileGeneralArray(profileGeneral, "workingModels", WORKING_MODEL_OPTIONS);
  const legacyTags = uniqueAllowedValues(p.tags, TAG_OPTIONS);
  const generalCities = Array.isArray(profileGeneral.cities)
    ? (profileGeneral.cities as string[]).map((x) => x.trim()).filter(Boolean)
    : [];
  const primaryCity = generalCities[0] || profileGeneralString(profileGeneral, "city") || "Türkiye";
  const displayName = profileGeneralString(profileGeneral, "displayName") || p.full_name?.trim() || p.business_name?.trim() || "Yeni Tasarımcı";
  const displayBio = typeof aboutDetails.bio === "string" ? aboutDetails.bio.trim() : "";
  const startingBudget = profileGeneralString(profileGeneral, "startingBudget", STARTING_BUDGET_OPTIONS);

  return {
    slug,
    liveDesignerId: p.id,
    blogPostCount,
    name: displayName,
    title: professionalTitle(professionalTypes),
    city: primaryCity,
    cities: generalCities.length ? generalCities : primaryCity !== "Türkiye" ? [primaryCity] : [],
    district: profileGeneralString(profileGeneral, "district") || undefined,
    rating,
    reviews: reviewCount,
    verified: true,
    pinnedReview: pinned?.text,
    pinnedBy: pinned?.author,
    tags: (generalTags.length ? generalTags : legacyTags).length
      ? (generalTags.length ? generalTags : legacyTags).slice(0, 10)
      : ["Yeni Profesyonel"],
    coverUrl: p.cover_photo_url || portfolio[0]?.coverUrl || "",
    response,
    startingFrom: startingBudget || budgetLabel(projectRows[0]?.budget_level ?? null),
    startingBudget: startingBudget || undefined,
    portfolioCount: portfolio.length,
    projectTypes: generalProjectTypes.length ? generalProjectTypes : legacyProjectTypes,
    services: generalServices.length ? generalServices : legacyServices,
    professionalTypes,
    serviceAreas: generalServiceAreas,
    styleExpertise: generalStyleExpertise,
    serviceRegions: generalServiceRegions,
    workingModels: generalWorkingModels,
    avatarUrl: p.avatar_url || undefined,
    about: {
      headline: typeof aboutDetails.headline === "string" ? aboutDetails.headline : undefined,
      bio: displayBio || undefined,
      blogHeaderTitle:
        typeof aboutDetails.blogHeaderTitle === "string"
          ? aboutDetails.blogHeaderTitle
          : undefined,
      blogHeaderDescription:
        typeof aboutDetails.blogHeaderDescription === "string"
          ? aboutDetails.blogHeaderDescription
          : undefined,
      blogHeaderImageUrl:
        typeof aboutDetails.blogHeaderImageUrl === "string"
          ? aboutDetails.blogHeaderImageUrl
          : undefined,
    },
    portfolio,
    reviewsList,
    business: {
      name: profileGeneralString(profileGeneral, "businessName") || p.business_name?.trim() || undefined,
      phone: p.phone || undefined,
      email: p.contact_email || undefined,
      website: p.website || undefined,
      locationUrl: p.konum || undefined,
      address: p.address
        ? {
            street: p.address,
            city: primaryCity !== "Türkiye" ? primaryCity : undefined,
            district: profileGeneralString(profileGeneral, "district") || undefined,
          }
        : undefined,
      socials: {
        instagram: instagramHandle || undefined,
        linkedin: p.linkedin || undefined,
      },
    },
  };
}
