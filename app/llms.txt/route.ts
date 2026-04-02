import { SITE_URL } from "@/lib/seo";

export const revalidate = 86400;

export async function GET() {
  const body = [
    "Evlumba",
    "İç mimar, mimar, dekorasyon ve tasarım odağında keşif ve eşleşme platformu.",
    "",
    `URL: ${SITE_URL}`,
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
    "Önemli sayfalar:",
    `- ${SITE_URL}/`,
    `- ${SITE_URL}/tasarimcilar`,
    `- ${SITE_URL}/blog`,
    `- ${SITE_URL}/ilanlar`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
