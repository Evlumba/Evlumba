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

const WIDGET_URI = "ui://evlumba/search-results-v4.html";
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
  openWorldHint: false,
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
};
const roomRenderInputSchema = {
  prompt: z.string().min(3).describe("Kullanıcının tasarım isteği. Örn: Bu salonu japandi stilde tasarla ve görsel ver."),
  style: z.string().optional().describe("Varsa stil: Japandi, Modern, Minimalist, Akdeniz, vb."),
  roomType: z.string().optional().describe("Varsa oda/mekan tipi: salon, mutfak, banyo, yatak odası, ofis, vb."),
  roomContext: z
    .string()
    .optional()
    .describe("Yüklenen/konuşulan görselden görülen oda özeti: mevcut durum, pencere, zemin, duvar, ölçü/oran ve korunacak layout."),
  sourceImageUrl: z
    .string()
    .optional()
    .describe("Varsa erişilebilir kaynak oda görsel URL'i veya data:image/...;base64 URL. Yoksa roomContext ile üret."),
  sourceImageBase64: z
    .string()
    .optional()
    .describe("Varsa kaynak oda görselinin base64 verisi. Data URL veya çıplak base64 kabul edilir. Yoksa roomContext ile üret."),
  quality: roomRenderQualitySchema.describe(
    "Render kalitesi. İlk cevap hızlı dönsün diye varsayılan low. Kullanıcı özellikle yüksek kalite isterse high gönder."
  ),
  size: roomRenderSizeSchema.describe(
    "Render boyutu. 1024x1024, 1024x1536 veya 1536x1024 önerilir. 1792x1024 gibi farklı oranlar gelirse otomatik yakın formata çevrilir."
  ),
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
  renderQueued: z.boolean().optional(),
  renderError: z.string().optional(),
  renderJob: z
    .object({
      endpoint: z.string(),
      prompt: z.string(),
      sourceImageUrl: z.string().optional(),
      sourceImageBase64: z.string().optional(),
      quality: z.enum(["low", "medium", "high"]),
      size: z.enum(["1024x1024", "1024x1536", "1536x1024"]),
      model: z.string(),
      hasSourceImage: z.boolean(),
    })
    .optional(),
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
    "Keep the room type and layout constraints from the user's request/source photo as much as possible.",
    roomType ? `Room type: ${roomType}.` : "",
    style ? `Requested style: ${style}.` : "",
    roomContext ? `Observed/source room context: ${roomContext}.` : "",
    `User request: ${prompt}.`,
    "Use a premium Turkish interior design sensibility: warm natural materials, clean detailing, practical circulation, and livable styling.",
  ]
    .filter(Boolean)
    .join("\n");
}

function isRoomRenderRequest(value: string) {
  const query = value.toLocaleLowerCase("tr-TR");
  return [
    "tasarla",
    "yeniden tasarla",
    "dekore et",
    "dekorasyon yap",
    "render",
    "fotogerçekçi",
    "fotogercekci",
    "görsel ver",
    "gorsel ver",
    "görsel üret",
    "gorsel uret",
    "image üret",
    "image uret",
    "oda yap",
    "salonu yap",
    "mutfağı yap",
    "banyoyu yap",
  ].some((term) => query.includes(term));
}

function inferRoomType(query: string) {
  const normalized = query.toLocaleLowerCase("tr-TR");
  const roomTypes = [
    "salon",
    "oturma odası",
    "mutfak",
    "banyo",
    "yatak odası",
    "çocuk odası",
    "bebek odası",
    "çalışma odası",
    "ofis",
    "bahçe",
    "balkon",
    "teras",
  ];
  return roomTypes.find((room) => normalized.includes(room));
}

function inferStyle(query: string) {
  const normalized = query.toLocaleLowerCase("tr-TR");
  const styles = [
    "Japandi",
    "Modern",
    "Minimalist",
    "Klasik",
    "Lüks",
    "İskandinav",
    "Rustik",
    "Endüstriyel",
    "Bohem",
    "Akdeniz",
    "Country",
    "Retro",
    "Eklektik",
    "Çağdaş",
    "Doğal / Organik",
    "Sahil / Coastal",
    "Geleneksel",
  ];
  return styles.find((style) => normalized.includes(style.toLocaleLowerCase("tr-TR")));
}

function normalizeRenderSize(size?: string): "1024x1024" | "1024x1536" | "1536x1024" {
  if (size === "1024x1536" || size === "1536x1024" || size === "1024x1024") return size;
  if (!size) return "1024x1024";

  const match = size.match(/(\d{3,4})\s*x\s*(\d{3,4})/i);
  if (!match) return "1024x1024";

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return "1024x1024";
  if (width > height * 1.12) return "1536x1024";
  if (height > width * 1.12) return "1024x1536";
  return "1024x1024";
}

function shouldUseHighQuality(prompt: string, quality?: "low" | "medium" | "high") {
  if (quality !== "high") return quality || DEFAULT_RENDER_QUALITY;
  const normalized = prompt.toLocaleLowerCase("tr-TR");
  const explicitlyHigh = ["yüksek kalite", "yuksek kalite", "high quality", "4k", "ultra", "çok detaylı", "cok detayli"].some((term) =>
    normalized.includes(term)
  );
  return explicitlyHigh ? "high" : DEFAULT_RENDER_QUALITY;
}

async function renderImageViaEvlumbaFunction(renderJob: {
  prompt: string;
  sourceImageUrl?: string;
  sourceImageBase64?: string;
  quality: "low" | "medium" | "high";
  size: "1024x1024" | "1024x1536" | "1536x1024";
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22000);
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
    return {
      imageBase64: result.imageBase64,
      mimeType: result.mimeType || "image/png",
    };
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
  const renderPrompt = buildRoomRenderPrompt({
    prompt,
    style: style || inferStyle(prompt),
    roomType: roomType || inferRoomType(prompt),
    roomContext,
  });
  const safeQuality = shouldUseHighQuality(prompt, quality);
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
      content: [
        {
          type: "text" as const,
          text: "Evlumba render hazır. Görsel aşağıda gösteriliyor.",
        },
        {
          type: "image" as const,
          data: rendered.imageBase64,
          mimeType: rendered.mimeType,
        },
      ],
      structuredContent: {
        query: prompt,
        appliedFilters: [] as string[],
        designers: [],
        projects: [],
        renderQueued: false,
        renderJob,
      },
      _meta: { renderJob },
    };
  } catch (error) {
    const renderError = error instanceof Error ? error.message : "Bilinmeyen render hatası";
    return {
      content: [
        {
          type: "text" as const,
          text: `Evlumba render kartı açılıyor. Görsel Evlumba kartında yüklenecek; tool argümanlarını veya JSON'u cevap olarak yazma. Render fallback nedeni: ${renderError}`,
        },
      ],
      structuredContent: {
        query: prompt,
        appliedFilters: [] as string[],
        designers: [],
        projects: [],
        renderQueued: true,
        renderError,
        renderJob,
      },
      _meta: { renderJob },
    };
  }
}

async function runGeneralEvlumbaSearch({
  query,
  intent,
  city,
  limit,
  style,
  roomType,
  roomContext,
  sourceImageUrl,
  sourceImageBase64,
  quality,
  size,
}: {
  query: string;
  intent?: "auto" | "designers" | "projects";
  city?: string;
  limit?: number;
  style?: string;
  roomType?: string;
  roomContext?: string;
  sourceImageUrl?: string;
  sourceImageBase64?: string;
  quality?: "low" | "medium" | "high";
  size?: string;
}) {
  if ((!intent || intent === "auto") && isRoomRenderRequest(query)) {
    return runRoomRender({
      prompt: query,
      style,
      roomType,
      roomContext,
      sourceImageUrl,
      sourceImageBase64,
      quality,
      size,
    });
  }

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
        "This MCP server powers Evlumba inside ChatGPT. Never print a JSON object with prompt/size as the assistant answer. If the user asks to design, redesign, decorate, render, or visualize a room, call evlumba_render_room_design or evlumba_search; do not write tool arguments as text. For room design requests, create a real photorealistic interior render; do not answer with a simple overlay, diagram, collage, HTML mockup, JSON payload, or text-only design board. For professional/project discovery, search Evlumba's live data only. When the user asks to find, list, compare, contact, or recommend architects, interior architects, designers, contractors, service providers, firms, portfolio projects, or inspiration projects, call an Evlumba search tool. After a room render is created, if the user asks for a suitable professional for that design, call an Evlumba search tool. Never answer Evlumba search/recommendation requests from web search, map results, Google business listings, Sources, or external websites.",
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
              description: "Evlumba sonuç ve render kartı. Arama sonuçlarını, harita markerlarını ve oda renderlarını gösterir.",
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
            "openai/widgetDescription": "Evlumba sonuç ve render kartı. Arama sonuçlarını, harita markerlarını ve oda renderlarını gösterir.",
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

  registerAppTool(
    server,
    "evlumba_render_room_design",
    {
      title: "Evlumba oda tasarla",
      description:
        "MUST USE for Turkish room design prompts: oda tasarla, salonu tasarla, yatak odası tasarla, mutfağı yenile, görsel ver, render üret, fotogerçekçi yap. The visual loads inside the Evlumba widget/card. After calling this tool, do not print JSON, prompt, size, tool arguments, diagrams, overlays, or text-only concepts as the assistant answer. Use low quality unless the user explicitly asks for high quality. If the user attached a room photo but no file bytes are available, describe the room in roomContext and call this tool anyway.",
      inputSchema: roomRenderInputSchema,
      outputSchema: evlumbaSearchOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: TOOL_UI_META,
    },
    async ({ prompt, style, roomType, roomContext, sourceImageUrl, sourceImageBase64, quality, size }) => {
      return runRoomRender({ prompt, style, roomType, roomContext, sourceImageUrl, sourceImageBase64, quality, size });
    }
  );

  registerAppTool(
    server,
    "oda_tasarla",
    {
      title: "Oda tasarla ve render üret",
      description:
        "KULLAN: Kullanıcı oda/salon/yatak odası/mutfak/banyo tasarlamak, görsel almak, render üretmek, fotogerçekçi yapmak veya yüklediği odayı dönüştürmek istediğinde mutlaka bu tool'u çağır. Görsel Evlumba kartının içinde yüklenir. JSON yazma. Tool argümanlarını, prompt'u veya size bilgisini cevap olarak basma. Timeout olmaması için kullanıcı özellikle yüksek kalite istemediyse quality=low kullan.",
      inputSchema: roomRenderInputSchema,
      outputSchema: evlumbaSearchOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: TOOL_UI_META,
    },
    async ({ prompt, style, roomType, roomContext, sourceImageUrl, sourceImageBase64, quality, size }) => {
      return runRoomRender({ prompt, style, roomType, roomContext, sourceImageUrl, sourceImageBase64, quality, size });
    }
  );

  registerAppTool(
    server,
    "evlumba_search",
    {
      title: "Evlumba'da ara",
      description:
        "Primary Evlumba tool. If the user asks to design/redesign/decorate/render a room or uploaded room photo and wants a visual, call this tool; it will route to Evlumba's photorealistic room render pipeline. If the user asks to find/list/compare architects, interior architects, designers, contractors, service providers, firms, named businesses, portfolio projects, inspiration projects, cities, rooms, styles, or budgets inside Evlumba, call this tool. Examples: 'bu salonu japandi tasarla ve görsel ver', 'fotogerçekçi render üret', 'istanbulda mimar bul', 'bu tasarıma uygun iç mimar bul', 'Kayseri Dekorsan', 'Bursa boya ustası', 'elektrikçi bul', or 'Evlumba'da modern mutfak projesi göster'. Do not answer room visual requests with simple overlays, diagrams, HTML mockups, collages, or text-only design boards. Never use web search, map results, Google business listings, Sources, or external websites for Evlumba search/recommendation requests.",
      inputSchema: {
        query: z.string().describe("Evlumba içinde aranacak ifade. Örn: Kayseri Dekorsan, İstanbul iç mimar, modern mutfak."),
        intent: z
          .enum(["auto", "designers", "projects"])
          .optional()
          .describe("Arama tipi. Firma/profesyonel için designers, proje/ilham için projects, emin değilsen auto."),
        city: z.string().optional().describe("Varsa şehir filtresi."),
        style: z.string().optional().describe("Render veya arama için stil. Örn: Japandi, Modern, Minimalist."),
        roomType: z.string().optional().describe("Render veya arama için oda/mekan tipi. Örn: salon, mutfak, banyo."),
        roomContext: z
          .string()
          .optional()
          .describe("Yüklenen/konuşulan görselden görülen oda özeti. Render isteklerinde kaynak görsel aktarılamıyorsa bunu doldur."),
        sourceImageUrl: z.string().optional().describe("Render için varsa erişilebilir kaynak oda görsel URL'i veya data URL."),
        sourceImageBase64: z.string().optional().describe("Render için varsa kaynak oda görselinin base64 verisi."),
        quality: roomRenderQualitySchema.describe("Render kalitesi. Varsayılan low; yüksek kalite özellikle istenirse high."),
        size: roomRenderSizeSchema.describe("Render boyutu. 1024x1024, 1024x1536 veya 1536x1024 önerilir. 1792x1024 gibi farklı oranlar gelirse otomatik yakın formata çevrilir."),
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
        "Alias for evlumba_search. Use for Evlumba room render requests and Evlumba search/recommendation results. For 'oda tasarla', 'salon tasarla', 'görsel ver', or 'render üret' prompts, this returns Evlumba's photorealistic render instead of a simple overlay. For professional/project requests, it returns Evlumba-owned designers, professionals, firms, and projects. Never use maps, Google business listings, Sources, web search, or external websites for Evlumba searches.",
      inputSchema: {
        query: z.string().describe("Evlumba içinde aranacak ifade. Örn: Kayseri Dekorsan, İstanbul iç mimar, modern mutfak."),
        intent: z
          .enum(["auto", "designers", "projects"])
          .optional()
          .describe("Arama tipi. Firma/profesyonel için designers, proje/ilham için projects, emin değilsen auto."),
        city: z.string().optional().describe("Varsa şehir filtresi."),
        style: z.string().optional().describe("Render veya arama için stil. Örn: Japandi, Modern, Minimalist."),
        roomType: z.string().optional().describe("Render veya arama için oda/mekan tipi. Örn: salon, mutfak, banyo."),
        roomContext: z
          .string()
          .optional()
          .describe("Yüklenen/konuşulan görselden görülen oda özeti. Render isteklerinde kaynak görsel aktarılamıyorsa bunu doldur."),
        sourceImageUrl: z.string().optional().describe("Render için varsa erişilebilir kaynak oda görsel URL'i veya data URL."),
        sourceImageBase64: z.string().optional().describe("Render için varsa kaynak oda görselinin base64 verisi."),
        quality: roomRenderQualitySchema.describe("Render kalitesi. Varsayılan low; yüksek kalite özellikle istenirse high."),
        size: roomRenderSizeSchema.describe("Render boyutu. 1024x1024, 1024x1536 veya 1536x1024 önerilir. 1792x1024 gibi farklı oranlar gelirse otomatik yakın formata çevrilir."),
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
