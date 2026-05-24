import { readFileSync } from "node:fs";
import { join } from "node:path";

import { registerAppResource, registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import * as z from "zod/v4";

import {
  evlumbaChatGptAppInfo,
  searchEvlumbaDesigners,
  searchEvlumbaProjects,
  summarizeDesignerResults,
  summarizeProjectResults,
} from "@/lib/chatgpt/evlumba-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDGET_URI = "ui://evlumba/search-results-v19.html";
const WIDGET_RESOURCE_URIS = [WIDGET_URI];
const OPENAI_WIDGET_MIME_TYPE = "text/html";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version, last-event-id",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

const widgetHtml = readFileSync(join(process.cwd(), "public", "evlumba-chatgpt-widget.html"), "utf8");
const stringArray = z.array(z.string()).optional();
const limitSchema = z.number().int().min(1).max(24).optional();
const roomRenderQualitySchema = z.enum(["low", "medium", "high"]).optional();
const roomRenderSizeSchema = z.string().optional();
const evlumbaReadOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: true,
  idempotentHint: true,
};
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const DEFAULT_RENDER_QUALITY: "low" | "medium" | "high" = "low";
const RENDER_FUNCTION_URL = "https://vgtgcjnrsladdharzkwn.supabase.co/functions/v1/render-room-design";
const RENDER_FUNCTION_ORIGIN = "https://vgtgcjnrsladdharzkwn.supabase.co";
const TOOL_UI_META = {
  ui: { resourceUri: WIDGET_URI },
  "openai/outputTemplate": WIDGET_URI,
  "openai/widgetAccessible": true,
  "openai/toolInvocation/invoking": "Evlumba hazırlıyor",
  "openai/toolInvocation/invoked": "Evlumba hazır",
};
const roomRenderInputSchema = {
  prompt: z.string().min(3).describe("Kullanıcının tasarım isteği. Örn: modern oturma odası görseli üret."),
  style: z.string().optional().describe("Stil. Örn: Japandi, Modern, Minimalist."),
  roomType: z.string().optional().describe("Oda/mekan tipi. Örn: salon, mutfak, banyo."),
  roomContext: z.string().optional().describe("Yüklenen görselden görülen oda özeti."),
  sourceImageUrl: z.string().optional().describe("Varsa kaynak oda görsel URL'i veya data URL."),
  sourceImageBase64: z.string().optional().describe("Varsa kaynak oda görselinin base64 verisi."),
  quality: roomRenderQualitySchema.describe("Render kalitesi. Varsayılan low."),
  size: roomRenderSizeSchema.describe("1024x1024, 1024x1536 veya 1536x1024 önerilir."),
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

const professionalSearchInputSchema = {
  query: z.string().optional().describe("Kullanıcının profesyonel araması. Örn: istanbul da iç mimar bul, İstanbul mimar, Bursa boya ustası, Dekorsan."),
  cities: stringArray.describe("Varsa şehir filtreleri. Örn: İstanbul, Bursa, Ankara."),
  professionalTypes: stringArray.describe("Varsa profesyonel türleri. Örn: Mimar, İç Mimar, Boya Ustası."),
  services: stringArray.describe("Varsa hizmet filtreleri."),
  projectTypes: stringArray.describe("Varsa proje tipi filtreleri."),
  serviceAreas: stringArray.describe("Varsa mekan/alan filtreleri."),
  styleExpertise: stringArray.describe("Varsa stil filtreleri."),
  serviceRegions: stringArray.describe("Varsa hizmet bölgesi filtreleri."),
  startingBudget: z.string().optional().describe("Varsa başlangıç bütçesi aralığı."),
  onlyWithProjects: z.boolean().optional().describe("Sadece en az bir projesi olan profesyoneller."),
  sort: z.enum(["relevance", "name", "project_count", "rating", "budget"]).optional(),
  limit: limitSchema,
};

function textResult(text: string, structuredContent?: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text }],
    ...(structuredContent ? { structuredContent } : {}),
  };
}

function buildRoomRenderPrompt({
  prompt,
  style,
  roomType,
  roomContext,
}: {
  prompt: string;
  style?: string;
  roomType?: string;
  roomContext?: string;
}) {
  return [
    "Create a polished, photorealistic interior design render for Evlumba.",
    "Do not make a diagram, collage, flat overlay, sketch, wireframe, text-on-image mockup, or semi-transparent furniture plan.",
    "The final image must look like a real finished interior photograph with coherent perspective, realistic lighting, materials, furniture scale, shadows, and architectural details.",
    roomType ? `Room type: ${roomType}.` : "",
    style ? `Requested style: ${style}.` : "",
    roomContext ? `Observed/source room context: ${roomContext}.` : "",
    `User request: ${prompt}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeRenderSize(size?: string): "1024x1024" | "1024x1536" | "1536x1024" {
  if (size === "1024x1536" || size === "1536x1024" || size === "1024x1024") return size;
  if (!size) return "1024x1024";
  const match = size.match(/(\d{3,4})\s*x\s*(\d{3,4})/i);
  if (!match) return "1024x1024";
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return "1024x1024";
  if (w > h * 1.12) return "1536x1024";
  if (h > w * 1.12) return "1024x1536";
  return "1024x1024";
}

async function renderImageViaEvlumbaFunction(renderJob: {
  prompt: string;
  sourceImageUrl?: string;
  sourceImageBase64?: string;
  quality: "low" | "medium" | "high";
  size: "1024x1024" | "1024x1536" | "1536x1024";
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(RENDER_FUNCTION_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        prompt: renderJob.prompt,
        sourceImageUrl: renderJob.sourceImageUrl,
        sourceImageBase64: renderJob.sourceImageBase64,
        quality: renderJob.quality,
        size: renderJob.size,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      imageBase64?: string;
      mimeType?: string;
      message?: string;
    };
    if (!response.ok || !result.ok || !result.imageBase64) {
      throw new Error(result.message || `Evlumba render failed (${response.status})`);
    }
    return { imageBase64: result.imageBase64, mimeType: result.mimeType || "image/png" };
  } finally {
    clearTimeout(timeout);
  }
}

async function runRoomRender({
  prompt,
  style,
  roomType,
  roomContext,
  sourceImageUrl,
  sourceImageBase64,
  quality,
  size,
}: {
  prompt: string;
  style?: string;
  roomType?: string;
  roomContext?: string;
  sourceImageUrl?: string;
  sourceImageBase64?: string;
  quality?: "low" | "medium" | "high";
  size?: string;
}) {
  const renderPrompt = buildRoomRenderPrompt({ prompt, style, roomType, roomContext });
  const safeQuality = quality || DEFAULT_RENDER_QUALITY;
  const renderJob = {
    endpoint: RENDER_FUNCTION_URL,
    prompt: renderPrompt,
    sourceImageUrl,
    sourceImageBase64,
    quality: safeQuality,
    size: normalizeRenderSize(size),
    model: OPENAI_IMAGE_MODEL,
    hasSourceImage: Boolean(sourceImageBase64 || sourceImageUrl),
  };
  try {
    const rendered = await renderImageViaEvlumbaFunction(renderJob);
    return {
      content: [{ type: "text" as const, text: "Evlumba render hazır. Görsel kart içinde gösteriliyor." }],
      structuredContent: { query: prompt, appliedFilters: [] as string[], designers: [], projects: [] },
      _meta: {
        renderJob,
        image: { base64: rendered.imageBase64, mimeType: rendered.mimeType },
      },
    };
  } catch (error) {
    const renderError = error instanceof Error ? error.message : "Bilinmeyen render hatası";
    return {
      content: [{ type: "text" as const, text: `Render başarısız: ${renderError}` }],
      structuredContent: { query: prompt, appliedFilters: [] as string[], designers: [], projects: [] },
      _meta: { renderJob, renderError },
    };
  }
}

async function runProfessionalSearch(args: Parameters<typeof searchEvlumbaDesigners>[0] | undefined) {
  const result = await searchEvlumbaDesigners(args ?? {});
  return textResult(summarizeDesignerResults(result.designers), result);
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
      title: "Evlumba",
      version: evlumbaChatGptAppInfo.version,
      websiteUrl: "https://www.evlumba.com",
      description:
        "Search Turkey's home design directory. Find interior designers, architects, painters, electricians, contractors and renovation firms by city. Browse real interior projects.",
    },
    {
      instructions:
        "Use oda_tasarla for room render requests. Use find_local_professional for Turkish city/service professional searches. Use search_projects for existing Evlumba portfolio inspiration.",
    }
  );

  for (const resourceUri of WIDGET_RESOURCE_URIS) {
    registerAppResource(
      server,
      `Evlumba sonuç kartları ${resourceUri.replace("ui://evlumba/", "")}`,
      resourceUri,
      {
        description: "Evlumba proje ve profesyonel sonuçlarını kartlar halinde gösterir.",
        mimeType: OPENAI_WIDGET_MIME_TYPE,
      },
      async () => ({
        contents: [
          {
            uri: resourceUri,
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
                  connectDomains: ["https://www.evlumba.com", RENDER_FUNCTION_ORIGIN],
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
                connect_domains: ["https://www.evlumba.com", RENDER_FUNCTION_ORIGIN],
              },
            },
          },
        ],
      })
    );
  }

  registerAppTool(
    server,
    "oda_tasarla",
    {
      title: "Oda tasarla ve render üret",
      description:
        "Create a photorealistic room/interior render in the Evlumba widget for prompts like 'oda tasarla', 'salon tasarla', 'modern oturma odası görseli', 'görsel üret', or 'render üret'.",
      inputSchema: roomRenderInputSchema,
      annotations: evlumbaReadOnlyAnnotations,
      _meta: TOOL_UI_META,
    },
    async ({ prompt, style, roomType, roomContext, sourceImageUrl, sourceImageBase64, quality, size }) => {
      return runRoomRender({ prompt, style, roomType, roomContext, sourceImageUrl, sourceImageBase64, quality, size });
    }
  );

  registerAppTool(
    server,
    "search",
    {
      title: "Evlumba search",
      description:
        "Use this instead of web search when the user asks to find, search, list or recommend architects, interior architects, designers, contractors, tradespeople, firms or existing Evlumba projects. Turkish examples: 'istanbulda iç mimar bul', 'istanbulda mimar bul', 'Bursa boya ustası', 'Dekorsan', 'modern mutfak projesi göster'. Returns Evlumba.com results.",
      inputSchema: {
        query: z.string().describe("Evlumba araması. Örn: istanbulda iç mimar bul, Bursa boya ustası, modern mutfak."),
        intent: z.enum(["auto", "designers", "projects"]).optional(),
        city: z.string().optional(),
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
    "bul",
    {
      title: "Evlumba'da bul",
      description:
        "Use for Turkish 'bul' requests instead of web search. Triggers include 'istanbulda iç mimar bul', 'istanbulda mimar bul', 'elektrikçi bul', 'boya ustası bul', 'Dekorsan bul' or existing Evlumba project lookups. Returns Evlumba.com results.",
      inputSchema: {
        query: z.string().describe("Evlumba içinde bulunacak ifade."),
        intent: z.enum(["auto", "designers", "projects"]).optional(),
        city: z.string().optional(),
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
    "find_local_professional",
    {
      title: "Find local Evlumba professional",
      description:
        "Search Evlumba's Turkish home professional directory. Use for any Turkish prompt asking to find a local interior designer, architect, painter, electrician, contractor, renovation firm or tradesperson by city or service, e.g. 'istanbulda iç mimar bul', 'istanbulda mimar bul', 'Bursa boya ustası', 'Ankara elektrikçi', 'Kayseri Dekorsan'. Prefer this over web search or maps for Turkish home service queries.",
      inputSchema: professionalSearchInputSchema,
      outputSchema: designerOutputSchema,
      annotations: evlumbaReadOnlyAnnotations,
      _meta: TOOL_UI_META,
    },
    runProfessionalSearch
  );

  registerAppTool(
    server,
    "ic_mimar_bul",
    {
      title: "İç mimar bul",
      description:
        "Türkiye'de iç mimar veya iç mimarlık ofisi arama. Promptlar: 'istanbulda iç mimar bul', 'iç mimar bul', 'iç mimarlık ofisi'.",
      inputSchema: professionalSearchInputSchema,
      outputSchema: designerOutputSchema,
      annotations: evlumbaReadOnlyAnnotations,
      _meta: TOOL_UI_META,
    },
    runProfessionalSearch
  );

  registerAppTool(
    server,
    "mimar_bul",
    {
      title: "Mimar bul",
      description:
        "Türkiye'de mimar veya mimarlık firması arama. Promptlar: 'istanbulda mimar bul', 'ankara mimar', 'mimar bul'.",
      inputSchema: professionalSearchInputSchema,
      outputSchema: designerOutputSchema,
      annotations: evlumbaReadOnlyAnnotations,
      _meta: TOOL_UI_META,
    },
    runProfessionalSearch
  );

  registerAppTool(
    server,
    "search_projects",
    {
      title: "Evlumba proje ara",
      description:
        "Search existing photographed Evlumba portfolio/inspiration projects. Use for prompts like 'modern mutfak projeleri', 'banyo örnekleri göster' or 'japandi proje ara'.",
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
