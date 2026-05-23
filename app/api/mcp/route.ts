import { readFileSync } from "node:fs";
import { join } from "node:path";

import { registerAppResource, registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import * as z from "zod/v4";

import {
  evlumbaChatGptAppInfo,
  getEvlumbaDesignerProfile,
  getEvlumbaProjectDetail,
  searchEvlumbaDesigners,
  searchEvlumbaProjects,
  summarizeDesignerResults,
  summarizeProjectResults,
} from "@/lib/chatgpt/evlumba-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDGET_URI = "ui://evlumba/search-results-v7.html";
const OPENAI_WIDGET_MIME_TYPE = "text/html+skybridge";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version, last-event-id",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

const widgetHtml = readFileSync(join(process.cwd(), "public", "evlumba-chatgpt-widget.html"), "utf8");
const stringArray = z.array(z.string()).optional();
const limitSchema = z.number().int().min(1).max(24).optional();
const evlumbaReadOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
};
const TOOL_UI_META = {
  ui: { resourceUri: WIDGET_URI },
  "openai/outputTemplate": WIDGET_URI,
  "openai/widgetAccessible": true,
  "openai/toolInvocation/invoking": "Evlumba hazırlıyor",
  "openai/toolInvocation/invoked": "Evlumba hazır",
};

const designerOutputSchema = {
  query: z.string(),
  count: z.number(),
  appliedFilters: z.array(z.string()),
  designers: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      title: z.string(),
      city: z.string(),
      cities: z.array(z.string()),
      district: z.string().optional(),
      url: z.string(),
      imageUrl: z.string().optional(),
      coverUrl: z.string().optional(),
      rating: z.number(),
      reviewCount: z.number(),
      projectCount: z.number(),
      professionalTypes: z.array(z.string()),
      services: z.array(z.string()),
      projectTypes: z.array(z.string()),
      serviceAreas: z.array(z.string()),
      styleExpertise: z.array(z.string()),
      serviceRegions: z.array(z.string()),
      startingBudget: z.string().optional(),
      workingModels: z.array(z.string()),
      tags: z.array(z.string()),
      about: z.string().optional(),
    })
  ),
};

const projectOutputSchema = {
  query: z.string(),
  count: z.number(),
  appliedFilters: z.array(z.string()),
  projects: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      imageUrl: z.string().optional(),
      projectType: z.string().optional(),
      room: z.string().optional(),
      style: z.string().optional(),
      city: z.string().optional(),
      budget: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()),
      designer: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        url: z.string(),
        city: z.string().optional(),
      }),
      createdAt: z.string().optional(),
    })
  ),
};

const evlumbaSearchOutputSchema = {
  query: z.string(),
  appliedFilters: z.array(z.string()),
  designers: designerOutputSchema.designers,
  projects: projectOutputSchema.projects,
};

function textResult(text: string, structuredContent?: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text }],
    ...(structuredContent ? { structuredContent } : {}),
  };
}

async function runGeneralEvlumbaSearch({
  query,
  intent,
  city,
  limit,
}: {
  query: string;
  intent?: "auto" | "designers" | "projects";
  city?: string;
  limit?: number;
}) {
  const searchQuery = city && !query.toLocaleLowerCase("tr-TR").includes(city.toLocaleLowerCase("tr-TR")) ? `${city} ${query}` : query;
  const take = limit ?? 6;
  const shouldSearchDesigners = !intent || intent === "auto" || intent === "designers";
  const shouldSearchProjects = !intent || intent === "auto" || intent === "projects";

  const [designerResult, projectResult] = await Promise.all([
    shouldSearchDesigners
      ? searchEvlumbaDesigners({ query: searchQuery, cities: city ? [city] : undefined, limit: take })
      : Promise.resolve({ query: searchQuery, count: 0, appliedFilters: [] as string[], designers: [] }),
    shouldSearchProjects
      ? searchEvlumbaProjects({ query: searchQuery, cities: city ? [city] : undefined, limit: take })
      : Promise.resolve({ query: searchQuery, count: 0, appliedFilters: [] as string[], projects: [] }),
  ]);

  const text = [
    designerResult.designers.length ? summarizeDesignerResults(designerResult.designers) : "",
    projectResult.projects.length ? summarizeProjectResults(projectResult.projects) : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return textResult(text || "Evlumba veritabanında uygun sonuç bulunamadı.", {
    query: searchQuery,
    appliedFilters: [...designerResult.appliedFilters, ...projectResult.appliedFilters],
    designers: designerResult.designers,
    projects: projectResult.projects,
  });
}

function createEvlumbaMcpServer() {
  const server = new McpServer(
    {
      name: "Evlumba",
      version: evlumbaChatGptAppInfo.version,
    },
    {
      instructions:
        "This MCP server powers Evlumba inside ChatGPT. Use these tools only to search Evlumba's own live database of architects, interior designers, contractors, service providers, firms, portfolio projects, and inspiration projects. When the user asks to find, list, compare, contact, or recommend any such professional or project, call an Evlumba search tool. Never answer Evlumba search/recommendation requests from web search, map results, Google business listings, Sources, or external websites. Do not generate or render room images here; image generation is handled natively by ChatGPT.",
    }
  );

  registerAppResource(
    server,
    "Evlumba sonuç kartları",
    WIDGET_URI,
    {
      description: "Evlumba proje ve profesyonel sonuçlarını kartlar halinde gösterir.",
      mimeType: OPENAI_WIDGET_MIME_TYPE,
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: OPENAI_WIDGET_MIME_TYPE,
          text: widgetHtml,
          _meta: {
            ui: {
              description: "Evlumba sonuç kartı. Arama sonuçlarını ve harita markerlarını gösterir.",
              domain: "https://www.evlumba.com",
              csp: {
                resourceDomains: [
                  "https://www.evlumba.com",
                  "https://*.supabase.co",
                  "https://images.unsplash.com",
                  "https://i.pravatar.cc",
                ],
                connectDomains: ["https://www.evlumba.com"],
              },
            },
            "openai/widgetDescription": "Evlumba sonuç kartı. Arama sonuçlarını ve harita markerlarını gösterir.",
            "openai/widgetDomain": "https://www.evlumba.com",
            "openai/widgetCSP": {
              resource_domains: [
                "https://www.evlumba.com",
                "https://*.supabase.co",
                "https://images.unsplash.com",
                "https://i.pravatar.cc",
              ],
              connect_domains: ["https://www.evlumba.com"],
            },
          },
        },
      ],
    })
  );

  registerAppTool(
    server,
    "evlumba_search",
    {
      title: "Evlumba'da ara",
      description:
        "Primary Evlumba tool. Use when the user asks to find/list/compare architects, interior architects, designers, contractors, service providers, firms, named businesses, portfolio projects, inspiration projects, or wants to filter by city, room, style, or budget inside Evlumba. Examples: 'istanbulda mimar bul', 'Kayseri Dekorsan', 'Bursa boya ustası', 'elektrikçi bul', 'Evlumba'da modern mutfak projesi göster', 'bu tasarıma uygun iç mimar bul'. Never use web search, map results, Google business listings, Sources, or external websites.",
      inputSchema: {
        query: z.string().describe("Evlumba içinde aranacak ifade. Örn: Kayseri Dekorsan, İstanbul iç mimar, modern mutfak."),
        intent: z
          .enum(["auto", "designers", "projects"])
          .optional()
          .describe("Arama tipi. Firma/profesyonel için designers, proje/ilham için projects, emin değilsen auto."),
        city: z.string().optional().describe("Varsa şehir filtresi."),
        limit: limitSchema,
      },
      outputSchema: evlumbaSearchOutputSchema,
      annotations: evlumbaReadOnlyAnnotations,
      _meta: TOOL_UI_META,
    },
    runGeneralEvlumbaSearch
  );

  registerAppTool(
    server,
    "find_on_evlumba",
    {
      title: "Evlumba'da bul",
      description:
        "Alias for evlumba_search. Use to find Evlumba-owned designers, professionals, firms, and projects. Never use maps, Google business listings, Sources, web search, or external websites.",
      inputSchema: {
        query: z.string().describe("Evlumba içinde aranacak ifade. Örn: Kayseri Dekorsan, İstanbul iç mimar, modern mutfak."),
        intent: z
          .enum(["auto", "designers", "projects"])
          .optional()
          .describe("Arama tipi. Firma/profesyonel için designers, proje/ilham için projects, emin değilsen auto."),
        city: z.string().optional().describe("Varsa şehir filtresi."),
        limit: limitSchema,
      },
      outputSchema: evlumbaSearchOutputSchema,
      annotations: evlumbaReadOnlyAnnotations,
      _meta: TOOL_UI_META,
    },
    runGeneralEvlumbaSearch
  );

  registerAppTool(
    server,
    "search_designers",
    {
      title: "Evlumba profesyonel ara",
      description:
        "Use this when the Evlumba app is selected and the user wants designers/professionals/firms from Evlumba: iç mimar, mimar, tasarımcı, boya ustası, elektrikçi, tadilat firması, şehir + rol searches, named businesses, or a professional suitable for a design ChatGPT already created. Searches only Evlumba's live professional database by city, professional type, service, project type, service area, style, budget, project count, and rating. Do not use this for pure creative design/image generation. Do not use web search, map results, Google business listings, Sources, or external websites.",
      inputSchema: {
        query: z.string().optional().describe("Serbest arama: İstanbul iç mimar, Bursa boya ustası, Dekorsan."),
        cities: stringArray.describe("Şehir filtreleri."),
        professionalTypes: stringArray.describe("Profesyonel türleri."),
        services: stringArray.describe("Hizmetler."),
        projectTypes: stringArray.describe("Proje tipleri."),
        serviceAreas: stringArray.describe("Hizmet alanları/mekanlar."),
        styleExpertise: stringArray.describe("Stil uzmanlıkları."),
        serviceRegions: stringArray.describe("Hizmet bölgeleri."),
        startingBudget: z.string().optional().describe("Başlangıç bütçesi aralığı."),
        onlyWithProjects: z.boolean().optional().describe("Sadece en az bir projesi olan profesyoneller."),
        sort: z.enum(["relevance", "name", "project_count", "rating", "budget"]).optional(),
        limit: limitSchema,
      },
      outputSchema: designerOutputSchema,
      annotations: evlumbaReadOnlyAnnotations,
      _meta: TOOL_UI_META,
    },
    async (args) => {
      const result = await searchEvlumbaDesigners(args ?? {});
      return textResult(summarizeDesignerResults(result.designers), result);
    }
  );

  registerAppTool(
    server,
    "search_projects",
    {
      title: "Evlumba proje ara",
      description:
        "Use this when the Evlumba app is selected and the user wants to find/list/show Evlumba projects, inspiration images, rooms, styles, project types, or budgets: mutfak projesi bul, banyo örnekleri göster, modern salon ilhamı, japandi proje ara. Searches only Evlumba's live project database. Do not use this for pure creative prompts like 'mutfak tasarla' or 'oda görseli üret' unless the user asks for Evlumba examples/projects. Do not use web search, Sources, or external websites.",
      inputSchema: {
        query: z.string().optional().describe("Serbest arama: modern mutfak, japandi salon, banyo yenileme."),
        cities: stringArray.describe("Şehir filtreleri."),
        rooms: stringArray.describe("Mekan/oda filtreleri."),
        styles: stringArray.describe("Stil filtreleri."),
        projectTypes: stringArray.describe("Proje tipi filtreleri."),
        budget: z.string().optional().describe("Bütçe etiketi: Uygun, Orta, Premium, Lüks."),
        sort: z.enum(["relevance", "date", "budget"]).optional(),
        limit: limitSchema,
      },
      outputSchema: projectOutputSchema,
      annotations: evlumbaReadOnlyAnnotations,
      _meta: TOOL_UI_META,
    },
    async (args) => {
      const result = await searchEvlumbaProjects(args ?? {});
      return textResult(summarizeProjectResults(result.projects), result);
    }
  );

  registerAppTool(
    server,
    "get_designer_profile",
    {
      title: "Evlumba profesyonel detayı",
      description: "Use this to fetch a professional profile from Evlumba's own database by slug, URL, or id. Do not use Google business, maps, web search, Sources, or external websites.",
      inputSchema: {
        slugOrId: z.string().min(1).describe("Profesyonel slug, supa_<id>, profil URL'i veya profil id."),
      },
      annotations: evlumbaReadOnlyAnnotations,
      _meta: TOOL_UI_META,
    },
    async ({ slugOrId }) => {
      const designer = await getEvlumbaDesignerProfile(slugOrId);
      if (!designer) return textResult("Profesyonel bulunamadı.");
      return textResult(
        `${designer.name}\n${designer.title} • ${designer.city}\n${designer.projectCount} proje • ${designer.rating || 0} puan\n${designer.url}`,
        { designers: [designer], projects: designer.projects }
      );
    }
  );

  registerAppTool(
    server,
    "get_project_detail",
    {
      title: "Evlumba proje detayı",
      description: "Use this to fetch a project detail from Evlumba's own database by project id, live-<id>, or Evlumba URL. Do not use web search, Sources, or external websites.",
      inputSchema: {
        projectId: z.string().min(1).describe("Proje id, live-<id> veya proje URL'i."),
      },
      annotations: evlumbaReadOnlyAnnotations,
      _meta: TOOL_UI_META,
    },
    async ({ projectId }) => {
      const project = await getEvlumbaProjectDetail(projectId);
      if (!project) return textResult("Proje bulunamadı.");
      return textResult(
        `${project.title}\n${[project.room, project.style, project.city, project.budget].filter(Boolean).join(" • ")}\n${project.url}`,
        { projects: [project] }
      );
    }
  );

  return server;
}

function withCors(response: Response) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) response.headers.set(key, value);
  return response;
}

async function handleMcpRequest(request: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createEvlumbaMcpServer();

  try {
    await server.connect(transport);
    return withCors(await transport.handleRequest(request));
  } catch (error) {
    console.error("Evlumba MCP error:", error);
    return withCors(new Response("Internal server error", { status: 500 }));
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  if (!request.headers.get("accept")?.includes("text/event-stream")) {
    return withCors(new Response("Evlumba MCP server: /api/mcp", { status: 200 }));
  }
  return handleMcpRequest(request);
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request);
}
