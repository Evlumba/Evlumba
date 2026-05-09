import type { Metadata } from "next";
import DesignersResultsClient from "./_components/DesignersResultsClient";
import DesignerQuickFilters from "./_components/DesignerQuickFilters";
import { FEATURED_DESIGNERS, type Designer } from "./_data/designers";
import { buildUniqueDesignerSlugs } from "./_data/slugs";
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
} from "./_data/profileGeneralMapping";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_OG_IMAGE, toAbsoluteUrl } from "@/lib/seo";
import { queryTokens } from "@/lib/searchIntent";

// export const dynamic = "force-dynamic"; // COST-FIX: removed
export const revalidate = 3600; // COST-FIX: 1 hour ISR cache

const title = "İç Mimar, Mimar ve Dekorasyon Uzmanı Bul";
const description =
  "Türkiye genelinde iç mimar, mimar ve dekorasyon uzmanı bul. Portföyleri, gerçek müşteri yorumlarını ve dönüş hızlarını karşılaştır, doğru profesyonelle eşleş.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "iç mimar bul",
    "mimar bul",
    "dekorasyon uzmanı",
    "iç mimar ara",
    "iç mimarlık hizmeti",
    "ev dekorasyonu uzmanı",
    "istanbul iç mimar",
    "ankara mimar",
    "izmir iç mimar",
    "türkiye iç mimarlık platformu",
  ],
  alternates: {
    canonical: "/tasarimcilar",
  },
  openGraph: {
    title,
    description,
    url: toAbsoluteUrl("/tasarimcilar"),
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_OG_IMAGE],
  },
};

type SP = Record<string, string | string[] | undefined>;
const pick = (sp: SP | undefined, key: string) => {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v || "";
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  slug: string | null;
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

const PROFILE_SELECT =
  "id, full_name, business_name, slug, specialty, city, contact_email, tags, starting_from, about_details, business_details, cover_photo_url, avatar_url";

const PROFILE_SEARCH_COLUMNS = ["full_name", "business_name", "specialty", "city", "starting_from"];
const SUPABASE_FETCH_PAGE_SIZE = 1000;
const RELATION_ID_CHUNK_SIZE = 450;

type DesignersReadClient =
  | ReturnType<typeof getSupabaseAdminClient>
  | Awaited<ReturnType<typeof getSupabaseServerClient>>;

async function getDesignersReadClient(): Promise<DesignersReadClient> {
  try {
    return getSupabaseAdminClient();
  } catch {
    return await getSupabaseServerClient();
  }
}

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

function flattenSearchValue(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item) => flattenSearchValue(item));
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((item) => flattenSearchValue(item));
  }
  return [];
}

function buildProfileSearchFilter(value: string) {
  const tokens = queryTokens(value).slice(0, 5);
  if (!tokens.length) return "";

  return tokens
    .flatMap((token) => PROFILE_SEARCH_COLUMNS.map((column) => `${column}.ilike.*${token}*`))
    .join(",");
}

function uniqueProfiles(rows: ProfileRow[]) {
  const seen = new Set<string>();
  const result: ProfileRow[] = [];

  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    result.push(row);
  }

  return result;
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function fetchDesignerProfiles(db: DesignersReadClient, searchFilter = "") {
  const rows: ProfileRow[] = [];
  let from = 0;

  while (true) {
    let query = db
      .from("profiles")
      .select(PROFILE_SELECT)
      .in("role", ["designer", "designer_pending"])
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + SUPABASE_FETCH_PAGE_SIZE - 1);

    if (searchFilter) query = query.or(searchFilter);

    const { data, error } = await query;
    if (error) return { data: rows, error };

    const page = (data ?? []) as ProfileRow[];
    rows.push(...page);
    if (page.length < SUPABASE_FETCH_PAGE_SIZE) break;
    from += SUPABASE_FETCH_PAGE_SIZE;
  }

  return { data: rows, error: null };
}

async function fetchPublishedProjects(db: DesignersReadClient, ids: string[]) {
  const rows: ProjectRow[] = [];

  for (const chunk of chunkArray(ids, RELATION_ID_CHUNK_SIZE)) {
    let from = 0;
    while (true) {
      const { data, error } = await db
        .from("designer_projects")
        .select("designer_id, title, project_type, tags, budget_level, cover_image_url, created_at")
        .in("designer_id", chunk)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .range(from, from + SUPABASE_FETCH_PAGE_SIZE - 1);

      if (error) break;

      const page = (data ?? []) as ProjectRow[];
      rows.push(...page);
      if (page.length < SUPABASE_FETCH_PAGE_SIZE) break;
      from += SUPABASE_FETCH_PAGE_SIZE;
    }
  }

  return rows;
}

async function fetchDesignerReviews(db: DesignersReadClient, ids: string[]) {
  const rows: ReviewAggRow[] = [];

  for (const chunk of chunkArray(ids, RELATION_ID_CHUNK_SIZE)) {
    let from = 0;
    while (true) {
      const { data, error } = await db
        .from("designer_reviews")
        .select("designer_id, rating")
        .in("designer_id", chunk)
        .range(from, from + SUPABASE_FETCH_PAGE_SIZE - 1);

      if (error) break;

      const page = (data ?? []) as ReviewAggRow[];
      rows.push(...page);
      if (page.length < SUPABASE_FETCH_PAGE_SIZE) break;
      from += SUPABASE_FETCH_PAGE_SIZE;
    }
  }

  return rows;
}

async function loadSupabaseDesigners(searchQuery = ""): Promise<Designer[]> {
  try {
    const db = await getDesignersReadClient();
    const searchFilter = buildProfileSearchFilter(searchQuery);

    const primaryProfilesResult = await fetchDesignerProfiles(db, searchFilter);
    const shouldFallbackToBase =
      Boolean(searchFilter) &&
      (!primaryProfilesResult.data?.length || Boolean(primaryProfilesResult.error));
    const fallbackProfilesResult = shouldFallbackToBase ? await fetchDesignerProfiles(db) : null;
    const profilesError = primaryProfilesResult.error && !fallbackProfilesResult?.data?.length;
    const profiles = uniqueProfiles([
      ...(primaryProfilesResult.data ?? []),
      ...(fallbackProfilesResult?.data ?? []),
    ]);

    if (profilesError || !profiles.length) return [];
    const validProfiles = profiles;
    if (!validProfiles.length) return [];
    const slugById = buildUniqueDesignerSlugs(validProfiles, FEATURED_DESIGNERS.map((d) => d.slug));

    const ids = validProfiles.map((p) => p.id);

    const [projectRows, reviews] = await Promise.all([
      fetchPublishedProjects(db, ids),
      fetchDesignerReviews(db, ids),
    ]);

    const reviewStats = new Map<string, { count: number; total: number }>();
    for (const row of ((reviews ?? []) as ReviewAggRow[])) {
      const prev = reviewStats.get(row.designer_id) ?? { count: 0, total: 0 };
      prev.count += 1;
      prev.total += Number(row.rating || 0);
      reviewStats.set(row.designer_id, prev);
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
      const profileGeneral = (aboutDetails.profileGeneral ?? {}) as Record<string, unknown>;
      const generalProjectTypes = profileGeneralArray(profileGeneral, "projectTypes", PROJECT_TYPE_OPTIONS);
      const uniqTypes = Array.from(new Set(generalProjectTypes)).slice(0, 6) as string[];
      const generalServices = profileGeneralArray(profileGeneral, "services", SERVICE_OPTIONS);
      const legacyServices = uniqueAllowedValues(aboutDetails.services, SERVICE_OPTIONS, SERVICE_ALIASES);
      const services = generalServices.length ? generalServices : legacyServices;
      const generalProfessionalTypes = profileGeneralArray(profileGeneral, "professionalTypes", PROFESSIONAL_TYPE_OPTIONS);
      const fallbackProfessionalTypes = uniqueAllowedValues(
        profile.specialty?.replace(/\s*-\s*/g, ",").replace(/\s*\/\s*/g, ",") ?? "",
        PROFESSIONAL_TYPE_OPTIONS,
        PROFESSIONAL_TYPE_ALIASES
      );
      const professionalTypes = generalProfessionalTypes.length ? generalProfessionalTypes : fallbackProfessionalTypes;
      const generalServiceAreas = profileGeneralArray(profileGeneral, "serviceAreas", SERVICE_AREA_OPTIONS);
      const generalStyleExpertise = profileGeneralArray(profileGeneral, "styleExpertise", STYLE_OPTIONS);
      const generalServiceRegions = profileGeneralArray(profileGeneral, "serviceRegions", SERVICE_REGION_OPTIONS);
      const generalTags = profileGeneralArray(profileGeneral, "tags", TAG_OPTIONS);
      const generalWorkingModels = profileGeneralArray(profileGeneral, "workingModels", WORKING_MODEL_OPTIONS);
      const legacyTags = uniqueAllowedValues(profile.tags, TAG_OPTIONS);
      const generalCities = Array.isArray(profileGeneral.cities)
        ? (profileGeneral.cities as string[]).map((x) => x.trim()).filter(Boolean)
        : [];
      const primaryCity = generalCities[0] || profileGeneralString(profileGeneral, "city") || "Türkiye";
      const uniqTags = Array.from(new Set(generalTags.length ? generalTags : legacyTags)).slice(0, 4);
      const stats = reviewStats.get(profile.id);
      const rating = stats?.count ? Number((stats.total / stats.count).toFixed(1)) : 0;
      const reviewCount = stats?.count ?? 0;

      const displayName = profileGeneralString(profileGeneral, "displayName") || profile.full_name?.trim() || profile.business_name?.trim() || "Profesyonel";
      const businessName = profileGeneralString(profileGeneral, "businessName") || profile.business_name?.trim() || "";
      const searchText = [
        profile.full_name,
        profile.business_name,
        profile.specialty,
        profile.city,
        profile.starting_from,
        displayName,
        businessName,
        ...flattenSearchValue(profile.tags),
        ...flattenSearchValue(profileGeneral),
        ...flattenSearchValue(profile.business_details),
        ...list.flatMap((project) => [project.title, project.project_type, ...(project.tags ?? [])]),
      ]
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
        .join(" ");
      dynamicDesigners.push({
        slug: profile.slug?.trim() || slugById.get(profile.id) || `mimar${dynamicDesigners.length + 1}`,
        liveDesignerId: profile.id,
        name: displayName,
        title: professionalTitle(professionalTypes),
        city: primaryCity,
        cities: generalCities.length ? generalCities : primaryCity !== "Türkiye" ? [primaryCity] : [],
        district: profileGeneralString(profileGeneral, "district") || undefined,
        rating,
        reviews: reviewCount,
        verified: true,
        pinnedReview: (aboutDetails.bio as string | undefined) || "Evlumba profesyoneli",
        pinnedBy: profile.full_name?.trim() || "Evlumba",
        tags: uniqTags.length ? uniqTags : ["Yeni Profesyonel"],
        coverUrl: (profile.cover_photo_url ?? "").trim() || (latest?.cover_image_url ?? "").trim(),
        response: formatResponseFromMinutes(null),
        startingFrom:
          profileGeneralString(profileGeneral, "startingBudget", STARTING_BUDGET_OPTIONS) ||
          budgetLabel(latest?.budget_level ?? null),
        startingBudget: profileGeneralString(profileGeneral, "startingBudget", STARTING_BUDGET_OPTIONS) || undefined,
        portfolioCount: list.length,
        projectTypes: uniqTypes.length
          ? uniqTypes
          : uniqueAllowedValues(aboutDetails.projectTypes, PROJECT_TYPE_OPTIONS, PROJECT_TYPE_ALIASES).slice(0, 6),
        services,
        professionalTypes,
        serviceAreas: generalServiceAreas,
        styleExpertise: generalStyleExpertise,
        serviceRegions: generalServiceRegions,
        workingModels: generalWorkingModels,
        searchText,
        avatarUrl: profile.avatar_url || undefined,
        business: businessName ? { name: businessName } : undefined,
        about: {
          headline: (aboutDetails.headline as string | undefined) || undefined,
          bio: (aboutDetails.bio as string | undefined) || undefined,
          languages: (aboutDetails.languages as string[] | undefined) || undefined,
        },
      });
    }

    dynamicDesigners.sort((a, b) => {
      if (b.verified !== a.verified) return Number(b.verified) - Number(a.verified);
      const portfolioA = a.portfolioCount ?? 0;
      const portfolioB = b.portfolioCount ?? 0;
      if (portfolioB !== portfolioA) return portfolioB - portfolioA;
      return b.reviews - a.reviews;
    });

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
  const supabaseDesigners = await loadSupabaseDesigners(pick(sp, "q"));
  const designers = [...supabaseDesigners, ...FEATURED_DESIGNERS];
  const quickFilterCities = Array.from(
    new Set(designers.flatMap((designer) => (designer.cities?.length ? designer.cities : [designer.city])).filter(Boolean))
  );

  const serviceSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    name: "İç Mimar ve Mimar Eşleşme Hizmeti",
    description:
      "Ev sahiplerini bütçe, tarz ve konum uyumuna göre en doğru iç mimar veya mimar ile buluşturan Evlumba ProMatch sistemi.",
    provider: {
      "@type": "Organization",
      name: "Evlumba",
      url: toAbsoluteUrl("/"),
    },
    areaServed: { "@type": "Country", name: "Türkiye" },
    serviceType: ["İç Mimarlık", "Mimarlık", "Ev Dekorasyonu", "İç Mekan Tasarımı"],
    audience: {
      "@type": "Audience",
      audienceType: "Ev Sahipleri, İç Mekan Tasarımı Arayanlar",
    },
    url: toAbsoluteUrl("/tasarimcilar"),
    offers: { "@type": "Offer", price: 0, priceCurrency: "TRY", description: "Ücretsiz eşleşme ve keşif" },
  }).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serviceSchema }} />
    <main className="min-h-screen">
      <DesignerQuickFilters cities={quickFilterCities} />

      <section id="liste" className="px-4 pb-16">
        <div className="mx-auto w-full max-w-6xl">
          <DesignersResultsClient designers={designers} />
        </div>
      </section>

      {/* SEO içerik bloğu — arama motorları ve LLM&apos;ler için */}
      <section className="px-4 pb-20">
        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-black/5 bg-white/50 backdrop-blur px-8 py-10">
          <h2 className="text-lg font-semibold text-slate-900">
            Türkiye&apos;nin İç Mimar ve Mimar Platformu
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Evlumba, ev sahiplerini <strong>iç mimar</strong>, <strong>mimar</strong> ve{" "}
            <strong>dekorasyon uzmanı</strong> ile buluşturan Türkiye merkezli bir platformdur.
            İstanbul, Ankara, İzmir, Bursa, Antalya ve Türkiye genelindeki yüzlerce onaylı
            profesyonelin portföyünü, müşteri yorumlarını ve hizmet paketlerini karşılaştırabilirsin.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">İç Mimar Nasıl Bulunur?</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                Bütçeni, konum tercihin ve tarz beklentini girerek ProMatch sistemi sana en uygun
                iç mimarları önerir. Portföyleri incele, yorumları oku, doğrudan mesaj at.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Mimar ile İç Mimar Farkı</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                Mimarlar yapısal tasarım ve ruhsat süreçlerini yönetir. İç mimarlar ise mekan
                düzenleme, renk, mobilya ve aksesuar seçimiyle yaşam alanını dönüştürür. Evlumba&apos;da
                her iki profesyoneli de bulabilirsin.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Dekorasyon Uzmanı Nedir?</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                Dekorasyon uzmanları resmi lisans gerektirmeyen; renk uyumu, mobilya yerleşimi ve
                estetik düzenleme konularında hizmet veren profesyonellerdir. Evlumba&apos;da portföylerine
                ve yorumlarına göre değerlendirebilirsin.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                Hangi Şehirlerde İç Mimar Bulabilirim?
              </h3>
              <p className="text-xs leading-6 text-slate-600">
                İstanbul iç mimar, Ankara mimar, İzmir dekorasyon uzmanı, Bursa iç mimar, Antalya
                mimar ve Türkiye genelindeki diğer şehirlerde hizmet veren profesyonellere
                Evlumba üzerinden ulaşabilirsin.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                Evlumba&apos;da Tasarımcı Seçerken Nelere Dikkat Edilmeli?
              </h3>
              <p className="text-xs leading-6 text-slate-600">
                Portföy kalitesi, müşteri yorumları, dönüş süresi ve bütçe uyumuna bakılmalıdır.
                Evlumba&apos;nın değerlendirme sistemi, gerçek müşteri deneyimlerini şeffaf biçimde
                gösterir.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
