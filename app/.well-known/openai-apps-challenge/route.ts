export const dynamic = "force-static";

const OPENAI_APPS_CHALLENGE_TOKEN = "UjPv_0lniCvPpCB3gkCFp-zhWKEQkDQX2rqxun_4M80";

export function GET() {
  return new Response(OPENAI_APPS_CHALLENGE_TOKEN, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
