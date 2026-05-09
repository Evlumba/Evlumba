export type SemanticSearchMode = "projects" | "designers";

export type SemanticSearchResult = {
  projectIds: string[];
  designerIds: string[];
};

type SemanticSearchInput = {
  query: string;
  mode: SemanticSearchMode;
  limit?: number;
  projectType?: string;
  budgetLevel?: string;
  city?: string;
  signal?: AbortSignal;
};

const EMPTY_RESULT: SemanticSearchResult = {
  projectIds: [],
  designerIds: [],
};

function clean(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function publicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export async function semanticSearch({
  query,
  mode,
  limit,
  projectType,
  budgetLevel,
  city,
  signal,
}: SemanticSearchInput): Promise<SemanticSearchResult> {
  const trimmed = clean(query);
  const env = publicSupabaseEnv();
  if (!env || trimmed.length < 2) return EMPTY_RESULT;

  const response = await fetch(`${env.url}/functions/v1/semantic-search`, {
    method: "POST",
    signal,
    headers: {
      apikey: env.anonKey,
      authorization: `Bearer ${env.anonKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: trimmed,
      mode,
      limit: limit ?? (mode === "designers" ? 80 : 24),
      ...(clean(projectType) ? { projectType: clean(projectType) } : {}),
      ...(clean(budgetLevel) ? { budgetLevel: clean(budgetLevel) } : {}),
      ...(clean(city) ? { city: clean(city) } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Semantic search failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    ok?: boolean;
    projectIds?: unknown;
    designerIds?: unknown;
    message?: string;
  };

  if (data.ok !== true) {
    throw new Error(data.message || "Semantic search failed.");
  }

  return {
    projectIds: Array.isArray(data.projectIds)
      ? data.projectIds.filter((item): item is string => typeof item === "string")
      : [],
    designerIds: Array.isArray(data.designerIds)
      ? data.designerIds.filter((item): item is string => typeof item === "string")
      : [],
  };
}
