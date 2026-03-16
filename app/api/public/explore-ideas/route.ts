import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { ExploreIdea, ExploreRoomId } from "@/lib/data";

// export const dynamic = "force-dynamic"; // COST-FIX
export const revalidate = 3600; // COST-FIX: 1 hour

type ProjectRow = {
  id: string;
  designer_id: string;
  title: string | null;
  project_type: string | null;
  location: string | null;
  description: string | null;
  tags: string[] | null;
  budget_level: string | null;
  cover_image_url: string | null;
  created_at: string;
  designer_project_images?: Array<{
    image_url: string | null;
    sort_order: number | null;
  }>;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  city: string | null;
  avatar_url: string | null;
};

type ReviewRow = {
  designer_id: string;
  rating: number | null;
};

const ROOM_MAP: Array<{ roomId: ExploreRoomId; label: string; patterns: string[] }> = [
  { roomId: "mutfak", label: "Mutfak", patterns: ["mutfak", "kitchen"] },
  { roomId: "banyo", label: "Banyo", patterns: ["banyo", "bath"] },
  { roomId: "salon", label: "Salon", patterns: ["salon", "oturma", "living"] },
  { roomId: "yatak-odasi", label: "Yatak Odası", patterns: ["yatak", "bedroom"] },
  { roomId: "cocuk", label: "Bebek & Çocuk", patterns: ["çocuk", "cocuk", "bebek", "kids", "child"] },
  { roomId: "ev-ofisi", label: "Ev Ofisi", patterns: ["ofis", "çalışma", "calisma", "study", "home office"] },
  { roomId: "balkon", label: "Balkon", patterns: ["balkon", "teras", "terrace"] },
  { roomId: "antre", label: "Antre", patterns: ["antre", "giriş", "giris", "hol", "hall", "entry"] },
];

const STYLE_OPTIONS = ["Modern", "Minimal", "Japandi", "İskandinav", "Klasik", "Endüstriyel"];
const COLOR_OPTIONS = ["Beyaz", "Bej", "Ahşap", "Gri", "Siyah", "Yeşil", "Mavi"];
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=70";
const PLACEHOLDER_AVATAR = "https://i.pravatar.cc/120?u=evlumba-live";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function roomFromStructuredTag(tags: string[] | null) {
  for (const rawTag of tags ?? []) {
    const tag = normalize(rawTag.trim());
    if (!tag.startsWith("oda:") && !tag.startsWith("room:")) continue;
    const roomId = tag.split(":")[1]?.trim();
    const room = ROOM_MAP.find((item) => item.roomId === roomId);
    if (room) return room;
  }
  return null;
}

function mapRoom(projectType: string | null, title: string | null, tags: string[] | null) {
  const structured = roomFromStructuredTag(tags);
  if (structured) {
    return { roomId: structured.roomId, roomLabel: structured.label };
  }

  const exactProjectType = normalize((projectType ?? "").trim());
  const exact = ROOM_MAP.find((room) => normalize(room.label) === exactProjectType);
  if (exact) {
    return { roomId: exact.roomId, roomLabel: exact.label };
  }

  const haystack = normalize(
    [projectType ?? "", title ?? "", ...(tags ?? [])]
      .join(" ")
      .trim()
  );
  for (const room of ROOM_MAP) {
    if (room.patterns.some((pattern) => haystack.includes(normalize(pattern)))) {
      return { roomId: room.roomId, roomLabel: room.label };
    }
  }
  return { roomId: "salon" as ExploreRoomId, roomLabel: "Salon" };
}

function mapBudget(input: string | null): ExploreIdea["budget"] {
  if (input === "low") return "Uygun";
  if (input === "medium") return "Orta";
  if (input === "high") return "Premium";
  if (input === "pro") return "Lüks";
  return "Orta";
}

function detectStyle(tags: string[] | null, projectType: string | null): string {
  const bag = normalize([...(tags ?? []), projectType ?? ""].join(" "));
  for (const style of STYLE_OPTIONS) {
    if (bag.includes(normalize(style))) return style;
  }
  return "Modern";
}

function detectColor(tags: string[] | null, description: string | null): string {
  const bag = normalize([...(tags ?? []), description ?? ""].join(" "));
  for (const color of COLOR_OPTIONS) {
    if (bag.includes(normalize(color))) return color;
  }
  return "Bej";
}

function toIdea(project: ProjectRow, profile: ProfileRow | null, rating: number, reviewCount: number): ExploreIdea {
  const orderedImages = [...(project.designer_project_images ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((x) => (x.image_url ?? "").trim())
    .filter(Boolean);
  const imageUrl = orderedImages[0] || (project.cover_image_url ?? "").trim() || PLACEHOLDER_IMAGE;
  const { roomId, roomLabel } = mapRoom(project.project_type, project.title, project.tags);
  const tags = Array.from(new Set([...(project.tags ?? []), roomLabel, detectStyle(project.tags, project.project_type), detectColor(project.tags, project.description)]))
    .slice(0, 8);

  const designerSlug = `supa_${project.designer_id}`;
  const createdMs = Date.parse(project.created_at);
  const popularity = Number.isNaN(createdMs) ? 0 : createdMs;

  return {
    id: `live-${project.id}`,
    title: (project.title ?? "").trim() || "Yeni Proje",
    roomId,
    roomLabel,
    style: detectStyle(project.tags, project.project_type),
    color: detectColor(project.tags, project.description),
    budget: mapBudget(project.budget_level),
    city: profile?.city?.trim() || project.location?.trim() || "Türkiye",
    imageUrl,
    designerId: designerSlug,
    designerName: profile?.full_name?.trim() || profile?.business_name?.trim() || "Yeni Profesyonel",
    designerSlug,
    designerAvatarUrl: (profile?.avatar_url ?? "").trim() || PLACEHOLDER_AVATAR,
    designerRating: Number.isFinite(rating) ? Number(rating.toFixed(1)) : 0,
    designerReviews: reviewCount,
    description:
      (project.description ?? "").trim() ||
      `${roomLabel} için yayınlanan proje`,
    popularity,
    tags,
    detailUrl: `/tasarimcilar/${designerSlug}/proje/${project.id}`,
  };
}

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();

    const { data: projectsData, error: projectsError } = await admin
      .from("designer_projects")
      .select(
        "id, designer_id, title, project_type, location, description, tags, budget_level, cover_image_url, created_at, designer_project_images(image_url, sort_order)"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(400);

    if (projectsError) {
      return NextResponse.json({ ok: false, error: projectsError.message }, { status: 500 });
    }

    const projects = (projectsData ?? []) as ProjectRow[];
    if (projects.length === 0) {
      return NextResponse.json({ ok: true, ideas: [] as ExploreIdea[] });
    }

    const designerIds = Array.from(new Set(projects.map((p) => p.designer_id).filter(Boolean)));

    const [{ data: profilesData }, { data: reviewsData }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, business_name, city, avatar_url")
        .in("id", designerIds)
        .in("role", ["designer", "designer_pending"]),
      admin
        .from("designer_reviews")
        .select("designer_id, rating")
        .in("designer_id", designerIds),
    ]);

    const profiles = (profilesData ?? []) as ProfileRow[];
    const profileById = new Map(profiles.map((p) => [p.id, p]));

    const reviews = (reviewsData ?? []) as ReviewRow[];
    const ratingStats = new Map<string, { sum: number; count: number }>();
    for (const row of reviews) {
      if (!row.designer_id || typeof row.rating !== "number") continue;
      const cur = ratingStats.get(row.designer_id) ?? { sum: 0, count: 0 };
      cur.sum += row.rating;
      cur.count += 1;
      ratingStats.set(row.designer_id, cur);
    }

    const ideas = projects.map((project) => {
      const profile = profileById.get(project.designer_id) ?? null;
      const stats = ratingStats.get(project.designer_id);
      const rating = stats && stats.count > 0 ? stats.sum / stats.count : 0;
      const reviewCount = stats?.count ?? 0;
      return toIdea(project, profile, rating, reviewCount);
    });

    return NextResponse.json({ ok: true, ideas });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
