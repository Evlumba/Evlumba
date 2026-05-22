import { readFileSync } from "node:fs";
import { join } from "node:path";

import { RESOURCE_MIME_TYPE, registerAppResource, registerAppTool } from "@modelcontextprotocol/ext-apps/server";
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

const WIDGET_URI = "ui://evlumba/search-results.html";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version, last-event-id",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

const widgetHtml = readFileSync(join(process.cwd(), "public", "evlumba-chatgpt-widget.html"), "utf8");
const stringArray = z.array(z.string()).optional();
const limitSchema = z.number().int().min(1).max(24).optional();

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

function textResult(text: string, structuredContent?: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text }],
    ...(structuredContent ? { structuredContent } : {}),
  };
}

function createEvlumbaMcpServer() {
  const server = new McpServer(
    {
      name: "evlumba-search",
      version: evlumbaChatGptAppInfo.version,
    },
    {
      instructions:
        "Bu MCP server yalnızca Evlumba'nın kendi canlı veritabanındaki proje ve profesyonel sonuçlarını döndürür. Kullanıcı Evlumba'da, Evlumba üzerinden, tasarımcı/profesyonel/proje bul, Dekorsan gibi bir isim bul, iç mimar ara, mutfak projesi ara dediğinde web search, harita, Google işletme veya başka siteler yerine bu server'daki tool'ları çağır. Sonuçlarda sadece Evlumba URL'lerini ve Evlumba tool çıktısını kullan.",
    }
  );

  registerAppResource(
    server,
    "Evlumba sonuç kartları",
    WIDGET_URI,
    { description: "Evlumba proje ve profesyonel arama sonuçlarını kartlar halinde gösterir." },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
          _meta: {
            ui: {
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
          },
        },
      ],
    })
  );

  registerAppTool(
    server,
    "find_on_evlumba",
    {
      title: "Evlumba'da bul",
      description:
        "Kullanıcı Evlumba'da bir firma, profesyonel, tasarımcı, iç mimar, mimar, usta veya proje bulmak istediğinde ilk kullanılacak genel Evlumba arama tool'u. Bu tool sadece Evlumba'nın kendi veritabanını kullanır; Google, harita, web search veya başka sitelerden sonuç getirmez.",
      inputSchema: {
        query: z.string().describe("Evlumba içinde aranacak ifade. Örn: Kayseri Dekorsan, İstanbul iç mimar, modern mutfak."),
        intent: z
          .enum(["auto", "designers", "projects"])
          .optional()
          .describe("Arama tipi. Firma/profesyonel için designers, proje/ilham için projects, emin değilsen auto."),
        city: z.string().optional().describe("Varsa şehir filtresi."),
        limit: limitSchema,
      },
      _meta: { ui: { resourceUri: WIDGET_URI } },
    },
    async ({ query, intent, city, limit }) => {
      const searchQuery = city && !query.toLocaleLowerCase("tr-TR").includes(city.toLocaleLowerCase("tr-TR"))
        ? `${city} ${query}`
        : query;
      const take = limit ?? 6;
      const shouldSearchDesigners = !intent || intent === "auto" || intent === "designers";
      const shouldSearchProjects = intent === "projects";

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
  );

  registerAppTool(
    server,
    "search_designers",
    {
      title: "Evlumba profesyonel ara",
      description:
        "Evlumba'nın kendi veritabanında iç mimar, mimar, usta, tadilat firması ve diğer profesyonelleri şehir, hizmet, alan, stil, bütçe ve proje sayısına göre arar. Kullanıcı Evlumba'da firma/profesyonel/tasarımcı bul dediğinde bu tool'u kullan; web search veya harita sonucu kullanma.",
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
      _meta: { ui: { resourceUri: WIDGET_URI } },
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
        "Evlumba'nın kendi veritabanında mutfak, banyo, salon, ofis gibi proje ve ilham görsellerini oda, stil, şehir, proje tipi ve bütçeye göre arar. Kullanıcı Evlumba'da proje/ilham/görsel bul dediğinde bu tool'u kullan; web search veya başka site sonucu kullanma.",
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
      _meta: { ui: { resourceUri: WIDGET_URI } },
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
      description: "Evlumba'nın kendi veritabanındaki profesyonel profil detayını slug, URL veya id ile getirir. Başka site veya Google işletme verisi kullanmaz.",
      inputSchema: {
        slugOrId: z.string().min(1).describe("Profesyonel slug, supa_<id>, profil URL'i veya profil id."),
      },
      _meta: { ui: { resourceUri: WIDGET_URI } },
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
      description: "Evlumba'nın kendi veritabanındaki proje detayını proje id, live-<id> veya URL içinden getirir. Başka site veya Google işletme verisi kullanmaz.",
      inputSchema: {
        projectId: z.string().min(1).describe("Proje id, live-<id> veya proje URL'i."),
      },
      _meta: { ui: { resourceUri: WIDGET_URI } },
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
