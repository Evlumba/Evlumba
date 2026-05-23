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
  TURKIYE_ILLERI,
  WORKING_MODEL_OPTIONS,
  normalizeProfileText,
  professionalTitle,
  profileGeneralArray,
  profileGeneralString,
  uniqueAllowedValues,
} from "@/app/tasarimcilar/_data/profileGeneralMapping";
import { semanticSearch } from "@/lib/semanticSearch";
import { queryTokens } from "@/lib/searchIntent";
import { SITE_URL, toAbsoluteUrl, trimForDescription } from "@/lib/seo";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const PROFILE_SELECT =
  "id, full_name, business_name, slug, specialty, city, avatar_url, cover_photo_url, tags, starting_from, about_details, business_details";
const PROJECT_SELECT =
  "id, designer_id, title, project_type, location, description, tags, budget_level, cover_image_url, created_at, designer_project_images(image_url, sort_order)";
const PROFILE_SEARCH_COLUMNS = ["full_name", "business_name", "specialty", "city", "starting_from"];
const PROJECT_SEARCH_COLUMNS = ["title", "project_type", "location", "description", "budget_level"];
const PAGE_SIZE = 1000;
const ID_CHUNK = 450;

type SearchClient = ReturnType<typeof getSupabaseAdminClient>;

type ProfileRow = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  slug: string | null;
  specialty: string | null;
  city: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  tags: string[] | null;
  starting_from: string | null;
  about_details: Record<string, unknown> | null;
  business_details: Record<string, unknown> | null;
};

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
  created_at: string | null;
  designer_project_images?: Array<{ image_url: string | null; sort_order: number | null }>;
};

type ReviewRow = { designer_id: string; rating: number | null };

export type EvlumbaDesignerResult = {
  id: string;
  slug: string;
  name: string;
  title: string;
  city: string;
  cities: string[];
  district?: string;
  url: string;
  imageUrl?: string;
  coverUrl?: string;
  rating: number;
  reviewCount: number;
  projectCount: number;
  professionalTypes: string[];
  services: string[];
  projectTypes: string[];
  serviceAreas: string[];
  styleExpertise: string[];
  serviceRegions: string[];
  startingBudget?: string;
  workingModels: string[];
  tags: string[];
  about?: string;
};

export type EvlumbaProjectResult = {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  projectType?: string;
  room?: string;
  style?: string;
  city?: string;
  budget?: string;
  description?: string;
  tags: string[];
  designer: { id: string; name: string; slug: string; url: string; city?: string };
  createdAt?: string;
};

export type SearchDesignersInput = {
  query?: string;
  cities?: string[];
  professionalTypes?: string[];
  services?: string[];
  projectTypes?: string[];
  serviceAreas?: string[];
  styleExpertise?: string[];
  serviceRegions?: string[];
  startingBudget?: string;
  onlyWithProjects?: boolean;
  sort?: "relevance" | "name" | "project_count" | "rating" | "budget";
  limit?: number;
};

export type SearchProjectsInput = {
  query?: string;
  cities?: string[];
  rooms?: string[];
  styles?: string[];
  projectTypes?: string[];
  budget?: string;
  sort?: "relevance" | "date" | "budget";
  limit?: number;
};

export type DesignerDetailResult = EvlumbaDesignerResult & { projects: EvlumbaProjectResult[] };
export type ProjectDetailResult = EvlumbaProjectResult & { images: string[] };

function db() {
  return getSupabaseAdminClient();
}

function clean(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function limit(value: unknown, fallback: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 1), max) : fallback;
}

function unique(values: unknown[]) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map(clean)
        .filter(Boolean)
    )
  );
}

function chunks<T>(items: T[], size = ID_CHUNK) {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

function flatten(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap(flatten);
  return [];
}

function searchFilter(value: string, columns: string[]) {
  const tokens = queryTokens(value).slice(0, 5);
  if (!tokens.length) return "";
  return tokens.flatMap((token) => columns.map((column) => `${column}.ilike.*${token}*`)).join(",");
}

function optionMatches(query: string, options: string[]) {
  const normalized = normalizeProfileText(query);
  if (!normalized) return [];
  return options.filter((option) => normalized.includes(normalizeProfileText(option)));
}

function inferCities(query: string, provided?: string[]) {
  const direct = uniqueAllowedValues(provided ?? [], TURKIYE_ILLERI);
  return direct.length ? direct : optionMatches(query, TURKIYE_ILLERI);
}

function stripOptionsFromQuery(query: string, options: string[]) {
  let next = ` ${query} `;
  for (const option of options) {
    const escaped = option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`\\s+${escaped}\\s+`, "giu"), " ");
  }
  const cleaned = next.replace(/\s+/g, " ").trim();
  return cleaned.length >= 2 ? cleaned : query;
}

function infer(query: string, provided: unknown, options: string[], aliases: Record<string, string | string[]> = {}) {
  const direct = uniqueAllowedValues(provided, options, aliases);
  if (direct.length) return direct;
  return unique([uniqueAllowedValues(query, options, aliases), optionMatches(query, options)]).filter((item) =>
    options.includes(item)
  );
}

function general(profile: ProfileRow) {
  const details = (profile.about_details ?? {}) as Record<string, unknown>;
  return (details.profileGeneral ?? {}) as Record<string, unknown>;
}

function slug(profile: ProfileRow) {
  return profile.slug?.trim() || `supa_${profile.id}`;
}

function cities(profile: ProfileRow) {
  const g = general(profile);
  const cityArray = Array.isArray(g.cities) ? (g.cities as unknown[]).map(clean).filter(Boolean) : [];
  const primary = profileGeneralString(g, "city", TURKIYE_ILLERI) || clean(profile.city);
  return unique([cityArray, primary]).filter((item) => item !== "Türkiye");
}

function budgetRank(value?: string) {
  const index = STARTING_BUDGET_OPTIONS.indexOf(value ?? "");
  return index === -1 ? 999 : index;
}

function projectBudgetRank(value?: string) {
  if (value === "low" || value === "Uygun") return 0;
  if (value === "medium" || value === "Orta") return 1;
  if (value === "high" || value === "Premium") return 2;
  if (value === "pro" || value === "Lüks") return 3;
  return 999;
}

function projectBudget(value: string | null | undefined) {
  if (value === "low") return "Uygun";
  if (value === "medium") return "Orta";
  if (value === "high") return "Premium";
  if (value === "pro") return "Lüks";
  return clean(value);
}

function detect(options: string[], values: unknown[]) {
  const bag = normalizeProfileText(values.flatMap(flatten).join(" "));
  return options.find((option) => bag.includes(normalizeProfileText(option)));
}

async function semanticIds(query: string, mode: "projects" | "designers", count: number) {
  if (query.length < 2) return { projectIds: [] as string[], designerIds: [] as string[] };
  try {
    return await semanticSearch({ query, mode, limit: count });
  } catch {
    return { projectIds: [], designerIds: [] };
  }
}

async function profilesByIds(client: SearchClient, ids: string[]) {
  const rows: ProfileRow[] = [];
  for (const chunk of chunks(ids)) {
    const { data } = await client.from("profiles").select(PROFILE_SELECT).in("id", chunk);
    rows.push(...((data ?? []) as ProfileRow[]));
  }
  return rows;
}

async function profiles(client: SearchClient, filter = "") {
  const rows: ProfileRow[] = [];
  let from = 0;
  while (true) {
    let query = client
      .from("profiles")
      .select(PROFILE_SELECT)
      .in("role", ["designer", "designer_pending"])
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (filter) query = query.or(filter);
    const { data, error } = await query;
    if (error) break;
    const page = (data ?? []) as ProfileRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

async function projectsForDesigners(client: SearchClient, ids: string[]) {
  const rows: ProjectRow[] = [];
  for (const chunk of chunks(ids)) {
    let from = 0;
    while (true) {
      const { data, error } = await client
        .from("designer_projects")
        .select(PROJECT_SELECT)
        .in("designer_id", chunk)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) break;
      const page = (data ?? []) as ProjectRow[];
      rows.push(...page);
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
  }
  return rows;
}

async function reviews(client: SearchClient, ids: string[]) {
  const rows: ReviewRow[] = [];
  for (const chunk of chunks(ids)) {
    const { data } = await client.from("designer_reviews").select("designer_id, rating").in("designer_id", chunk);
    rows.push(...((data ?? []) as ReviewRow[]));
  }
  return rows;
}

function reviewMap(rows: ReviewRow[]) {
  const result = new Map<string, { count: number; total: number }>();
  for (const row of rows) {
    if (!row.designer_id || typeof row.rating !== "number") continue;
    const cur = result.get(row.designer_id) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += row.rating;
    result.set(row.designer_id, cur);
  }
  return result;
}

function designerText(profile: ProfileRow, projects: ProjectRow[]) {
  return [
    profile.full_name,
    profile.business_name,
    profile.specialty,
    profile.city,
    profile.starting_from,
    ...flatten(profile.tags),
    ...flatten(general(profile)),
    ...flatten(profile.business_details),
    ...projects.flatMap((project) => [project.title, project.project_type, project.location, project.description, project.budget_level, project.tags]),
  ].join(" ");
}

function textMatch(value: string, query: string) {
  const tokens = queryTokens(query);
  if (!tokens.length) return true;
  const normalized = normalizeProfileText(value);
  return tokens.every((token) => normalized.includes(token));
}

function any(values: string[], selected: string[]) {
  if (!selected.length) return true;
  const normalized = values.map(normalizeProfileText);
  return selected.some((item) => normalized.includes(normalizeProfileText(item)));
}

function mapDesigner(profile: ProfileRow, projects: ProjectRow[], stats: Map<string, { count: number; total: number }>) {
  const g = general(profile);
  const details = (profile.about_details ?? {}) as Record<string, unknown>;
  const professionalTypes =
    profileGeneralArray(g, "professionalTypes", PROFESSIONAL_TYPE_OPTIONS).length ||
    uniqueAllowedValues(profile.specialty ?? "", PROFESSIONAL_TYPE_OPTIONS, PROFESSIONAL_TYPE_ALIASES).length
      ? profileGeneralArray(g, "professionalTypes", PROFESSIONAL_TYPE_OPTIONS).concat(
          uniqueAllowedValues(profile.specialty ?? "", PROFESSIONAL_TYPE_OPTIONS, PROFESSIONAL_TYPE_ALIASES)
        )
      : [];
  const services = profileGeneralArray(g, "services", SERVICE_OPTIONS).concat(
    uniqueAllowedValues(details.services, SERVICE_OPTIONS, SERVICE_ALIASES)
  );
  const projectTypes = profileGeneralArray(g, "projectTypes", PROJECT_TYPE_OPTIONS).concat(
    uniqueAllowedValues(details.projectTypes, PROJECT_TYPE_OPTIONS, PROJECT_TYPE_ALIASES)
  );
  const cityList = cities(profile);
  const stat = stats.get(profile.id);
  const designerSlug = slug(profile);

  return {
    id: profile.id,
    slug: designerSlug,
    name: profileGeneralString(g, "displayName") || clean(profile.full_name) || clean(profile.business_name) || "Evlumba Profesyoneli",
    title: professionalTitle(unique(professionalTypes).filter((item) => PROFESSIONAL_TYPE_OPTIONS.includes(item))),
    city: cityList[0] || "Türkiye",
    cities: cityList,
    district: profileGeneralString(g, "district") || undefined,
    url: toAbsoluteUrl(`/tasarimcilar/${designerSlug}`),
    imageUrl: clean(profile.avatar_url) || undefined,
    coverUrl: clean(profile.cover_photo_url) || clean(projects[0]?.cover_image_url) || undefined,
    rating: stat?.count ? Number((stat.total / stat.count).toFixed(1)) : 0,
    reviewCount: stat?.count ?? 0,
    projectCount: projects.length,
    professionalTypes: unique(professionalTypes).filter((item) => PROFESSIONAL_TYPE_OPTIONS.includes(item)),
    services: unique(services).filter((item) => SERVICE_OPTIONS.includes(item)),
    projectTypes: unique(projectTypes).filter((item) => PROJECT_TYPE_OPTIONS.includes(item)),
    serviceAreas: profileGeneralArray(g, "serviceAreas", SERVICE_AREA_OPTIONS),
    styleExpertise: profileGeneralArray(g, "styleExpertise", STYLE_OPTIONS),
    serviceRegions: profileGeneralArray(g, "serviceRegions", SERVICE_REGION_OPTIONS),
    startingBudget: profileGeneralString(g, "startingBudget", STARTING_BUDGET_OPTIONS) || clean(profile.starting_from) || undefined,
    workingModels: profileGeneralArray(g, "workingModels", WORKING_MODEL_OPTIONS),
    tags: profileGeneralArray(g, "tags", TAG_OPTIONS).concat(uniqueAllowedValues(profile.tags, TAG_OPTIONS)).slice(0, 10),
    about: trimForDescription(clean(details.bio) || clean(details.headline) || clean(profile.business_name), 220) || undefined,
  } satisfies EvlumbaDesignerResult;
}

function mapProject(project: ProjectRow, profile?: ProfileRow) {
  const designerSlug = profile ? slug(profile) : `supa_${project.designer_id}`;
  const images = [...(project.designer_project_images ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((item) => clean(item.image_url))
    .filter(Boolean);
  return {
    id: project.id,
    title: clean(project.title) || "Evlumba Projesi",
    url: toAbsoluteUrl(`/tasarimcilar/${designerSlug}/proje/${project.id}`),
    imageUrl: images[0] || clean(project.cover_image_url) || undefined,
    projectType: clean(project.project_type) || undefined,
    room: detect(SERVICE_AREA_OPTIONS, [project.tags, project.project_type, project.title]),
    style: detect(STYLE_OPTIONS, [project.tags, project.project_type, project.description]),
    city: clean(project.location) || clean(profile?.city) || undefined,
    budget: projectBudget(project.budget_level) || undefined,
    description: trimForDescription(clean(project.description), 220) || undefined,
    tags: unique(project.tags ?? []).slice(0, 8),
    designer: {
      id: project.designer_id,
      name: clean(profile?.full_name) || clean(profile?.business_name) || "Evlumba Profesyoneli",
      slug: designerSlug,
      url: toAbsoluteUrl(`/tasarimcilar/${designerSlug}`),
      city: clean(profile?.city) || undefined,
    },
    createdAt: clean(project.created_at) || undefined,
  } satisfies EvlumbaProjectResult;
}

function directDesignerScore(designer: EvlumbaDesignerResult, query: string) {
  const normalizedQuery = normalizeProfileText(query);
  if (!normalizedQuery) return 0;
  const name = normalizeProfileText(designer.name);
  const slugValue = normalizeProfileText(designer.slug);
  const searchable = normalizeProfileText(
    [
      designer.name,
      designer.slug,
      designer.title,
      designer.city,
      designer.cities,
      designer.professionalTypes,
      designer.services,
      designer.projectTypes,
      designer.serviceAreas,
      designer.styleExpertise,
      designer.tags,
    ].join(" ")
  );
  if (name === normalizedQuery || slugValue === normalizedQuery) return -300;
  if (name.includes(normalizedQuery) || slugValue.includes(normalizedQuery)) return -250;
  if (searchable.includes(normalizedQuery)) return -100;
  return 0;
}

function sortDesigners(items: EvlumbaDesignerResult[], sort: SearchDesignersInput["sort"], order: Map<string, number>, query: string) {
  const list = [...items];
  if (sort === "name") return list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  if (sort === "project_count") return list.sort((a, b) => b.projectCount - a.projectCount);
  if (sort === "rating") return list.sort((a, b) => b.rating - a.rating);
  if (sort === "budget") return list.sort((a, b) => budgetRank(a.startingBudget) - budgetRank(b.startingBudget));
  return list.sort(
    (a, b) =>
      directDesignerScore(a, query) - directDesignerScore(b, query) ||
      (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999) ||
      b.projectCount - a.projectCount ||
      b.rating - a.rating
  );
}

function directProjectScore(project: EvlumbaProjectResult, query: string) {
  const normalizedQuery = normalizeProfileText(query);
  if (!normalizedQuery) return 0;
  const title = normalizeProfileText(project.title);
  const searchable = normalizeProfileText(
    [project.title, project.projectType, project.room, project.style, project.city, project.designer.name, project.tags].join(" ")
  );
  if (title === normalizedQuery) return -250;
  if (title.includes(normalizedQuery)) return -180;
  if (searchable.includes(normalizedQuery)) return -80;
  return 0;
}

function sortProjects(items: EvlumbaProjectResult[], sort: SearchProjectsInput["sort"], order: Map<string, number>, query: string) {
  const list = [...items];
  if (sort === "budget") return list.sort((a, b) => projectBudgetRank(a.budget) - projectBudgetRank(b.budget));
  if (sort === "date") return list.sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""));
  return list.sort(
    (a, b) =>
      directProjectScore(a, query) - directProjectScore(b, query) ||
      (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999) ||
      Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "")
  );
}

export async function searchEvlumbaDesigners(input: SearchDesignersInput) {
  const client = db();
  const q = clean(input.query);
  const take = limit(input.limit, 8, 20);
  const cityFilters = inferCities(q, input.cities);
  const searchQuery = stripOptionsFromQuery(q, cityFilters);
  const professionalFilters = infer(searchQuery, input.professionalTypes, PROFESSIONAL_TYPE_OPTIONS, PROFESSIONAL_TYPE_ALIASES);
  const serviceFilters = infer(searchQuery, input.services, SERVICE_OPTIONS, SERVICE_ALIASES);
  const projectTypeFilters = infer(searchQuery, input.projectTypes, PROJECT_TYPE_OPTIONS, PROJECT_TYPE_ALIASES);
  const areaFilters = infer(searchQuery, input.serviceAreas, SERVICE_AREA_OPTIONS);
  const styleFilters = infer(searchQuery, input.styleExpertise, STYLE_OPTIONS);
  const regionFilters = uniqueAllowedValues(input.serviceRegions ?? [], SERVICE_REGION_OPTIONS);
  const startingBudget = uniqueAllowedValues(input.startingBudget ?? "", STARTING_BUDGET_OPTIONS)[0] ?? "";
  const semantic = await semanticIds(searchQuery, "designers", Math.max(take * 2, 20));
  const order = new Map(semantic.designerIds.map((id, index) => [id, index]));
  const [bySemantic, byText] = await Promise.all([
    semantic.designerIds.length ? profilesByIds(client, semantic.designerIds) : Promise.resolve([]),
    profiles(client, searchFilter(searchQuery, PROFILE_SEARCH_COLUMNS)),
  ]);
  const profileMap = new Map([...bySemantic, ...byText].map((profile) => [profile.id, profile]));
  const projectRows = await projectsForDesigners(client, [...profileMap.keys()]);
  const grouped = new Map<string, ProjectRow[]>();
  projectRows.forEach((project) => grouped.set(project.designer_id, [...(grouped.get(project.designer_id) ?? []), project]));
  const stats = reviewMap(await reviews(client, [...profileMap.keys()]));
  const designers = [...profileMap.values()]
    .filter((profile) => !searchQuery || order.has(profile.id) || textMatch(designerText(profile, grouped.get(profile.id) ?? []), searchQuery))
    .map((profile) => mapDesigner(profile, grouped.get(profile.id) ?? [], stats))
    .filter((designer) => any(designer.cities.length ? designer.cities : [designer.city], cityFilters))
    .filter((designer) => any(designer.professionalTypes, professionalFilters))
    .filter((designer) => any(designer.services, serviceFilters))
    .filter((designer) => any(designer.projectTypes, projectTypeFilters))
    .filter((designer) => any(designer.serviceAreas, areaFilters))
    .filter((designer) => any(designer.styleExpertise, styleFilters))
    .filter((designer) => any(designer.serviceRegions, regionFilters))
    .filter((designer) => (!startingBudget ? true : designer.startingBudget === startingBudget))
    .filter((designer) => (!input.onlyWithProjects ? true : designer.projectCount > 0));

  return {
    query: q,
    count: designers.length,
    designers: sortDesigners(designers, input.sort, order, searchQuery).slice(0, take),
    appliedFilters: unique([
      cityFilters.map((item) => `Şehir: ${item}`),
      professionalFilters.map((item) => `Profesyonel: ${item}`),
      serviceFilters.map((item) => `Hizmet: ${item}`),
      projectTypeFilters.map((item) => `Proje tipi: ${item}`),
      areaFilters.map((item) => `Alan: ${item}`),
      styleFilters.map((item) => `Stil: ${item}`),
      regionFilters.map((item) => `Bölge: ${item}`),
      startingBudget ? `Bütçe: ${startingBudget}` : "",
      input.onlyWithProjects ? "Sadece projeleri olanlar" : "",
    ]),
  };
}

async function projectsByIds(client: SearchClient, ids: string[]) {
  const rows: ProjectRow[] = [];
  for (const chunk of chunks(ids)) {
    const { data } = await client.from("designer_projects").select(PROJECT_SELECT).in("id", chunk).eq("is_published", true);
    rows.push(...((data ?? []) as ProjectRow[]));
  }
  return rows;
}

async function projects(client: SearchClient, filter = "") {
  let query = client
    .from("designer_projects")
    .select(PROJECT_SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(300);
  if (filter) query = query.or(filter);
  const { data } = await query;
  return (data ?? []) as ProjectRow[];
}

export async function searchEvlumbaProjects(input: SearchProjectsInput) {
  const client = db();
  const q = clean(input.query);
  const take = limit(input.limit, 8, 24);
  const cityFilters = inferCities(q, input.cities);
  const searchQuery = stripOptionsFromQuery(q, cityFilters);
  const roomFilters = infer(searchQuery, input.rooms, SERVICE_AREA_OPTIONS);
  const styleFilters = infer(searchQuery, input.styles, STYLE_OPTIONS);
  const typeFilters = infer(searchQuery, input.projectTypes, PROJECT_TYPE_OPTIONS, PROJECT_TYPE_ALIASES);
  const budget = clean(input.budget);
  const semantic = await semanticIds(searchQuery, "projects", Math.max(take * 3, 30));
  const order = new Map(semantic.projectIds.map((id, index) => [id, index]));
  const [bySemantic, byText] = await Promise.all([
    semantic.projectIds.length ? projectsByIds(client, semantic.projectIds) : Promise.resolve([]),
    projects(client, searchFilter(searchQuery, PROJECT_SEARCH_COLUMNS)),
  ]);
  const projectMap = new Map([...bySemantic, ...byText].map((project) => [project.id, project]));
  const profileMap = new Map((await profilesByIds(client, unique([...projectMap.values()].map((project) => project.designer_id)))).map((profile) => [profile.id, profile]));
  const mapped = [...projectMap.values()]
    .map((project) => mapProject(project, profileMap.get(project.designer_id)))
    .filter((project) => !searchQuery || order.has(project.id) || textMatch([project.title, project.projectType, project.city, project.description, project.tags].join(" "), searchQuery))
    .filter((project) => any(project.city ? [project.city] : [], cityFilters))
    .filter((project) => any(project.room ? [project.room] : [], roomFilters))
    .filter((project) => any(project.style ? [project.style] : [], styleFilters))
    .filter((project) => any(project.projectType ? [project.projectType] : [], typeFilters))
    .filter((project) => (!budget ? true : project.budget === budget || projectBudgetRank(project.budget) === projectBudgetRank(budget)));

  return {
    query: q,
    count: mapped.length,
    projects: sortProjects(mapped, input.sort, order, searchQuery).slice(0, take),
    appliedFilters: unique([
      cityFilters.map((item) => `Şehir: ${item}`),
      roomFilters.map((item) => `Alan: ${item}`),
      styleFilters.map((item) => `Stil: ${item}`),
      typeFilters.map((item) => `Proje tipi: ${item}`),
      budget ? `Bütçe: ${budget}` : "",
    ]),
  };
}

export async function getEvlumbaDesignerProfile(slugOrId: string): Promise<DesignerDetailResult | null> {
  const client = db();
  const value = clean(slugOrId).replace(/^https?:\/\/[^/]+\/tasarimcilar\//, "").split(/[/?#]/)[0] ?? "";
  if (!value) return null;
  const id = value.startsWith("supa_") ? value.slice(5) : value;
  let query = client.from("profiles").select(PROFILE_SELECT).in("role", ["designer", "designer_pending"]).limit(1);
  query = id.length >= 30 ? query.eq("id", id) : query.eq("slug", value);
  const profile = (((await query).data ?? []) as ProfileRow[])[0];
  if (!profile) return null;
  const projectRows = await projectsForDesigners(client, [profile.id]);
  const stats = reviewMap(await reviews(client, [profile.id]));
  return { ...mapDesigner(profile, projectRows, stats), projects: projectRows.slice(0, 12).map((project) => mapProject(project, profile)) };
}

export async function getEvlumbaProjectDetail(projectId: string): Promise<ProjectDetailResult | null> {
  const client = db();
  const id = clean(projectId).replace(/^live-/, "").split(/[/?#]/)[0] ?? "";
  const project = (await projectsByIds(client, [id]))[0];
  if (!project) return null;
  const profile = (await profilesByIds(client, [project.designer_id]))[0];
  const mapped = mapProject(project, profile);
  const images = unique([mapped.imageUrl, (project.designer_project_images ?? []).map((item) => item.image_url)]);
  return { ...mapped, images };
}

export function summarizeDesignerResults(designers: EvlumbaDesignerResult[]) {
  if (!designers.length) return "Uygun profesyonel bulunamadı.";
  return designers
    .slice(0, 6)
    .map((designer, index) => {
      const meta = [designer.title, designer.city, `${designer.projectCount} proje`, designer.rating ? `${designer.rating} puan` : ""]
        .filter(Boolean)
        .join(" • ");
      return `${index + 1}. ${designer.name} — ${meta}\n${designer.url}`;
    })
    .join("\n\n");
}

export function summarizeProjectResults(projects: EvlumbaProjectResult[]) {
  if (!projects.length) return "Uygun proje bulunamadı.";
  return projects
    .slice(0, 6)
    .map((project, index) => {
      const meta = [project.room, project.style, project.city, project.budget].filter(Boolean).join(" • ");
      return `${index + 1}. ${project.title} — ${meta}\n${project.url}`;
    })
    .join("\n\n");
}

export const evlumbaChatGptAppInfo = {
  name: "Evlumba",
  version: "0.1.5",
  siteUrl: SITE_URL,
};
