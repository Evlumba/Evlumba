const PROFESSIONAL_TERMS = new Set([
  "mimar",
  "mimarlar",
  "mimari",
  "mimarlik",
  "icmimar",
  "icmimarlik",
  "tasarimci",
  "tasarimcisi",
  "dekorator",
  "dekorasyoncu",
  "profesyonel",
  "uzman",
  "usta",
  "peyzaj",
  "architect",
  "designer",
]);

const PROJECT_TERMS = new Set([
  "mutfak",
  "banyo",
  "salon",
  "oda",
  "yatak",
  "cocuk",
  "ofis",
  "antre",
  "bahce",
  "balkon",
  "teras",
  "japandi",
  "modern",
  "minimal",
  "minimalist",
  "bohem",
  "rustik",
  "klasik",
  "ahsap",
  "mermer",
  "renovasyon",
  "tadilat",
]);

const STOP_WORDS = new Set(["ve", "ile", "icin", "bir", "en", "olan", "ariyorum", "ara"]);

export function normalizeSearchText(value: string) {
  return value
    .replaceAll("İ", "i")
    .replaceAll("I", "i")
    .toLowerCase()
    .replaceAll("\u0307", "")
    .replaceAll("ç", "c")
    .replaceAll("ğ", "g")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ş", "s")
    .replaceAll("ü", "u");
}

export function queryTokens(value: string) {
  return normalizeSearchText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function isProfessionalQuery(value: string) {
  const tokens = queryTokens(value);
  if (!tokens.length) return false;

  const professionalCount = tokens.filter((token) => PROFESSIONAL_TERMS.has(token)).length;
  if (!professionalCount) return false;

  const projectCount = tokens.filter((token) => PROJECT_TERMS.has(token)).length;
  return projectCount === 0 || professionalCount >= projectCount;
}

export function isProjectQuery(value: string) {
  const tokens = queryTokens(value);
  if (!tokens.length) return false;

  const professionalCount = tokens.filter((token) => PROFESSIONAL_TERMS.has(token)).length;
  const projectCount = tokens.filter((token) => PROJECT_TERMS.has(token)).length;
  return projectCount > 0 && projectCount > professionalCount;
}
