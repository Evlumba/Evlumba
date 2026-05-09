/**
 * Normalize designer profile "Genel" data into about_details.profileGeneral.
 *
 * Usage:
 *   node scripts/migrate-profile-general.mjs --dry-run
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-profile-general.mjs --apply
 *
 * Safety:
 * - Defaults to dry-run unless --apply is passed.
 * - Never deletes old/free-text fields.
 * - Does not overwrite already-filled normalized fields, except sanitizing
 *   legacy "Tümü" into all real allowed options.
 * - Writes a local JSON backup before --apply updates.
 */

import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import process from "process";

const SCRIPT_VERSION = "2026-05-09.profile-general-v1";
const DEFAULT_SUPABASE_URL = "https://vgtgcjnrsladdharzkwn.supabase.co";
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const APPLY = process.argv.includes("--apply");
const DRY_RUN = !APPLY || process.argv.includes("--dry-run");
const LIMIT = Number(readArg("--limit") || "0") || 0;
const ONLY_ID = readArg("--designer-id") || "";

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Run dry-run/apply with a service role key.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replaceAll("&", " ")
    .replaceAll("/", " ")
    .replace(/[^a-z0-9\s.+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toRecord(value) {
  return isRecord(value) ? value : {};
}

function stringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isFilledString(value) {
  return stringValue(value).length > 0;
}

function arrayFromUnknown(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,|;/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function stringifyLegacy(value) {
  if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean).join(", ");
  return stringValue(value);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function containsAllToken(value) {
  return arrayFromUnknown(value).some((item) => normalizeText(item) === normalizeText("Tümü"));
}

function buildOptionMap(options) {
  return new Map(options.map((option) => [normalizeText(option), option]));
}

function uniqueKnown(values, options, fallbackMap = {}) {
  if (containsAllToken(values)) return [...options];
  const optionMap = buildOptionMap(options);
  const out = [];
  for (const raw of arrayFromUnknown(values)) {
    const normalized = normalizeText(raw);
    const mapped = fallbackMap[normalized] || optionMap.get(normalized);
    const list = Array.isArray(mapped) ? mapped : mapped ? [mapped] : [];
    for (const item of list) {
      if (options.includes(item) && !out.includes(item)) out.push(item);
    }
  }
  return out;
}

function sanitizeAllowedArray(values, options, fallbackMap = {}) {
  return uniqueKnown(values, options, fallbackMap);
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const str = stringValue(value);
    if (str) return str;
  }
  return "";
}

function hasTerm(text, term) {
  const normalized = normalizeText(text);
  const needle = normalizeText(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${needle}(\\s|$)`).test(normalized);
}

function hasAny(text, terms) {
  return terms.some((term) => hasTerm(text, term));
}

function decodeLocationText(value) {
  const raw = String(value || "").replace(/\+/g, " ");
  if (!raw) return "";
  const variants = [raw];
  try {
    variants.push(decodeURIComponent(raw));
  } catch {
    // Some old Google URLs are partially encoded; keeping raw is still useful.
  }
  return variants
    .join(" ")
    .replace(/[/?#&=_:@.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addMatch(out, value, allowed, limit = Infinity) {
  if (!allowed.includes(value) || out.includes(value) || out.length >= limit) return;
  out.push(value);
}

function inferByRules(text, rules, allowed, limit = Infinity) {
  const out = [];
  for (const rule of rules) {
    if (rule.when(text)) addMatch(out, rule.value, allowed, limit);
  }
  return out;
}

function parseAssignedExpression(source, constName) {
  const marker = source.indexOf(constName);
  if (marker === -1) throw new Error(`Cannot find ${constName}`);
  const equals = source.indexOf("=", marker);
  if (equals === -1) throw new Error(`Cannot find assignment for ${constName}`);
  let start = equals + 1;
  while (/\s/.test(source[start])) start += 1;
  const opener = source[start];
  const closer = opener === "[" ? "]" : opener === "{" ? "}" : "";
  if (!closer) throw new Error(`Unsupported expression for ${constName}`);

  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === opener) depth += 1;
    if (ch === closer) depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Cannot parse expression for ${constName}`);
}

async function loadFormConstants() {
  const source = await readFile(path.join(process.cwd(), "app/designer-panel/profile/profile-general.tsx"), "utf8");
  const names = [
    "PROFESSIONAL_TYPE_OPTIONS",
    "SERVICE_GROUPS",
    "PROJECT_TYPE_OPTIONS",
    "SERVICE_AREA_GROUPS",
    "STYLE_OPTIONS",
    "TURKIYE_ILLERI",
    "ILCELER_BY_IL",
    "SERVICE_REGION_OPTIONS",
    "STARTING_BUDGET_OPTIONS",
    "WORKING_MODEL_OPTIONS",
    "TAG_OPTIONS",
  ];
  return Object.fromEntries(
    names.map((name) => [name, Function(`"use strict"; return (${parseAssignedExpression(source, name)});`)()])
  );
}

const C = await loadFormConstants();
const PROFESSIONAL_TYPE_OPTIONS = C.PROFESSIONAL_TYPE_OPTIONS;
const SERVICE_OPTIONS = C.SERVICE_GROUPS.flatMap((group) => group.options);
const PROJECT_TYPE_OPTIONS = C.PROJECT_TYPE_OPTIONS;
const SERVICE_AREA_OPTIONS = C.SERVICE_AREA_GROUPS.flatMap((group) => group.options);
const STYLE_OPTIONS = C.STYLE_OPTIONS;
const CITY_OPTIONS = C.TURKIYE_ILLERI;
const DISTRICTS_BY_CITY = C.ILCELER_BY_IL;
const SERVICE_REGION_OPTIONS = C.SERVICE_REGION_OPTIONS;
const STARTING_BUDGET_OPTIONS = C.STARTING_BUDGET_OPTIONS;
const WORKING_MODEL_OPTIONS = C.WORKING_MODEL_OPTIONS;
const TAG_OPTIONS = C.TAG_OPTIONS;

const PROFESSIONAL_LEGACY_MAP = {
  "ic mimar": "İç Mimar",
  mimar: "Mimar",
  "ic mimar mimar": ["İç Mimar", "Mimar"],
  "ic mimarlik burosu": "İç Mimarlık Bürosu",
  "ic mimarlik ofisi": "İç Mimarlık Ofisi",
  "insaat sirketi": "İnşaat Şirketi",
  "insaat firmasi": "İnşaat Firması",
  "mobilya ureticisi": "Mobilya Üreticisi",
  "mobilya imalatcisi": "Mobilya İmalatçısı",
  "peyzaj mimari": "Peyzaj Mimarı",
  "3d render": "3D Görselleştirme Uzmanı",
  "3d": "3D Görselleştirme Uzmanı",
  render: "3D Görselleştirme Uzmanı",
  uygulama: "Usta / Uygulamacı",
};

const PROJECT_LEGACY_MAP = {
  "komple yenileme": "Tadilat / Renovasyon",
  planlama: "Danışmanlık",
  "3d render": "3D Tasarım / Render",
  render: "3D Tasarım / Render",
  tadilat: "Tadilat / Renovasyon",
  renovasyon: "Tadilat / Renovasyon",
  yenileme: "Tadilat / Renovasyon",
};

const SERVICE_LEGACY_MAP = {
  danismanlik: "Dekorasyon Danışmanlığı",
  uygulama: "Anahtar Teslim Uygulama",
  "3d render": "3D Render / Görselleştirme",
  render: "3D Render / Görselleştirme",
};

function sourceText(profile, aboutDetails, profileGeneral, projects) {
  const projectText = projects
    .flatMap((project) => [project.title, project.project_type, project.location, project.description, ...(project.tags || [])])
    .filter(Boolean)
    .join(" ");
  const legacyText = [
    profileGeneral.legacyJobType,
    profileGeneral.legacyProjectTypes,
    profileGeneral.legacyServices,
    profileGeneral.legacyTags,
    profile.specialty,
    stringifyLegacy(aboutDetails.professionalTypes),
    stringifyLegacy(aboutDetails.projectTypes),
    stringifyLegacy(aboutDetails.services),
    stringifyLegacy(aboutDetails.serviceAreas),
    stringifyLegacy(profile.tags),
    profile.starting_from,
  ].join(" ");
  return {
    displayName: firstNonEmpty(profileGeneral.displayName, profileGeneral.fullName, profile.full_name),
    businessName: firstNonEmpty(profileGeneral.businessName, profile.business_name),
    profileImageUrl: firstNonEmpty(profileGeneral.profileImageUrl, profileGeneral.avatarUrl, profile.avatar_url),
    legacyJobType: firstNonEmpty(profileGeneral.legacyJobType, profile.specialty),
    legacyProjectTypes: firstNonEmpty(profileGeneral.legacyProjectTypes, stringifyLegacy(aboutDetails.projectTypes)),
    legacyServices: firstNonEmpty(profileGeneral.legacyServices, stringifyLegacy(aboutDetails.services)),
    legacyTags: firstNonEmpty(profileGeneral.legacyTags, stringifyLegacy(profile.tags)),
    legacyStartingPrice: firstNonEmpty(profileGeneral.legacyStartingPrice, profile.starting_from),
    profileText: [
      profile.full_name,
      profile.business_name,
      profile.specialty,
      profile.city,
      decodeLocationText(profile.address),
      decodeLocationText(profile.konum),
      profile.about,
      profile.website,
      profile.instagram,
      aboutDetails.headline,
      aboutDetails.bio,
      aboutDetails.about,
      aboutDetails.description,
      stringifyLegacy(profile.tags),
      legacyText,
      projectText,
    ]
      .filter(Boolean)
      .join(" "),
    locationText: [
      profile.city,
      decodeLocationText(profile.address),
      decodeLocationText(profile.konum),
      projectText,
      decodeLocationText(aboutDetails.location),
    ]
      .filter(Boolean)
      .join(" "),
    projectText,
  };
}

function inferProfessionalTypes(sources) {
  const exact = sanitizeAllowedArray(
    sources.legacyJobType.replace(/\s*-\s*/g, ",").replace(/\s*\/\s*/g, ","),
    PROFESSIONAL_TYPE_OPTIONS,
    PROFESSIONAL_LEGACY_MAP
  );
  if (exact.length) return exact.slice(0, 3);

  const text = sources.profileText;
  const out = [];
  if (hasAny(sources.businessName, ["iç mimarlık"])) addMatch(out, "İç Mimarlık Ofisi", PROFESSIONAL_TYPE_OPTIONS, 3);
  if (hasAny(sources.businessName, ["mimarlık"])) addMatch(out, "Mimarlık Firması", PROFESSIONAL_TYPE_OPTIONS, 3);
  if (hasAny(sources.displayName, ["iç mimar"])) addMatch(out, "İç Mimar", PROFESSIONAL_TYPE_OPTIONS, 3);
  if (hasAny(sources.displayName, ["mimar"])) addMatch(out, "Mimar", PROFESSIONAL_TYPE_OPTIONS, 3);

  const rules = [
    { value: "İç Mimar", when: (x) => hasAny(x, ["iç mimar"]) },
    { value: "İç Mimarlık Ofisi", when: (x) => hasAny(x, ["iç mimarlık"]) },
    { value: "İç Dekoratör", when: (x) => hasAny(x, ["dekorasyon"]) },
    { value: "Peyzaj Mimarı", when: (x) => hasAny(x, ["peyzaj"]) },
    { value: "Tadilat Firması", when: (x) => hasAny(x, ["tadilat"]) },
    { value: "İnşaat Firması", when: (x) => hasAny(x, ["inşaat"]) },
    { value: "Mobilya Üreticisi", when: (x) => hasAny(x, ["mobilya"]) && hasAny(x, ["üretim", "imalat"]) },
    { value: "Mobilya Mağazası", when: (x) => hasAny(x, ["mobilya"]) && hasAny(x, ["mağaza"]) },
    { value: "Mutfak Mobilyası Mağazası", when: (x) => hasAny(x, ["mutfak mobilya", "mutfak mobilyası"]) },
    { value: "3D Görselleştirme Uzmanı", when: (x) => hasAny(x, ["3d", "render", "görselleştirme"]) },
    { value: "Mimari Maket Hizmeti", when: (x) => hasAny(x, ["maket"]) },
    { value: "Aydınlatma Tasarımcısı", when: (x) => hasAny(x, ["aydınlatma"]) },
    { value: "Marangoz / Özel Mobilya", when: (x) => hasAny(x, ["marangoz"]) },
    { value: "Yapı Denetçisi", when: (x) => hasAny(x, ["yapı denetim", "yapı denetçisi"]) },
    { value: "Alüminyum Pencere Sistemleri", when: (x) => hasAny(x, ["alüminyum"]) && hasAny(x, ["pencere"]) },
    { value: "İnşaat Malzemesi Toptancısı", when: (x) => hasAny(x, ["malzeme"]) && hasAny(x, ["toptan", "toptancı"]) },
    { value: "Yapı Malzemeleri Mağazası", when: (x) => hasAny(x, ["yapı malzemeleri"]) },
  ];
  for (const value of inferByRules(text, rules, PROFESSIONAL_TYPE_OPTIONS, 3)) addMatch(out, value, PROFESSIONAL_TYPE_OPTIONS, 3);
  return out.slice(0, 3);
}

function inferServices(sources) {
  const exact = unique([
    ...sanitizeAllowedArray(sources.legacyServices, SERVICE_OPTIONS, SERVICE_LEGACY_MAP),
    ...sanitizeAllowedArray(sources.legacyProjectTypes, SERVICE_OPTIONS, SERVICE_LEGACY_MAP),
  ]);
  if (exact.length) return exact;

  const rules = [
    { value: "İç Mimari Tasarım", when: (x) => hasAny(x, ["iç mimari"]) },
    { value: "Mimari Proje", when: (x) => hasAny(x, ["mimari proje"]) },
    { value: "Dekorasyon Danışmanlığı", when: (x) => hasAny(x, ["dekorasyon"]) },
    { value: "Konsept Tasarım", when: (x) => hasAny(x, ["konsept"]) },
    { value: "3D Render / Görselleştirme", when: (x) => hasAny(x, ["3d", "render", "görselleştirme"]) },
    { value: "Moodboard Hazırlama", when: (x) => hasAny(x, ["moodboard"]) },
    { value: "Mobilya Yerleşim Planı", when: (x) => hasAny(x, ["yerleşim planı"]) },
    { value: "Renk & Malzeme Danışmanlığı", when: (x) => hasAny(x, ["renk"]) && hasAny(x, ["malzeme"]) },
    { value: "Aydınlatma Planı", when: (x) => hasAny(x, ["aydınlatma"]) },
    { value: "Tadilat", when: (x) => hasAny(x, ["tadilat"]) },
    { value: "Renovasyon", when: (x) => hasAny(x, ["renovasyon", "yenileme"]) },
    { value: "Anahtar Teslim Uygulama", when: (x) => hasAny(x, ["anahtar teslim"]) },
    { value: "Mutfak Yenileme", when: (x) => hasAny(x, ["mutfak yenileme"]) },
    { value: "Banyo Yenileme", when: (x) => hasAny(x, ["banyo yenileme"]) },
    { value: "Özel Mobilya Üretimi", when: (x) => hasAny(x, ["özel mobilya"]) },
    { value: "Mobilya Üretimi", when: (x) => hasAny(x, ["mobilya üretimi"]) },
    { value: "Mutfak Mobilyası Üretimi", when: (x) => hasAny(x, ["mutfak mobilyası"]) },
    { value: "Marangozluk", when: (x) => hasAny(x, ["marangoz"]) },
    { value: "Boya / Duvar Uygulaması", when: (x) => hasAny(x, ["boya", "duvar"]) },
    { value: "Zemin / Parke Uygulaması", when: (x) => hasAny(x, ["parke", "zemin"]) },
    { value: "Seramik / Fayans Uygulaması", when: (x) => hasAny(x, ["seramik", "fayans"]) },
    { value: "Elektrik Uygulaması", when: (x) => hasAny(x, ["elektrik"]) },
    { value: "Tesisat Uygulaması", when: (x) => hasAny(x, ["tesisat"]) },
    { value: "Peyzaj Tasarımı", when: (x) => hasAny(x, ["peyzaj"]) },
    { value: "Bahçe Düzenleme", when: (x) => hasAny(x, ["bahçe düzenleme"]) },
    { value: "Balkon / Teras Tasarımı", when: (x) => hasAny(x, ["balkon", "teras"]) },
    { value: "Dış Cephe Tasarımı", when: (x) => hasAny(x, ["dış cephe"]) },
    { value: "Havuz Tasarımı", when: (x) => hasAny(x, ["havuz"]) },
    { value: "Kış Bahçesi", when: (x) => hasAny(x, ["kış bahçesi"]) },
    { value: "Yapı Denetimi", when: (x) => hasAny(x, ["yapı denetim"]) },
    { value: "Teknik Proje Danışmanlığı", when: (x) => hasAny(x, ["danışmanlık"]) },
  ];
  return inferByRules(sources.profileText, rules, SERVICE_OPTIONS);
}

function inferProjectTypes(sources) {
  const exact = sanitizeAllowedArray(sources.legacyProjectTypes, PROJECT_TYPE_OPTIONS, PROJECT_LEGACY_MAP);
  if (exact.length) return exact;
  const rules = [
    { value: "Banyo Yenileme", when: (x) => hasAny(x, ["banyo"]) && hasAny(x, ["yenileme", "tadilat"]) },
    { value: "Mutfak Yenileme", when: (x) => hasAny(x, ["mutfak"]) && hasAny(x, ["yenileme", "tadilat"]) },
    { value: "İç Mimari Proje", when: (x) => hasAny(x, ["iç mimari"]) },
    { value: "Mimari Proje", when: (x) => hasAny(x, ["mimari"]) },
    { value: "Dekorasyon", when: (x) => hasAny(x, ["dekorasyon"]) },
    { value: "Tadilat / Renovasyon", when: (x) => hasAny(x, ["tadilat", "renovasyon", "yenileme"]) },
    { value: "Anahtar Teslim", when: (x) => hasAny(x, ["anahtar teslim"]) },
    { value: "Mobilya Tasarımı", when: (x) => hasAny(x, ["mobilya"]) },
    { value: "3D Tasarım / Render", when: (x) => hasAny(x, ["3d", "render"]) },
    { value: "Peyzaj / Bahçe", when: (x) => hasAny(x, ["peyzaj", "bahçe"]) },
    { value: "Ofis Tasarımı", when: (x) => hasAny(x, ["ofis"]) },
    { value: "Mağaza / Ticari Alan Tasarımı", when: (x) => hasAny(x, ["mağaza", "ticari", "restoran", "kafe", "otel", "klinik"]) },
    { value: "Danışmanlık", when: (x) => hasAny(x, ["danışmanlık"]) },
  ];
  return inferByRules(sources.profileText, rules, PROJECT_TYPE_OPTIONS);
}

function inferServiceAreas(sources) {
  const rules = [
    { value: "Salon", when: (x) => hasAny(x, ["salon"]) },
    { value: "Oturma Odası", when: (x) => hasAny(x, ["oturma odası"]) },
    { value: "Mutfak", when: (x) => hasAny(x, ["mutfak"]) },
    { value: "Banyo", when: (x) => hasAny(x, ["banyo"]) },
    { value: "Yatak Odası", when: (x) => hasAny(x, ["yatak odası"]) },
    { value: "Çocuk Odası", when: (x) => hasAny(x, ["çocuk odası"]) },
    { value: "Bebek Odası", when: (x) => hasAny(x, ["bebek odası"]) },
    { value: "Giyinme Odası", when: (x) => hasAny(x, ["giyinme odası"]) },
    { value: "Antre / Hol", when: (x) => hasAny(x, ["antre", "hol"]) },
    { value: "Koridor", when: (x) => hasAny(x, ["koridor"]) },
    { value: "Çalışma Odası", when: (x) => hasAny(x, ["çalışma odası"]) },
    { value: "Ev Ofis", when: (x) => hasAny(x, ["ev ofis"]) },
    { value: "Çamaşır Odası", when: (x) => hasAny(x, ["çamaşır odası"]) },
    { value: "Kiler / Depolama", when: (x) => hasAny(x, ["kiler", "depolama"]) },
    { value: "Bahçe", when: (x) => hasAny(x, ["bahçe"]) },
    { value: "Balkon", when: (x) => hasAny(x, ["balkon"]) },
    { value: "Teras", when: (x) => hasAny(x, ["teras"]) },
    { value: "Veranda", when: (x) => hasAny(x, ["veranda"]) },
    { value: "Havuz", when: (x) => hasAny(x, ["havuz"]) },
    { value: "Dış Cephe", when: (x) => hasAny(x, ["dış cephe"]) },
    { value: "Garaj / Otopark", when: (x) => hasAny(x, ["garaj", "otopark"]) },
    { value: "Kış Bahçesi", when: (x) => hasAny(x, ["kış bahçesi"]) },
    { value: "Ofis", when: (x) => hasAny(x, ["ofis"]) },
    { value: "Mağaza", when: (x) => hasAny(x, ["mağaza"]) },
    { value: "Kafe / Restoran", when: (x) => hasAny(x, ["kafe", "restoran"]) },
    { value: "Otel", when: (x) => hasAny(x, ["otel"]) },
    { value: "Klinik", when: (x) => hasAny(x, ["klinik"]) },
    { value: "Güzellik Salonu", when: (x) => hasAny(x, ["güzellik salonu"]) },
    { value: "Showroom", when: (x) => hasAny(x, ["showroom"]) },
    { value: "Stüdyo", when: (x) => hasAny(x, ["stüdyo", "studio"]) },
  ];
  return inferByRules(sources.profileText, rules, SERVICE_AREA_OPTIONS);
}

function inferStyleExpertise(sources) {
  const rules = [
    { value: "Modern", when: (x) => hasAny(x, ["modern"]) },
    { value: "Minimalist", when: (x) => hasAny(x, ["minimalist", "minimal"]) },
    { value: "Klasik", when: (x) => hasAny(x, ["klasik"]) },
    { value: "Lüks", when: (x) => hasAny(x, ["lüks", "luxury", "premium"]) },
    { value: "İskandinav", when: (x) => hasAny(x, ["iskandinav", "scandinavian"]) },
    { value: "Rustik", when: (x) => hasAny(x, ["rustik", "rustic"]) },
    { value: "Endüstriyel", when: (x) => hasAny(x, ["endüstriyel", "industrial"]) },
    { value: "Bohem", when: (x) => hasAny(x, ["bohem", "boho"]) },
    { value: "Akdeniz", when: (x) => hasAny(x, ["akdeniz", "mediterranean"]) },
    { value: "Japandi", when: (x) => hasAny(x, ["japandi"]) },
    { value: "Country", when: (x) => hasAny(x, ["country"]) },
    { value: "Retro", when: (x) => hasAny(x, ["retro"]) },
    { value: "Eklektik", when: (x) => hasAny(x, ["eklektik", "eclectic"]) },
    { value: "Çağdaş", when: (x) => hasAny(x, ["çağdaş", "contemporary"]) },
    { value: "Doğal / Organik", when: (x) => hasAny(x, ["doğal", "organik"]) },
    { value: "Sahil / Coastal", when: (x) => hasAny(x, ["sahil", "coastal"]) },
    { value: "Geleneksel", when: (x) => hasAny(x, ["geleneksel", "traditional"]) },
  ];
  return inferByRules(sources.profileText, rules, STYLE_OPTIONS);
}

function normalizeCity(value) {
  return normalizeCities(value)[0] || "";
}

function inferCitiesFromDistricts(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const out = [];
  for (const [city, districts] of Object.entries(DISTRICTS_BY_CITY)) {
    for (const district of districts || []) {
      if (normalizeText(district) === "merkez" || normalizeText(district).length < 4) continue;
      if (hasTerm(normalized, district)) addMatch(out, city, CITY_OPTIONS);
    }
  }
  return out;
}

function normalizeCities(value) {
  const direct = sanitizeAllowedArray(value, CITY_OPTIONS);
  const text = normalizeText(decodeLocationText(value));
  if (!text) return direct;
  const cityMatches = CITY_OPTIONS.filter((city) => hasTerm(text, city));
  return unique([...direct, ...cityMatches, ...inferCitiesFromDistricts(text)]);
}

function inferDistrict(city, sources) {
  if (!city) return "";
  const districts = DISTRICTS_BY_CITY[city] || [];
  const text = sources.locationText;
  return districts.find((district) => hasTerm(text, district)) || "";
}

function inferServiceRegions(city, sources) {
  const out = [];
  const text = sources.profileText;
  if (hasAny(text, ["türkiye geneli"])) addMatch(out, "Türkiye geneli", SERVICE_REGION_OPTIONS);
  if (hasAny(text, ["online", "uzaktan", "remote"])) addMatch(out, "Online hizmet veriyorum", SERVICE_REGION_OPTIONS);
  if (hasAny(text, ["yurt dışı", "global", "international"])) addMatch(out, "Yurt dışı hizmet veriyorum", SERVICE_REGION_OPTIONS);
  if (!out.length && city) addMatch(out, "Sadece bulunduğum şehir", SERVICE_REGION_OPTIONS);
  return out;
}

function inferStartingBudget(sources) {
  const raw = sources.legacyStartingPrice || sources.profileText;
  const normalized = normalizeText(raw);
  if (!normalized) return "";
  if (normalized.includes("proje bazli")) return "Proje bazlı değişir";
  const kMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  let amount = 0;
  if (kMatch) {
    amount = Number(kMatch[1].replace(",", ".")) * 1000;
  } else {
    const numberMatch = String(raw).match(/(\d[\d.,\s]*)/);
    if (numberMatch) {
      amount = Number(numberMatch[1].replace(/\D/g, ""));
    }
  }
  if (!amount) return "";
  if (amount <= 25000) return "₺0 - ₺25.000";
  if (amount <= 50000) return "₺25.000 - ₺50.000";
  if (amount <= 100000) return "₺50.000 - ₺100.000";
  if (amount <= 250000) return "₺100.000 - ₺250.000";
  if (amount <= 500000) return "₺250.000 - ₺500.000";
  if (amount <= 1000000) return "₺500.000 - ₺1.000.000";
  return "₺1.000.000+";
}

function inferWorkingModels(sources) {
  const rules = [
    { value: "Ücretsiz Ön Görüşme", when: (x) => hasAny(x, ["ücretsiz ön görüşme", "ücretsiz keşif"]) },
    { value: "Saatlik Danışmanlık", when: (x) => hasAny(x, ["saatlik"]) },
    { value: "Proje Bazlı Ücret", when: (x) => hasAny(x, ["proje bazlı"]) },
    { value: "m² Bazlı Ücret", when: (x) => hasAny(x, ["m2", "m²", "metrekare"]) },
    { value: "Paket Hizmet", when: (x) => hasAny(x, ["paket"]) },
    { value: "Anahtar Teslim", when: (x) => hasAny(x, ["anahtar teslim"]) },
    { value: "Teklif Üzerinden", when: (x) => hasAny(x, ["teklif"]) },
  ];
  return inferByRules(sources.profileText, rules, WORKING_MODEL_OPTIONS);
}

function inferTags(sources) {
  const exact = sanitizeAllowedArray(sources.legacyTags, TAG_OPTIONS);
  if (exact.length) return exact.slice(0, 10);
  const rules = [
    { value: "Küçük Alan Çözümü", when: (x) => hasAny(x, ["küçük alan"]) },
    { value: "Depolama Çözümü", when: (x) => hasAny(x, ["depolama"]) },
    { value: "Çocuk Dostu", when: (x) => hasAny(x, ["çocuk"]) },
    { value: "Evcil Hayvan Dostu", when: (x) => hasAny(x, ["evcil"]) },
    { value: "Lüks Proje", when: (x) => hasAny(x, ["lüks", "premium"]) },
    { value: "Bütçe Dostu", when: (x) => hasAny(x, ["bütçe", "ekonomik"]) },
    { value: "Hızlı Teslimat", when: (x) => hasAny(x, ["hızlı teslim", "hızlı"]) },
    { value: "Sürdürülebilir Tasarım", when: (x) => hasAny(x, ["sürdürülebilir", "sustainability"]) },
    { value: "Akıllı Ev", when: (x) => hasAny(x, ["akıllı ev"]) },
    { value: "Doğal Malzemeler", when: (x) => hasAny(x, ["doğal malzeme"]) },
    { value: "Özel Üretim", when: (x) => hasAny(x, ["özel üretim"]) },
    { value: "Kurumsal Proje", when: (x) => hasAny(x, ["kurumsal"]) },
    { value: "Teknik Danışmanlık", when: (x) => hasAny(x, ["teknik danışmanlık"]) },
    { value: "Malzeme Tedariği", when: (x) => hasAny(x, ["malzeme tedariği"]) },
    { value: "Üretici Firma", when: (x) => hasAny(x, ["üretici"]) },
    { value: "Mağaza / Showroom", when: (x) => hasAny(x, ["showroom", "mağaza"]) },
    { value: "Maket Hizmeti", when: (x) => hasAny(x, ["maket"]) },
    { value: "Pencere Sistemleri", when: (x) => hasAny(x, ["pencere"]) },
  ];
  return inferByRules(sources.profileText, rules, TAG_OPTIONS).slice(0, 10);
}

function requiredMissing(profileGeneral) {
  const missing = [];
  if (!isFilledString(profileGeneral.displayName)) missing.push("displayName");
  for (const key of ["professionalTypes", "services", "projectTypes", "serviceAreas", "serviceRegions"]) {
    if (!Array.isArray(profileGeneral[key]) || profileGeneral[key].length === 0) missing.push(key);
  }
  if (!isFilledString(profileGeneral.city) && (!Array.isArray(profileGeneral.cities) || profileGeneral.cities.length === 0)) {
    missing.push("city");
  }
  return missing;
}

function setStringField(key, current, inferred, next, log, sourceName) {
  if (isFilledString(current)) {
    next[key] = current.trim();
    log.fieldsSkippedBecauseAlreadyFilled.push(key);
    return;
  }
  if (isFilledString(inferred)) {
    next[key] = inferred.trim();
    log.fieldsFilled.push(key);
    if (sourceName) log.sourceFieldsUsed.push(sourceName);
  }
}

function setKnownStringField(key, current, inferred, allowed, next, log, sourceName) {
  const currentKnown = sanitizeAllowedArray(current, allowed)[0] || "";
  if (currentKnown) {
    next[key] = currentKnown;
    log.fieldsSkippedBecauseAlreadyFilled.push(key);
    if (stringValue(current) !== currentKnown) log.fieldsSanitized.push(key);
    return;
  }
  const inferredKnown = sanitizeAllowedArray(inferred, allowed)[0] || "";
  if (inferredKnown) {
    next[key] = inferredKnown;
    log.fieldsFilled.push(key);
    if (sourceName) log.sourceFieldsUsed.push(sourceName);
  } else if (isFilledString(current)) {
    next[key] = current.trim();
    log.fieldsSkippedBecauseAlreadyFilled.push(key);
  }
}

function setArrayField(key, current, inferred, allowed, next, log, sourceName) {
  const sanitizedCurrent = sanitizeAllowedArray(current, allowed);
  if (sanitizedCurrent.length) {
    next[key] = sanitizedCurrent;
    log.fieldsSkippedBecauseAlreadyFilled.push(key);
    if (JSON.stringify(arrayFromUnknown(current)) !== JSON.stringify(sanitizedCurrent)) log.fieldsSanitized.push(key);
    return;
  }
  const sanitizedInferred = sanitizeAllowedArray(inferred, allowed);
  if (sanitizedInferred.length) {
    next[key] = sanitizedInferred;
    log.fieldsFilled.push(key);
    if (sourceName) log.sourceFieldsUsed.push(sourceName);
  } else {
    next[key] = [];
  }
}

function migrateProfile(profile, projects) {
  const aboutDetails = toRecord(profile.about_details);
  const profileGeneral = toRecord(aboutDetails.profileGeneral);
  const sources = sourceText(profile, aboutDetails, profileGeneral, projects);
  const nextGeneral = { ...profileGeneral };
  const log = {
    scriptVersion: SCRIPT_VERSION,
    migratedAt: new Date().toISOString(),
    fieldsFilled: [],
    fieldsSanitized: [],
    fieldsSkippedBecauseAlreadyFilled: [],
    lowConfidenceFields: [],
    sourceFieldsUsed: [],
  };

  setStringField("displayName", profileGeneral.displayName, sources.displayName, nextGeneral, log, "full_name");
  setStringField("businessName", profileGeneral.businessName, sources.businessName, nextGeneral, log, "business_name");
  setStringField("profileImageUrl", profileGeneral.profileImageUrl, sources.profileImageUrl, nextGeneral, log, "avatar_url");

  setArrayField(
    "professionalTypes",
    profileGeneral.professionalTypes ?? aboutDetails.professionalTypes,
    inferProfessionalTypes(sources),
    PROFESSIONAL_TYPE_OPTIONS,
    nextGeneral,
    log,
    "legacyJobType/profile text"
  );
  setArrayField(
    "services",
    profileGeneral.services ?? aboutDetails.services,
    inferServices(sources),
    SERVICE_OPTIONS,
    nextGeneral,
    log,
    "legacyServices/profile text"
  );
  setArrayField(
    "projectTypes",
    profileGeneral.projectTypes ?? aboutDetails.projectTypes,
    inferProjectTypes(sources),
    PROJECT_TYPE_OPTIONS,
    nextGeneral,
    log,
    "legacyProjectTypes/project text"
  );
  setArrayField(
    "serviceAreas",
    profileGeneral.serviceAreas ?? aboutDetails.serviceAreas,
    inferServiceAreas(sources),
    SERVICE_AREA_OPTIONS,
    nextGeneral,
    log,
    "project/profile text"
  );
  setArrayField(
    "styleExpertise",
    profileGeneral.styleExpertise ?? aboutDetails.styleExpertise,
    inferStyleExpertise(sources),
    STYLE_OPTIONS,
    nextGeneral,
    log,
    "project/profile text"
  );

  const cityCurrent = firstNonEmpty(profileGeneral.city, aboutDetails.city);
  const inferredCities = unique([
    ...normalizeCities(profileGeneral.cities),
    ...normalizeCities(cityCurrent),
    ...normalizeCities(profile.city),
    ...normalizeCities(sources.locationText),
  ]);
  setArrayField("cities", profileGeneral.cities, inferredCities, CITY_OPTIONS, nextGeneral, log, "city/location");

  const inferredCity = nextGeneral.cities?.[0] || normalizeCity(cityCurrent || profile.city || sources.locationText);
  setKnownStringField("city", cityCurrent, inferredCity, CITY_OPTIONS, nextGeneral, log, "city/location");
  if ((!Array.isArray(nextGeneral.cities) || nextGeneral.cities.length === 0) && nextGeneral.city) {
    nextGeneral.cities = [nextGeneral.city];
    log.fieldsFilled.push("cities");
  }

  const districtCurrent = firstNonEmpty(profileGeneral.district, aboutDetails.district);
  const inferredDistrict = inferDistrict(nextGeneral.city, sources);
  setKnownStringField(
    "district",
    districtCurrent,
    inferredDistrict,
    DISTRICTS_BY_CITY[nextGeneral.city] || [],
    nextGeneral,
    log,
    "address/location"
  );

  setArrayField(
    "serviceRegions",
    profileGeneral.serviceRegions ?? aboutDetails.serviceRegions,
    inferServiceRegions(nextGeneral.city, sources),
    SERVICE_REGION_OPTIONS,
    nextGeneral,
    log,
    "city/profile text"
  );

  const budgetCurrent = firstNonEmpty(profileGeneral.startingBudget, aboutDetails.startingBudget);
  const inferredBudget = sanitizeAllowedArray(budgetCurrent || inferStartingBudget(sources), STARTING_BUDGET_OPTIONS)[0] || "";
  setKnownStringField(
    "startingBudget",
    budgetCurrent,
    inferredBudget,
    STARTING_BUDGET_OPTIONS,
    nextGeneral,
    log,
    "starting_from"
  );

  setArrayField(
    "workingModels",
    profileGeneral.workingModels ?? aboutDetails.workingModels,
    inferWorkingModels(sources),
    WORKING_MODEL_OPTIONS,
    nextGeneral,
    log,
    "profile text"
  );
  setArrayField("tags", profileGeneral.tags, inferTags(sources), TAG_OPTIONS, nextGeneral, log, "tags/profile text");

  if (!isFilledString(nextGeneral.legacyJobType) && isFilledString(sources.legacyJobType)) {
    nextGeneral.legacyJobType = sources.legacyJobType;
    log.fieldsFilled.push("legacyJobType");
  }
  if (!isFilledString(nextGeneral.legacyProjectTypes) && isFilledString(sources.legacyProjectTypes)) {
    nextGeneral.legacyProjectTypes = sources.legacyProjectTypes;
    log.fieldsFilled.push("legacyProjectTypes");
  }
  if (!isFilledString(nextGeneral.legacyServices) && isFilledString(sources.legacyServices)) {
    nextGeneral.legacyServices = sources.legacyServices;
    log.fieldsFilled.push("legacyServices");
  }
  if (!isFilledString(nextGeneral.legacyTags) && isFilledString(sources.legacyTags)) {
    nextGeneral.legacyTags = sources.legacyTags;
    log.fieldsFilled.push("legacyTags");
  }
  if (!isFilledString(nextGeneral.legacyStartingPrice) && isFilledString(sources.legacyStartingPrice)) {
    nextGeneral.legacyStartingPrice = sources.legacyStartingPrice;
    log.fieldsFilled.push("legacyStartingPrice");
  }

  const missing = requiredMissing(nextGeneral);
  log.lowConfidenceFields.push(...missing);
  log.fieldsFilled = unique(log.fieldsFilled);
  log.fieldsSanitized = unique(log.fieldsSanitized);
  log.fieldsSkippedBecauseAlreadyFilled = unique(log.fieldsSkippedBecauseAlreadyFilled);
  log.lowConfidenceFields = unique(log.lowConfidenceFields);
  log.sourceFieldsUsed = unique(log.sourceFieldsUsed);

  const nextAboutDetails = {
    ...aboutDetails,
    profileGeneral: nextGeneral,
    profileGeneralIncompleteFields: missing,
  };

  const changed = JSON.stringify(aboutDetails) !== JSON.stringify(nextAboutDetails);
  if (changed) nextAboutDetails.profileGeneralMigrationLog = log;

  return { changed, aboutDetails, nextAboutDetails, log, missing };
}

async function fetchAll(table, select, applyQuery = (query) => query) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    let query = supabase.from(table).select(select).range(from, from + pageSize - 1);
    query = applyQuery(query);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    if (LIMIT && rows.length >= LIMIT) break;
  }
  return LIMIT ? rows.slice(0, LIMIT) : rows;
}

async function main() {
  console.log(`${DRY_RUN ? "DRY RUN" : "APPLY"} ${SCRIPT_VERSION}`);

  const profiles = await fetchAll("profiles", "*", (query) => {
    let next = query.in("role", ["designer", "designer_pending"]);
    if (ONLY_ID) next = next.eq("id", ONLY_ID);
    return next;
  });
  const projects = await fetchAll(
    "designer_projects",
    "id, designer_id, title, project_type, location, description, tags, budget_level",
    (query) => (ONLY_ID ? query.eq("designer_id", ONLY_ID) : query)
  );
  const projectsByDesigner = new Map();
  for (const project of projects) {
    const list = projectsByDesigner.get(project.designer_id) || [];
    list.push(project);
    projectsByDesigner.set(project.designer_id, list);
  }

  const results = [];
  const fieldCounts = new Map();
  const sanitizedCounts = new Map();
  const missingCounts = new Map();

  for (const profile of profiles) {
    const result = migrateProfile(profile, projectsByDesigner.get(profile.id) || []);
    if (!result.changed) continue;
    results.push({ profile, ...result });
    for (const field of result.log.fieldsFilled) fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
    for (const field of result.log.fieldsSanitized) sanitizedCounts.set(field, (sanitizedCounts.get(field) || 0) + 1);
    for (const field of result.missing) missingCounts.set(field, (missingCounts.get(field) || 0) + 1);
  }

  console.log(`Profiles scanned: ${profiles.length}`);
  console.log(`Profiles needing update: ${results.length}`);
  console.log("Fields filled:", Object.fromEntries([...fieldCounts.entries()].sort()));
  console.log("Fields sanitized:", Object.fromEntries([...sanitizedCounts.entries()].sort()));
  console.log("Required fields still missing:", Object.fromEntries([...missingCounts.entries()].sort()));

  const sample = results.slice(0, 10).map(({ profile, log, missing }) => ({
    id: profile.id,
    name: profile.full_name || profile.business_name || "",
    fieldsFilled: log.fieldsFilled,
    fieldsSanitized: log.fieldsSanitized,
    missing,
  }));
  if (sample.length) console.log("Sample:", JSON.stringify(sample, null, 2));

  if (DRY_RUN) {
    console.log("Dry-run complete. Re-run with --apply to update Supabase.");
    return;
  }

  if (!results.length) {
    console.log("Nothing to update.");
    return;
  }

  const backupDir = path.join(process.cwd(), "migration-backups");
  await mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `profile-general-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(
    backupPath,
    JSON.stringify(
      results.map(({ profile, aboutDetails, nextAboutDetails, log }) => ({
        id: profile.id,
        full_name: profile.full_name,
        before_about_details: aboutDetails,
        after_about_details: nextAboutDetails,
        migrationLog: log,
      })),
      null,
      2
    )
  );
  console.log(`Backup written: ${backupPath}`);

  let updated = 0;
  for (const { profile, nextAboutDetails } of results) {
    const { error } = await supabase
      .from("profiles")
      .update({ about_details: nextAboutDetails })
      .eq("id", profile.id);
    if (error) throw error;
    updated += 1;
    if (updated % 25 === 0) console.log(`Updated ${updated}/${results.length}`);
  }
  console.log(`Updated ${updated} profiles.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
