// app/tasarimcilar/page.tsx
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { PROMATCH } from "../../lib/promatch";
import { ArrowRight, BadgeCheck, Layers, Timer, Search } from "lucide-react";
import DesignersResultsClient from "./_components/DesignersResultsClient";
import { FEATURED_DESIGNERS, type Designer } from "./_data/designers";
import { buildUniqueDesignerSlugs } from "./_data/slugs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

// export const dynamic = "force-dynamic"; // COST-FIX: removed
export const revalidate = 3600; // COST-FIX: 1 hour ISR cache

const shell: CSSProperties = {
  background: "rgba(255,255,255,0.62)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 26px 80px rgba(15,23,42,0.10)",
  backdropFilter: "blur(18px)",
};

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 18px 55px rgba(15,23,42,0.08)",
  backdropFilter: "blur(16px)",
};

function MiniPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
      style={{
        background: "rgba(255,255,255,0.72)",
        boxShadow: "0 0 0 1px rgba(15,23,42,0.06), 0 10px 30px rgba(15,23,42,0.06)",
        backdropFilter: "blur(14px)",
        color: "rgba(15,23,42,0.78)",
      }}
    >
      <span className="opacity-80">{icon}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}

function ProMatchBannerInline() {
  const hero =
    PROMATCH?.images?.bannerHero ||
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80";

  return (
    <section className="mt-6 overflow-x-clip px-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px]" style={shell}>
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute -top-28 left-10 h-72 w-72 rounded-full bg-[rgba(16,185,129,0.12)] blur-3xl" />
            <div className="absolute -bottom-28 right-10 h-80 w-80 rounded-full bg-[rgba(99,102,241,0.10)] blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_10%_10%,rgba(255,255,255,0.92),transparent_60%)]" />
          </div>

          <div className="relative z-10 grid items-center gap-8 p-6 md:grid-cols-12 md:gap-10 md:p-8">
            <div className="md:col-span-7">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm"
                style={{
                  background: "rgba(255,255,255,0.74)",
                  boxShadow: "0 0 0 1px rgba(15,23,42,0.06)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-[rgba(15,23,42,0.86)]">ProMatch</span>
                <span className="text-[rgba(15,23,42,0.35)]">•</span>
                <span className="text-[rgba(15,23,42,0.66)]">3 soru → doğru profesyonel</span>
              </div>

              <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-[#0f172a] md:text-[34px] md:leading-[1.10]">
                Tarzını yakala.{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Doğru tasarımcıyla eşleş.</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[0.42em] rounded-[14px] bg-[rgba(16,185,129,0.18)]" />
                </span>
              </h1>

              <p className="mt-3 max-w-xl text-[15px] leading-7 text-[rgba(15,23,42,0.68)]">
                Beğenilerin + 3 mini soru → ihtiyacın netleşir. Biz de portföy & yorum & paket uyumuna göre en iyi listeyi çıkarırız.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <MiniPill icon={<BadgeCheck className="h-4 w-4" />} label="Doğrulanmış sinyal" />
                <MiniPill icon={<Layers className="h-4 w-4" />} label="Bütçe uyumu" />
                <MiniPill icon={<Timer className="h-4 w-4" />} label="Hızlı eşleşme" />
              </div>

              <div className="relative z-10 mt-6">
                <Link
                  href="/tasarimcilar?wizard=1"
                  className="group relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition hover:-translate-y-px active:translate-y-0 active:scale-[0.99]"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(99,102,241,0.16) 55%, rgba(255,255,255,0.75) 100%)",
                    boxShadow: "0 0 0 1px rgba(15,23,42,0.10), 0 16px 44px rgba(15,23,42,0.10)",
                    color: "rgba(15,23,42,0.88)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <span className="relative z-10">Bulmama yardımcı ol</span>
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <div className="md:col-span-5">
              <div
                className="overflow-hidden rounded-[26px]"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  boxShadow: "0 0 0 1px rgba(15,23,42,0.07), 0 28px 80px rgba(15,23,42,0.16)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <div className="relative h-56 w-full md:h-64">
                  <img
                    src={hero}
                    alt="İç mimar & müşteri — materyal seçimi ve planlama"
                    className="block h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_circle_at_20%_10%,rgba(255,255,255,0.22),transparent_55%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-b from-transparent to-white/40" />
        </div>
      </div>
    </section>
  );
}

type SP = Record<string, string | string[] | undefined>;
const pick = (sp: SP | undefined, key: string) => {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v || "";
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  specialty: string | null;
  city: string | null;
  contact_email: string | null;
  tags: string[] | null;
  starting_from: string | null;
  about_details: Record<string, unknown> | null;
  business_details: Record<string, unknown> | null;
  cover_photo_url: string | null;
  avatar_url: string | null;
};

type ProjectRow = {
  designer_id: string;
  title: string;
  project_type: string | null;
  tags: string[] | null;
  budget_level: string | null;
  cover_image_url: string | null;
  created_at: string;
};

type ReviewAggRow = {
  designer_id: string;
  rating: number;
};

type ConversationRow = {
  id: string;
  homeowner_id: string;
  designer_id: string;
};

type MessageRow = {
  conversation_id: string;
  sender_id: string;
  created_at: string;
};

function budgetLabel(value: string | null) {
  if (value === "low") return "₺";
  if (value === "medium") return "₺₺";
  if (value === "high") return "₺₺₺";
  if (value === "pro") return "Pro";
  return "";
}

function formatResponseFromMinutes(avgMinutes: number | null) {
  if (!avgMinutes || Number.isNaN(avgMinutes) || avgMinutes <= 0) return "24 saat içinde dönüş";
  if (avgMinutes < 60) return `${Math.max(1, Math.round(avgMinutes))} dk içinde dönüş`;
  if (avgMinutes < 60 * 24) return `${Math.max(1, Math.round(avgMinutes / 60))} saat içinde dönüş`;
  return `${Math.max(1, Math.round(avgMinutes / (60 * 24)))} gün içinde dönüş`;
}

async function loadSupabaseDesigners(): Promise<Designer[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, full_name, business_name, specialty, city, contact_email, tags, starting_from, about_details, business_details, cover_photo_url, avatar_url")
      .in("role", ["designer", "designer_pending"])
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (profilesError || !profiles) return [];
    const validProfiles = profiles as ProfileRow[];
    if (!validProfiles.length) return [];
    const slugById = buildUniqueDesignerSlugs(validProfiles, FEATURED_DESIGNERS.map((d) => d.slug));

    const ids = validProfiles.map((p) => p.id);
    const { data: projects, error: projectsError } = await admin
      .from("designer_projects")
      .select("designer_id, title, project_type, tags, budget_level, cover_image_url, created_at")
      .in("designer_id", ids)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    const projectRows = !projectsError && projects ? (projects as ProjectRow[]) : [];

    const { data: reviews } = await admin
      .from("designer_reviews")
      .select("designer_id, rating")
      .in("designer_id", ids);

    const reviewStats = new Map<string, { count: number; total: number }>();
    for (const row of ((reviews ?? []) as ReviewAggRow[])) {
      const prev = reviewStats.get(row.designer_id) ?? { count: 0, total: 0 };
      prev.count += 1;
      prev.total += Number(row.rating || 0);
      reviewStats.set(row.designer_id, prev);
    }

    const { data: conversations } = await admin
      .from("conversations")
      .select("id, homeowner_id, designer_id")
      .in("designer_id", ids);

    const avgResponseByDesigner = new Map<string, number>();
    if (conversations && conversations.length) {
      const convRows = conversations as ConversationRow[];
      const conversationIds = convRows.map((c) => c.id);
      const convById = new Map(convRows.map((c) => [c.id, c]));

      const { data: messages } = await admin
        .from("messages")
        .select("conversation_id, sender_id, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true });

      if (messages && messages.length) {
        const msgByConversation = new Map<string, MessageRow[]>();
        for (const msg of messages as MessageRow[]) {
          if (!msgByConversation.has(msg.conversation_id)) msgByConversation.set(msg.conversation_id, []);
          msgByConversation.get(msg.conversation_id)?.push(msg);
        }

        const sums = new Map<string, { totalMin: number; count: number }>();
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
                const prev = sums.get(conversation.designer_id) ?? { totalMin: 0, count: 0 };
                prev.totalMin += diffMin;
                prev.count += 1;
                sums.set(conversation.designer_id, prev);
              }
              pendingHomeownerAt = null;
            }
          }
        }

        for (const [designerId, { totalMin, count }] of sums.entries()) {
          avgResponseByDesigner.set(designerId, count > 0 ? totalMin / count : 0);
        }
      }
    }

    const grouped = new Map<string, ProjectRow[]>();
    for (const row of projectRows) {
      if (!grouped.has(row.designer_id)) grouped.set(row.designer_id, []);
      grouped.get(row.designer_id)?.push(row);
    }

    const dynamicDesigners: Designer[] = [];
    for (const profile of validProfiles) {
      const list = grouped.get(profile.id) ?? [];
      const latest = list[0] ?? null;
      const aboutDetails = (profile.about_details ?? {}) as Record<string, unknown>;
      const profileProjectTypes = Array.isArray(aboutDetails.projectTypes)
        ? (aboutDetails.projectTypes as string[]).map((x) => x.trim()).filter(Boolean)
        : [];
      const uniqTypes = Array.from(
        new Set([...list.map((x) => x.project_type).filter(Boolean), ...profileProjectTypes])
      ).slice(0, 3) as string[];
      const profileServices = Array.isArray(aboutDetails.services)
        ? (aboutDetails.services as string[]).map((x) => x.trim()).filter(Boolean)
        : [];
      const projectTags = list.flatMap((x) => x.tags ?? []);
      const profileTags = profile.tags ?? [];
      const uniqTags = Array.from(new Set([...profileTags, ...projectTags])).slice(0, 4);
      const stats = reviewStats.get(profile.id);
      const rating = stats?.count ? Number((stats.total / stats.count).toFixed(1)) : 0;
      const reviewCount = stats?.count ?? 0;

      const displayName = profile.full_name?.trim() || profile.business_name?.trim() || "Profesyonel";
      dynamicDesigners.push({
        slug: slugById.get(profile.id) || `mimar${dynamicDesigners.length + 1}`,
        liveDesignerId: profile.id,
        name: displayName,
        title: profile.specialty?.trim() || "İç Mimar",
        city: profile.city?.trim() || "Türkiye",
        rating,
        reviews: reviewCount,
        verified: true,
        pinnedReview: (aboutDetails.bio as string | undefined) || "Evlumba profesyoneli",
        pinnedBy: profile.full_name?.trim() || "Evlumba",
        tags: uniqTags.length ? uniqTags : ["Yeni Profesyonel"],
        coverUrl: (profile.cover_photo_url ?? "").trim(),
        response: formatResponseFromMinutes(avgResponseByDesigner.get(profile.id) ?? null),
        startingFrom: profile.starting_from || budgetLabel(latest?.budget_level ?? null),
        portfolioCount: list.length,
        projectTypes: uniqTypes,
        services: profileServices.length ? profileServices : profile.specialty ? [profile.specialty] : [],
        avatarUrl: profile.avatar_url || undefined,
        about: {
          headline: (aboutDetails.headline as string | undefined) || undefined,
          bio: (aboutDetails.bio as string | undefined) || undefined,
          specialties: (aboutDetails.specialties as string[] | undefined) || undefined,
          serviceAreas: (aboutDetails.serviceAreas as string[] | undefined) || undefined,
          languages: (aboutDetails.languages as string[] | undefined) || undefined,
          teamSize: (aboutDetails.teamSize as string | undefined) || undefined,
          availability: (aboutDetails.availability as string | undefined) || undefined,
        },
      });
    }

    return dynamicDesigners;
  } catch {
    return [];
  }
}

export default async function DesignersPage({
  searchParams,
}: {
  searchParams?: Promise<SP>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const supabaseDesigners = await loadSupabaseDesigners();
  const designers = [...supabaseDesigners, ...FEATURED_DESIGNERS];

  return (
    <main className="min-h-screen pt-28 md:pt-32">
      <ProMatchBannerInline />

      <section className="px-4">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mt-6">
            <div className="rounded-3xl p-5 md:p-6" style={glass}>
              <div className="text-base font-semibold text-[#0f172a]">Hızlı Arama</div>
              <div className="mt-1 text-sm text-[rgba(15,23,42,0.58)]">
                Serbest arama: isim, şehir, stil, oda, proje tipi, bütçe.
              </div>

              <form action="/tasarimcilar#liste" method="get" className="mt-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div
                    className="relative flex flex-1 items-center"
                    style={{
                      background: "rgba(255,255,255,0.78)",
                      boxShadow: "0 0 0 1px rgba(15,23,42,0.08)",
                      backdropFilter: "blur(14px)",
                      borderRadius: 16,
                    }}
                  >
                    <Search className="absolute left-4 h-4 w-4 text-[rgba(15,23,42,0.45)]" />
                    <input
                      name="q"
                      defaultValue={pick(sp, "q")}
                      className="w-full bg-transparent py-3 pl-11 pr-4 text-sm text-[rgba(15,23,42,0.82)] placeholder:text-[rgba(15,23,42,0.40)] outline-none"
                      placeholder='Örn: “istanbul iç mimar”, “minimal mutfak 30m2”, “bütçe 200k hızlı dönüş”'
                      autoComplete="off"
                    />
                  </div>

                  <button
                    type="submit"
                    className="group relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition hover:-translate-y-px active:translate-y-0 active:scale-[0.99]"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(99,102,241,0.12) 55%, rgba(255,255,255,0.80) 100%)",
                      boxShadow: "0 0 0 1px rgba(15,23,42,0.10), 0 16px 44px rgba(15,23,42,0.10)",
                      color: "rgba(15,23,42,0.86)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    Ara <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section id="liste" className="px-4 pb-16">
        <div className="mx-auto w-full max-w-6xl">
          <DesignersResultsClient designers={designers} />
        </div>
      </section>
    </main>
  );
}
