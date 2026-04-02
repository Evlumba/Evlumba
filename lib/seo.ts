export const SITE_NAME = "Evlumba";
export const SITE_URL = "https://www.evlumba.com";
export const DEFAULT_DESCRIPTION =
  "Evlumba ile ilham keşfet, beğenilerini kaydet ve tarzına en uygun profesyonellerle eşleş.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/web_icon2.png`;

export function toAbsoluteUrl(pathOrUrl: string) {
  const value = pathOrUrl.trim();
  if (!value) return SITE_URL;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return `${SITE_URL}/${value}`;
}

export function trimForDescription(value: string, maxLength = 160) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
