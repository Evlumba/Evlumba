declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

export {};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ImageQuality = 'low' | 'medium' | 'high';
type ImageSize = '1024x1024' | '1024x1536' | '1536x1024';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getEnv(name: string, fallbackName?: string) {
  return Deno.env.get(name) ?? (fallbackName ? Deno.env.get(fallbackName) : null);
}

function normalizePrompt(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, 4000);
}

function normalizeQuality(value: unknown): ImageQuality {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'high';
}

function normalizeSize(value: unknown): ImageSize {
  if (value === '1024x1536' || value === '1536x1024' || value === '1024x1024') {
    return value;
  }
  if (typeof value !== 'string') return '1024x1024';

  const match = value.match(/(\d{3,4})\s*x\s*(\d{3,4})/i);
  if (!match) return '1024x1024';

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return '1024x1024';
  if (width > height * 1.12) return '1536x1024';
  if (height > width * 1.12) return '1024x1536';
  return '1024x1024';
}

function parseDataUrl(value?: string) {
  const match = value?.match(/^data:([^;]+);base64,(.+)$/);
  if (!match?.[2]) return null;
  return {
    base64: match[2],
    mimeType: match[1] || 'image/png',
  };
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function normalizeBase64Image(value?: string) {
  const parsed = parseDataUrl(value);
  return parsed ?? (value ? { base64: value, mimeType: 'image/png' } : null);
}

async function readImageReference(sourceImageBase64?: string, sourceImageUrl?: string) {
  const inlineImage = normalizeBase64Image(sourceImageBase64) || parseDataUrl(sourceImageUrl);
  if (inlineImage) {
    return new Blob([base64ToBytes(inlineImage.base64)], { type: inlineImage.mimeType });
  }

  if (!sourceImageUrl) return null;

  const imageResponse = await fetch(sourceImageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Kaynak gorsel alinamadi (${imageResponse.status}).`);
  }
  const mimeType = imageResponse.headers.get('content-type') || 'image/png';
  return new Blob([await imageResponse.arrayBuffer()], { type: mimeType });
}

async function readError(response: Response) {
  const text = await response.text();
  if (!text) return response.statusText;

  try {
    const data = JSON.parse(text) as { error?: { message?: string }; message?: string };
    return data.error?.message ?? data.message ?? text;
  } catch (_) {
    return text;
  }
}

async function generateImage(
  openAiKey: string,
  model: string,
  prompt: string,
  quality: ImageQuality,
  size: ImageSize,
) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      quality,
      size,
      output_format: 'png',
    }),
  });

  if (!response.ok) throw new Error(await readError(response));

  const data = await response.json() as { data?: Array<{ b64_json?: string }> };
  const imageBase64 = data.data?.[0]?.b64_json;
  if (!imageBase64) throw new Error('OpenAI gorsel yaniti bos geldi.');
  return imageBase64;
}

async function editImage(
  openAiKey: string,
  model: string,
  prompt: string,
  quality: ImageQuality,
  size: ImageSize,
  sourceImageBase64?: string,
  sourceImageUrl?: string,
) {
  const imageBlob = await readImageReference(sourceImageBase64, sourceImageUrl);
  if (!imageBlob) return generateImage(openAiKey, model, prompt, quality, size);

  const form = new FormData();
  form.append('model', model);
  form.append('prompt', prompt);
  form.append('quality', quality);
  form.append('size', size);
  form.append('image[]', imageBlob, 'evlumba-room-reference.png');

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openAiKey}` },
    body: form,
  });

  if (!response.ok) throw new Error(await readError(response));

  const data = await response.json() as { data?: Array<{ b64_json?: string }> };
  const imageBase64 = data.data?.[0]?.b64_json;
  if (!imageBase64) throw new Error('OpenAI gorsel yaniti bos geldi.');
  return imageBase64;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed.' }, 405);
  }

  const openAiKey = getEnv('OPENAI_API_KEY');
  const model = getEnv('OPENAI_IMAGE_MODEL') || 'gpt-image-2';

  if (!openAiKey) {
    return jsonResponse({ ok: false, message: 'Render servisi yapilandirilmamis.' }, 503);
  }

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const prompt = normalizePrompt(body.prompt);
    const quality = normalizeQuality(body.quality);
    const size = normalizeSize(body.size);
    const sourceImageBase64 =
      typeof body.sourceImageBase64 === 'string' ? body.sourceImageBase64 : undefined;
    const sourceImageUrl =
      typeof body.sourceImageUrl === 'string' ? body.sourceImageUrl : undefined;

    if (prompt.length < 3) {
      return jsonResponse({ ok: false, message: 'Render promptu bos.' }, 400);
    }

    const imageBase64 = await editImage(
      openAiKey,
      model,
      prompt,
      quality,
      size,
      sourceImageBase64,
      sourceImageUrl,
    );

    return jsonResponse({
      ok: true,
      imageBase64,
      mimeType: 'image/png',
      model,
      hasSourceImage: Boolean(sourceImageBase64 || sourceImageUrl),
    });
  } catch (e) {
    return jsonResponse({
      ok: false,
      message: e instanceof Error ? e.message : 'Render tamamlanamadi.',
    }, 500);
  }
});
