"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AppRole = "homeowner" | "designer" | "designer_pending" | null;
type ListingType = "need_service" | "offer_service";
type ListingStatus = "draft" | "published" | "closed";
type ListingViewMode = "open" | "mine" | "shortlists";
type NeededWithin = "hemen" | "1_ay" | "3_ay" | "arastiriyorum";
type ApplicationStatus = "pending" | "shortlisted" | "rejected" | "accepted";

type ListingRow = {
  id: string;
  owner_id: string;
  owner_role: string | null;
  listing_type: ListingType;
  title: string;
  description: string;
  city: string;
  district: string | null;
  budget_min: number | null;
  budget_max: number | null;
  needed_professions: string[] | null;
  tags: string[] | null;
  needed_within: NeededWithin | null;
  status: ListingStatus;
  is_urgent: boolean | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type ListingApplicationRow = {
  id: string;
  listing_id: string;
  applicant_id: string;
  message: string;
  price_quote: string | null;
  timeline: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};

type ProfileBrief = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  avatar_url?: string | null;
  role: string | null;
};

type RatingStatRow = {
  designer_id: string;
  average_rating: number | string | null;
  review_count: number | string | null;
};

type CreateListingForm = {
  listingType: ListingType;
  status: ListingStatus;
  title: string;
  description: string;
  city: string;
  district: string;
  budgetMin: string;
  budgetMax: string;
  professions: string[];
  tags: string;
  neededWithin: NeededWithin;
  isUrgent: boolean;
};

type ApplicationDraft = {
  message: string;
  priceQuote: string;
  timeline: string;
};

const INITIAL_FORM: CreateListingForm = {
  listingType: "need_service",
  status: "published",
  title: "",
  description: "",
  city: "",
  district: "",
  budgetMin: "",
  budgetMax: "",
  professions: [],
  tags: "",
  neededWithin: "hemen",
  isUrgent: false,
};

const PROFESSION_OPTIONS = [
  "Mimar",
  "İç Mimar",
  "Peyzaj Mimarı",
  "İnşaat Mühendisi",
  "Elektrik Mühendisi",
  "Makine Mühendisi",
  "Harita Mühendisi",
  "3D Görselleştirme / Render Uzmanı",
  "Müteahhit / Anahtar Teslim İnşaat",
  "Komple Ev / Ofis Tadilatı",
  "Şantiye Şefi / Sorumlusu",
  "Yıkım, Kırım ve Hafriyat",
  "Boya ve Badana Ustası",
  "Elektrik Ustası",
  "Su Tesisat Ustası",
  "Doğalgaz ve Kalorifer Ustası",
  "Alçıpan, Kartonpiyer ve Asma Tavan Ustası",
  "Fayans, Seramik ve Mermer Ustası",
  "Marangoz ve Özel Mobilya Ustası",
  "Parke ve Zemin Kaplama Ustası",
  "Çatı ve Oluk Ustası",
  "İzolasyon ve Yalıtım Ustası",
  "Demir Doğrama ve Kaynak Ustası",
  "PVC, Alüminyum ve Cam Ustası",
  "Duvar ve Sıva Ustası",
  "İnşaat Sonrası Temizlik Şirketi",
  "Nakliye ve Moloz Atımı",
  "Akıllı Ev Sistemleri Kurulumu",
  "Güvenlik Sistemleri ve Kamera Kurulumu",
  "Diğer",
];

const TURKIYE_ILLERI = [
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Aksaray",
  "Amasya",
  "Ankara",
  "Antalya",
  "Ardahan",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bartın",
  "Batman",
  "Bayburt",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Düzce",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkari",
  "Hatay",
  "Iğdır",
  "Isparta",
  "İstanbul",
  "İzmir",
  "Kahramanmaraş",
  "Karabük",
  "Karaman",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırıkkale",
  "Kırklareli",
  "Kırşehir",
  "Kilis",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Mardin",
  "Mersin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Osmaniye",
  "Rize",
  "Sakarya",
  "Samsun",
  "Şanlıurfa",
  "Siirt",
  "Sinop",
  "Sivas",
  "Şırnak",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Uşak",
  "Van",
  "Yalova",
  "Yozgat",
  "Zonguldak",
];

const ILCELER_BY_IL: Partial<Record<string, string[]>> = {
  Adana: ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  Ankara: ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  Antalya: ["Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  Bursa: ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
  Diyarbakır: ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"],
  Erzurum: ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"],
  Eskişehir: ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"],
  Gaziantep: ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"],
  Hatay: ["Altınözü", "Antakya", "Arsuz", "Belen", "Defne", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
  Kayseri: ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"],
  Kocaeli: ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
  Konya: ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"],
  Mersin: ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"],
  "Muğla": ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"],
  Samsun: ["19 Mayıs", "Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "İlkadım", "Kavak", "Ladik", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"],
  "Şanlıurfa": ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"],
  Tekirdağ: ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Süleymanpaşa", "Şarköy"],
  Trabzon: ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"],
};

function getDistrictOptions(city: string) {
  const trimmed = city.trim();
  if (!trimmed) return [] as string[];
  const options = ILCELER_BY_IL[trimmed];
  return options && options.length > 0 ? options : ["Merkez"];
}

function normalizeRole(raw: unknown): AppRole {
  if (raw === "homeowner" || raw === "designer" || raw === "designer_pending") return raw;
  return null;
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .trim();
}

function normalizeListingNumber(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function listingNumberFromId(id: string) {
  return normalizeListingNumber(id).slice(0, 8);
}

function splitCsv(value: string) {
  return value
    .split(/\r?\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMoney(value: string) {
  if (!value.trim()) return null;
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Number(parsed.toFixed(2));
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMoneyLabel(min: number | null, max: number | null) {
  if (typeof min === "number" && typeof max === "number") {
    return `${min.toLocaleString("tr-TR")} ₺ - ${max.toLocaleString("tr-TR")} ₺`;
  }
  if (typeof min === "number") return `${min.toLocaleString("tr-TR")} ₺ ve üzeri`;
  if (typeof max === "number") return `${max.toLocaleString("tr-TR")} ₺ altı`;
  return "Bütçe belirtilmedi";
}

function listingTypeLabel(type: ListingType) {
  return type === "need_service" ? "Hizmet Aranıyor" : "Hizmet Veriliyor";
}

function listingStatusLabel(status: ListingStatus) {
  if (status === "draft") return "Taslak";
  if (status === "published") return "Yayında";
  return "Kapalı";
}

function neededWithinLabel(value: NeededWithin | null | undefined) {
  if (value === "1_ay") return "1 ay içerisinde";
  if (value === "3_ay") return "3 ay içerisinde";
  if (value === "arastiriyorum") return "Sadece araştırıyorum";
  return "Hemen";
}

function applicationStatusLabel(status: ApplicationStatus) {
  if (status === "shortlisted") return "Kısa Liste";
  if (status === "rejected") return "Reddedildi";
  if (status === "accepted") return "Kabul Edildi";
  return "Beklemede";
}

function firstName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "Kullanıcı";
  return trimmed.split(/\s+/)[0] || "Kullanıcı";
}

function profileDisplayName(profile: ProfileBrief | undefined, fallback: string) {
  if (!profile) return fallback;
  return profile.full_name?.trim() || profile.business_name?.trim() || fallback;
}

function professionalProfileHref(userId: string, role: string | null | undefined) {
  if (role !== "designer" && role !== "designer_pending") return null;
  return `/tasarimcilar/supa_${encodeURIComponent(userId)}`;
}

function ratingLabel(average: number, count: number) {
  return `⭐ ${average.toFixed(1)} · ${count} değerlendirme`;
}

function isMissingListingsSchemaError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find the table") &&
    (normalized.includes("public.listings") ||
      normalized.includes("public.listing_applications") ||
      normalized.includes("public.listing_bookmarks"))
  );
}

export default function ListingsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [applications, setApplications] = useState<ListingApplicationRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileBrief>>({});
  const [ratingStatsByDesignerId, setRatingStatsByDesignerId] = useState<
    Record<string, { average: number; count: number }>
  >({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<CreateListingForm>(INITIAL_FORM);
  const [applyDrafts, setApplyDrafts] = useState<Record<string, ApplicationDraft>>({});
  const [activeApplyListingId, setActiveApplyListingId] = useState<string | null>(null);
  const [openApplicationsListingId, setOpenApplicationsListingId] = useState<string | null>(null);
  const [activeContactApplicationId, setActiveContactApplicationId] = useState<string | null>(null);
  const [contactDrafts, setContactDrafts] = useState<Record<string, string>>({});
  const [sendingContactApplicationId, setSendingContactApplicationId] = useState<string | null>(null);
  const [activeDirectMessageListingId, setActiveDirectMessageListingId] = useState<string | null>(null);
  const [directMessageDrafts, setDirectMessageDrafts] = useState<Record<string, string>>({});
  const [sendingDirectMessageListingId, setSendingDirectMessageListingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ListingType>("all");
  const [professionFilters, setProfessionFilters] = useState<string[]>([]);
  const [selectedProfessionFilter, setSelectedProfessionFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ListingViewMode>("open");
  const [selectedProfession, setSelectedProfession] = useState("");
  const [pendingListingNumber, setPendingListingNumber] = useState<string | null>(null);

  async function loadAll({ silent = false }: { silent?: boolean } = {}) {
    const supabase = getSupabaseBrowserClient();
    if (!silent) {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }

    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id ?? null;
    setUserId(uid);

    if (uid) {
      const { data: meProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .maybeSingle();
      setRole(normalizeRole(meProfile?.role ?? authData.user?.user_metadata?.role));
    } else {
      setRole(null);
    }

    const { data: listingRows, error: listingError } = await supabase
      .from("listings")
      .select(
        "id, owner_id, owner_role, listing_type, title, description, city, district, budget_min, budget_max, needed_professions, tags, needed_within, status, is_urgent, expires_at, created_at, updated_at"
      )
      .order("is_urgent", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(120);

    if (listingError) {
      if (isMissingListingsSchemaError(listingError.message)) {
        setError("İlanlar şeması henüz güncellenmemiş. Supabase schema.sql dosyasını çalıştırıp tekrar dene.");
      } else {
        setError(listingError.message);
      }
      setListings([]);
      setApplications([]);
      setProfilesById({});
      setBookmarkedIds(new Set());
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const nextListings = (listingRows ?? []) as ListingRow[];
    setListings(nextListings);

    const listingIds = nextListings.map((listing) => listing.id);
    let nextApplications: ListingApplicationRow[] = [];
    let nextBookmarks = new Set<string>();

    if (uid && listingIds.length > 0) {
      const [{ data: applicationRows, error: applicationsError }, { data: bookmarkRows }] = await Promise.all([
        supabase
          .from("listing_applications")
          .select("id, listing_id, applicant_id, message, price_quote, timeline, status, created_at, updated_at")
          .in("listing_id", listingIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("listing_bookmarks")
          .select("listing_id")
          .eq("user_id", uid)
          .in("listing_id", listingIds),
      ]);

      if (applicationsError) {
        setError(applicationsError.message);
      } else {
        nextApplications = (applicationRows ?? []) as ListingApplicationRow[];
      }

      nextBookmarks = new Set(
        (bookmarkRows ?? [])
          .map((row) => row.listing_id as string)
          .filter(Boolean)
      );
    }

    setApplications(nextApplications);
    setBookmarkedIds(nextBookmarks);

    const profileIds = Array.from(
      new Set([
        ...nextListings.map((listing) => listing.owner_id),
        ...nextApplications.map((application) => application.applicant_id),
      ])
    );

    if (uid && profileIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase.rpc("get_profile_briefs", {
        user_ids: profileIds,
      });

      if (!profileError && Array.isArray(profileRows)) {
        const nextProfiles: Record<string, ProfileBrief> = {};
        for (const row of profileRows as ProfileBrief[]) {
          nextProfiles[row.id] = row;
        }
        setProfilesById(nextProfiles);
      } else {
        setProfilesById({});
      }
    } else {
      setProfilesById({});
    }

    if (profileIds.length > 0) {
      const { data: ratingRows, error: ratingError } = await supabase.rpc("get_designer_rating_stats", {
        designer_ids: profileIds,
      });

      if (!ratingError && Array.isArray(ratingRows)) {
        const nextRatingStats: Record<string, { average: number; count: number }> = {};
        for (const row of ratingRows as RatingStatRow[]) {
          const averageRaw =
            typeof row.average_rating === "number"
              ? row.average_rating
              : Number.parseFloat(String(row.average_rating ?? "0"));
          const countRaw =
            typeof row.review_count === "number"
              ? row.review_count
              : Number.parseInt(String(row.review_count ?? "0"), 10);

          if (!Number.isFinite(averageRaw) || !Number.isFinite(countRaw) || countRaw < 1) continue;
          nextRatingStats[row.designer_id] = {
            average: Number(averageRaw.toFixed(1)),
            count: Math.max(0, countRaw),
          };
        }
        setRatingStatsByDesignerId(nextRatingStats);
      } else {
        setRatingStatsByDesignerId({});
      }
    } else {
      setRatingStatsByDesignerId({});
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const listingNo = normalizeListingNumber(url.searchParams.get("ilanNo") ?? "");
    if (!listingNo) return;

    setViewMode("open");
    setTypeFilter("all");
    setCityFilter("");
    setDistrictFilter("");
    setQuery(listingNo);
    setPendingListingNumber(listingNo);
  }, []);

  const visibleListings = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    const normalizedCity = normalizeText(cityFilter);
    const normalizedDistrict = normalizeText(districtFilter);
    const normalizedProfessions = professionFilters.map((profession) => normalizeText(profession));
    const isMineView = Boolean(userId && viewMode === "mine");

    return listings.filter((listing) => {
      if (isMineView) {
        if (listing.owner_id !== userId) return false;
      } else if (listing.status !== "published") {
        return false;
      }

      if (typeFilter !== "all" && listing.listing_type !== typeFilter) return false;
      if (normalizedCity && normalizeText(listing.city) !== normalizedCity) return false;
      if (normalizedDistrict && normalizeText(listing.district ?? "") !== normalizedDistrict) return false;
      if (
        normalizedProfessions.length > 0 &&
        !(listing.needed_professions ?? []).some(
          (item) => normalizedProfessions.includes(normalizeText(item))
        )
      ) {
        return false;
      }

      if (!normalizedQuery) return true;
      const haystack = normalizeText(
        [
          listingNumberFromId(listing.id),
          listing.title,
          listing.description,
          listing.city,
          listing.district ?? "",
          ...(listing.needed_professions ?? []),
          ...(listing.tags ?? []),
        ].join(" ")
      );
      return haystack.includes(normalizedQuery);
    });
  }, [cityFilter, districtFilter, listings, professionFilters, query, typeFilter, userId, viewMode]);

  const listingsById = useMemo(() => {
    const mapped: Record<string, ListingRow> = {};
    for (const listing of listings) {
      mapped[listing.id] = listing;
    }
    return mapped;
  }, [listings]);

  const applicationsByListing = useMemo(() => {
    const mapped: Record<string, ListingApplicationRow[]> = {};
    for (const application of applications) {
      const current = mapped[application.listing_id] ?? [];
      current.push(application);
      mapped[application.listing_id] = current;
    }
    return mapped;
  }, [applications]);

  const myListings = useMemo(
    () => (userId ? listings.filter((listing) => listing.owner_id === userId) : []),
    [listings, userId]
  );

  const activeViewMode: ListingViewMode = userId ? viewMode : "open";
  const isProfessionalUser = role === "designer" || role === "designer_pending";

  const shortlistedApplications = useMemo(() => {
    if (!userId) return [] as Array<{ listing: ListingRow; application: ListingApplicationRow }>;

    return applications
      .filter((application) => {
        if (application.status !== "shortlisted") return false;
        const listing = listingsById[application.listing_id];
        return Boolean(listing && listing.owner_id === userId);
      })
      .map((application) => ({
        listing: listingsById[application.listing_id] as ListingRow,
        application,
      }))
      .sort(
        (a, b) =>
          new Date(b.application.updated_at || b.application.created_at).getTime() -
          new Date(a.application.updated_at || a.application.created_at).getTime()
      );
  }, [applications, listingsById, userId]);

  const displayedListings = useMemo(
    () =>
      activeViewMode === "mine"
        ? visibleListings.filter((listing) => listing.owner_id === userId)
        : visibleListings,
    [activeViewMode, userId, visibleListings]
  );

  useEffect(() => {
    if (!pendingListingNumber || listings.length === 0) return;
    const target = listings.find(
      (listing) => listingNumberFromId(listing.id) === pendingListingNumber
    );
    if (!target) return;

    const element = document.getElementById(`listing-${target.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setPendingListingNumber(null);
  }, [listings, pendingListingNumber]);

  const filterDistrictOptions = useMemo(() => getDistrictOptions(cityFilter), [cityFilter]);
  const formCityOptions = useMemo(() => {
    if (!form.city || TURKIYE_ILLERI.includes(form.city)) return TURKIYE_ILLERI;
    return [form.city, ...TURKIYE_ILLERI];
  }, [form.city]);
  const formDistrictOptions = useMemo(() => {
    const options = getDistrictOptions(form.city);
    if (form.district && !options.includes(form.district)) {
      return [...options, form.district];
    }
    return options;
  }, [form.city, form.district]);

  function startEditingListing(listing: ListingRow) {
    setForm({
      listingType: listing.listing_type,
      status: listing.status,
      title: listing.title,
      description: listing.description,
      city: listing.city,
      district: listing.district ?? "",
      budgetMin: typeof listing.budget_min === "number" ? String(listing.budget_min) : "",
      budgetMax: typeof listing.budget_max === "number" ? String(listing.budget_max) : "",
      professions: listing.needed_professions ?? [],
      tags: (listing.tags ?? []).join(", "),
      neededWithin: listing.needed_within ?? "hemen",
      isUrgent: Boolean(listing.is_urgent),
    });
    setSelectedProfession("");
    setEditingListingId(listing.id);
    setIsCreateOpen(true);
    setError(null);
    setNotice(null);
  }

  function closeCreatePanel() {
    setIsCreateOpen(false);
    setEditingListingId(null);
    setForm(INITIAL_FORM);
    setSelectedProfession("");
  }

  async function handleCreateListing(event: FormEvent) {
    event.preventDefault();
    if (!userId) {
      setError("İlan açmak için giriş yapman gerekiyor.");
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const city = form.city.trim();

    if (title.length < 5) {
      setError("İlan başlığı en az 5 karakter olmalı.");
      return;
    }
    if (description.length < 10) {
      setError("Açıklama en az 10 karakter olmalı.");
      return;
    }
    if (city.length < 2) {
      setError("Şehir bilgisi zorunlu.");
      return;
    }

    const budgetMin = parseMoney(form.budgetMin);
    const budgetMax = parseMoney(form.budgetMax);
    if (
      typeof budgetMin === "number" &&
      typeof budgetMax === "number" &&
      budgetMin > budgetMax
    ) {
      setError("Minimum bütçe, maksimum bütçeden büyük olamaz.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    const supabase = getSupabaseBrowserClient();
    const neededProfessions = form.professions;
    const tags = splitCsv(form.tags);
    const payload = {
      listing_type: form.listingType,
      title,
      description,
      city,
      district: form.district.trim() || null,
      budget_min: budgetMin,
      budget_max: budgetMax,
      needed_professions: neededProfessions,
      tags,
      needed_within: form.neededWithin,
      status: form.status,
      is_urgent: form.isUrgent,
    };
    const isEditing = Boolean(editingListingId);

    if (isEditing) {
      const { error: updateError } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", editingListingId);

      if (updateError) {
        setError(updateError.message);
        setSubmitting(false);
        return;
      }

      setNotice("İlan güncellendi.");
    } else {
      const { error: insertError } = await supabase.from("listings").insert({
        owner_id: userId,
        owner_role: role ?? "homeowner",
        ...payload,
      });

      if (insertError) {
        setError(insertError.message);
        setSubmitting(false);
        return;
      }

      setNotice(form.status === "draft" ? "İlan taslak olarak kaydedildi." : "İlan yayınlandı.");
    }

    closeCreatePanel();
    setSubmitting(false);
    await loadAll({ silent: true });
  }

  async function handleListingStatus(listingId: string, nextStatus: ListingStatus) {
    setError(null);
    setNotice(null);
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("listings")
      .update({ status: nextStatus })
      .eq("id", listingId);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setNotice(`İlan durumu güncellendi: ${listingStatusLabel(nextStatus)}.`);
    await loadAll({ silent: true });
  }

  async function toggleBookmark(listingId: string) {
    if (!userId) {
      setError("İlan kaydetmek için giriş yapman gerekiyor.");
      return;
    }

    setError(null);
    const supabase = getSupabaseBrowserClient();
    const isSaved = bookmarkedIds.has(listingId);
    if (isSaved) {
      const { error: removeError } = await supabase
        .from("listing_bookmarks")
        .delete()
        .eq("listing_id", listingId)
        .eq("user_id", userId);
      if (removeError) {
        setError(removeError.message);
        return;
      }
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
      return;
    }

    const { error: insertError } = await supabase.from("listing_bookmarks").insert({
      listing_id: listingId,
      user_id: userId,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setBookmarkedIds((prev) => new Set(prev).add(listingId));
  }

  function getApplyDraft(listingId: string): ApplicationDraft {
    return (
      applyDrafts[listingId] ?? {
        message: "",
        priceQuote: "",
        timeline: "",
      }
    );
  }

  async function handleSendApplication(listingId: string) {
    if (!userId) {
      setError("Başvuru yapmak için giriş yapman gerekiyor.");
      return;
    }
    if (!isProfessionalUser) {
      setError("İlanlara başvuru yapmak için profesyonel hesap gerekli.");
      return;
    }
    const listing = listingsById[listingId];
    if (!listing) return;
    if (listing.listing_type !== "need_service") {
      setError("Bu ilanda başvuru yerine doğrudan mesaj atmalısın.");
      return;
    }

    const draft = getApplyDraft(listingId);
    if (draft.message.trim().length < 5) {
      setError("Başvuru mesajı en az 5 karakter olmalı.");
      return;
    }

    setError(null);
    setNotice(null);
    const supabase = getSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("listing_applications").insert({
      listing_id: listingId,
      applicant_id: userId,
      message: draft.message.trim(),
      price_quote: draft.priceQuote.trim() || null,
      timeline: draft.timeline.trim() || null,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("Bu ilana zaten başvurdun.");
      } else {
        setError(insertError.message);
      }
      return;
    }

    setApplyDrafts((prev) => ({
      ...prev,
      [listingId]: {
        message: "",
        priceQuote: "",
        timeline: "",
      },
    }));
    setActiveApplyListingId(null);
    setNotice("Başvurun gönderildi.");
    await loadAll({ silent: true });
  }

  async function handleApplicationStatus(applicationId: string, nextStatus: ApplicationStatus) {
    setError(null);
    setNotice(null);
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("listing_applications")
      .update({ status: nextStatus })
      .eq("id", applicationId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice(`Başvuru durumu güncellendi: ${applicationStatusLabel(nextStatus)}.`);
    await loadAll({ silent: true });
  }

  function getContactDraft(applicationId: string) {
    return contactDrafts[applicationId] ?? "";
  }

  function getDirectMessageDraft(listingId: string) {
    return directMessageDrafts[listingId] ?? "";
  }

  async function handleSendAcceptedMessage(listing: ListingRow, application: ListingApplicationRow) {
    if (!userId) {
      setError("Mesaj göndermek için giriş yapman gerekiyor.");
      return;
    }
    const draft = getContactDraft(application.id).trim();
    if (draft.length < 3) {
      setError("Mesaj en az 3 karakter olmalı.");
      return;
    }

    setError(null);
    setNotice(null);
    setSendingContactApplicationId(application.id);

    try {
      const response = await fetch("/api/messages/listing-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          applicationId: application.id,
          message: draft,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error || "Mesaj gönderilemedi.");
        setSendingContactApplicationId(null);
        return;
      }

      setContactDrafts((prev) => ({ ...prev, [application.id]: "" }));
      setActiveContactApplicationId(null);
      setNotice(`Mesaj gönderildi. Konu: ${listing.title}`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Mesaj gönderilemedi.");
    } finally {
      setSendingContactApplicationId(null);
    }
  }

  async function handleSendDirectMessage(listing: ListingRow) {
    if (!userId) {
      setError("Mesaj göndermek için giriş yapman gerekiyor.");
      return;
    }
    const draft = getDirectMessageDraft(listing.id).trim();
    if (draft.length < 3) {
      setError("Mesaj en az 3 karakter olmalı.");
      return;
    }

    setError(null);
    setNotice(null);
    setSendingDirectMessageListingId(listing.id);

    try {
      const response = await fetch("/api/messages/listing-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          message: draft,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error || "Mesaj gönderilemedi.");
        setSendingDirectMessageListingId(null);
        return;
      }

      setDirectMessageDrafts((prev) => ({ ...prev, [listing.id]: "" }));
      setActiveDirectMessageListingId(null);
      setNotice(`Mesaj gönderildi. Konu: ${listing.title}`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Mesaj gönderilemedi.");
    } finally {
      setSendingDirectMessageListingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl py-4">
      <section className="rounded-3xl border border-black/10 bg-white/85 p-5 shadow-[0_22px_55px_-40px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">İlanlar</h1>
            <p className="mt-1 text-sm text-slate-600">
              Kullanıcılar ve profesyoneller ilan açabilir. Hizmet aranan ilanlara başvuru yapılır, hizmet verilen
              ilanlarda doğrudan mesaj atılır.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAll({ silent: true })}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {refreshing ? "Yenileniyor..." : "Yenile"}
            </button>
            {userId ? (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode("open")}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    activeViewMode === "open"
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-black/10 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  Açık İlanlar
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("mine")}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    activeViewMode === "mine"
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-black/10 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  İlanlarım
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("shortlists")}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    activeViewMode === "shortlists"
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-black/10 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  Kısa Listelerim
                </button>
              </>
            ) : (
              <Link
                href="/giris?redirect=%2Filanlar"
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                İlanlarım
              </Link>
            )}
            {userId ? (
              <button
                type="button"
                onClick={() => {
                  if (isCreateOpen) {
                    closeCreatePanel();
                    return;
                  }
                  setEditingListingId(null);
                  setForm(INITIAL_FORM);
                  setSelectedProfession("");
                  setIsCreateOpen(true);
                }}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {isCreateOpen ? "Yeni İlanı Kapat" : "Yeni İlan"}
              </button>
            ) : (
              <Link
                href="/giris?redirect=%2Filanlar"
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Yeni İlan
              </Link>
            )}
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}
      </section>

      {activeViewMode !== "shortlists" ? (
        <section className="mt-4 rounded-3xl border border-black/10 bg-white/85 p-4 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.2)]">
          <div className="grid gap-2 md:grid-cols-5">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="İlanlarda ara (başlık, etiket, ilan no)..."
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
            <select
              value={cityFilter}
              onChange={(event) => {
                setCityFilter(event.target.value);
                setDistrictFilter("");
              }}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Tüm şehirler</option>
              {TURKIYE_ILLERI.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              value={districtFilter}
              onChange={(event) => setDistrictFilter(event.target.value)}
              disabled={!cityFilter}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">{cityFilter ? "Tüm ilçeler" : "Önce şehir seç"}</option>
              {filterDistrictOptions.map((district) => (
                <option key={`district-filter-${district}`} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "all" | ListingType)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">Tüm ilan tipleri</option>
              <option value="need_service">Hizmet Aranıyor</option>
              <option value="offer_service">Hizmet Veriliyor</option>
            </select>
            <div>
              <div className="flex gap-2">
                <select
                  value={selectedProfessionFilter}
                  onChange={(event) => setSelectedProfessionFilter(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Usta/uzmanlık filtrele</option>
                  {PROFESSION_OPTIONS.filter((profession) => !professionFilters.includes(profession)).map(
                    (profession) => (
                      <option key={`filter-${profession}`} value={profession}>
                        {profession}
                      </option>
                    )
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedProfessionFilter) return;
                    setProfessionFilters((prev) =>
                      prev.includes(selectedProfessionFilter) ? prev : [...prev, selectedProfessionFilter]
                    );
                    setSelectedProfessionFilter("");
                  }}
                  disabled={!selectedProfessionFilter}
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Ekle
                </button>
              </div>
              {professionFilters.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {professionFilters.map((profession) => (
                    <button
                      key={`selected-profession-${profession}`}
                      type="button"
                      onClick={() =>
                        setProfessionFilters((prev) => prev.filter((item) => item !== profession))
                      }
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      title="Uzmanlığı filtreden kaldır"
                    >
                      {profession} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {isCreateOpen ? (
        <section className="mt-4 rounded-3xl border border-black/10 bg-white/85 p-5 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.2)]">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingListingId ? "İlanı Düzenle" : "Yeni İlan Aç"}
          </h2>
          {!userId ? (
            <p className="mt-2 text-sm text-slate-600">
              İlan açmak için önce{" "}
              <Link href="/giris?redirect=%2Filanlar" className="font-semibold text-slate-900 underline">
                giriş yap
              </Link>
              .
            </p>
          ) : (
            <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={(event) => void handleCreateListing(event)}>
              <select
                value={form.listingType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, listingType: event.target.value as ListingType }))
                }
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                disabled={submitting}
              >
                <option value="need_service">Hizmet Aranıyor</option>
                <option value="offer_service">Hizmet Veriliyor</option>
              </select>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as ListingStatus }))
                }
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                disabled={submitting}
              >
                <option value="published">Hemen yayınla</option>
                <option value="draft">Taslak kaydet</option>
              </select>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="İlan başlığı (örn. Kadıköy’de mutfak tadilatı)"
                className="md:col-span-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                disabled={submitting}
              />
              <select
                value={form.city}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    city: event.target.value,
                    district: "",
                  }))
                }
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                disabled={submitting}
              >
                <option value="">Şehir seç</option>
                {formCityOptions.map((city) => (
                  <option key={`form-city-${city}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <select
                value={form.district}
                onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                disabled={submitting || !form.city}
              >
                <option value="">{form.city ? "İlçe seç (opsiyonel)" : "Önce şehir seç"}</option>
                {formDistrictOptions.map((district) => (
                  <option key={`form-district-${district}`} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              <input
                value={form.budgetMin}
                onChange={(event) => setForm((prev) => ({ ...prev, budgetMin: event.target.value }))}
                placeholder="Min bütçe (₺)"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                disabled={submitting}
              />
              <input
                value={form.budgetMax}
                onChange={(event) => setForm((prev) => ({ ...prev, budgetMax: event.target.value }))}
                placeholder="Max bütçe (₺)"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                disabled={submitting}
              />
              <div className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedProfession}
                    onChange={(event) => setSelectedProfession(event.target.value)}
                    className="min-w-[260px] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    disabled={submitting}
                  >
                    <option value="">{form.listingType === "offer_service" ? "Verilen hizmet" : "Aranan ustalığı seç"}</option>
                    {PROFESSION_OPTIONS.filter((profession) => !form.professions.includes(profession)).map(
                      (profession) => (
                        <option key={profession} value={profession}>
                          {profession}
                        </option>
                      )
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedProfession) return;
                      setForm((prev) => ({
                        ...prev,
                        professions: prev.professions.includes(selectedProfession)
                          ? prev.professions
                          : [...prev.professions, selectedProfession],
                      }));
                      setSelectedProfession("");
                    }}
                    disabled={submitting || !selectedProfession}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Ekle
                  </button>
                </div>
                {form.professions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.professions.map((profession) => (
                      <button
                        key={profession}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            professions: prev.professions.filter((item) => item !== profession),
                          }))
                        }
                        className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        title="Kaldır"
                      >
                        {profession} ×
                      </button>
                    ))}
                  </div>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">Dropdown’dan seçip ekleyebilirsin.</p>
              </div>
              <input
                value={form.tags}
                onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                placeholder="Etiketler (acil, tadilat, villa...)"
                className="md:col-span-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                disabled={submitting}
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="İlan detaylarını yaz..."
                rows={4}
                className="md:col-span-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                disabled={submitting}
              />
              <select
                value={form.neededWithin}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, neededWithin: event.target.value as NeededWithin }))
                }
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                disabled={submitting}
              >
                <option value="hemen">Hemen</option>
                <option value="1_ay">1 ay içerisinde</option>
                <option value="3_ay">3 ay içerisinde</option>
                <option value="arastiriyorum">Sadece araştırıyorum</option>
              </select>
              <label className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isUrgent}
                  onChange={(event) => setForm((prev) => ({ ...prev, isUrgent: event.target.checked }))}
                  disabled={submitting}
                />
                Acil ilan
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                {editingListingId ? (
                  <button
                    type="button"
                    onClick={closeCreatePanel}
                    disabled={submitting}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Vazgeç
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Kaydediliyor..."
                    : editingListingId
                    ? "İlanı Güncelle"
                    : form.status === "draft"
                    ? "Taslak Kaydet"
                    : "İlanı Yayınla"}
                </button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      {activeViewMode === "shortlists" ? (
        <section className="mt-4 grid gap-3">
          {loading ? (
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-6 text-sm text-slate-600">
              Kısa listeler yükleniyor...
            </div>
          ) : shortlistedApplications.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-6 text-sm text-slate-600">
              Kısa listene eklenmiş başvuru görünmüyor.
            </div>
          ) : (
            shortlistedApplications.map(({ listing, application }) => {
              const applicantProfile = profilesById[application.applicant_id];
              const applicantName = profileDisplayName(
                applicantProfile,
                `Üye ${firstName(application.applicant_id.slice(0, 8))}`
              );
              const applicantRole = applicantProfile?.role ?? null;
              const applicantProfileHref = professionalProfileHref(application.applicant_id, applicantRole);
              const applicantRating =
                applicantProfileHref ? ratingStatsByDesignerId[application.applicant_id] : undefined;
              const applicantRatingText = applicantProfileHref
                ? applicantRating
                  ? ratingLabel(applicantRating.average, applicantRating.count)
                  : "Henüz değerlendirme yok"
                : null;
              return (
                <article
                  key={`shortlist-${application.id}`}
                  className="rounded-3xl border border-black/10 bg-white/85 p-4 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-indigo-700">Kısa Liste</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{listing.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Başvuran:{" "}
                        {applicantProfileHref ? (
                          <Link
                            href={applicantProfileHref}
                            className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700"
                          >
                            {applicantName}
                          </Link>
                        ) : (
                          applicantName
                        )}
                        {applicantRatingText ? ` • ${applicantRatingText}` : ""} •{" "}
                        {formatDate(application.updated_at || application.created_at)}
                      </p>
                    </div>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {applicationStatusLabel(application.status)}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">{application.message}</p>
                  {(application.price_quote || application.timeline) ? (
                    <p className="mt-2 text-xs text-slate-600">
                      {application.price_quote ? `Teklif: ${application.price_quote}` : ""}
                      {application.price_quote && application.timeline ? " • " : ""}
                      {application.timeline ? `Süre: ${application.timeline}` : ""}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveContactApplicationId((prev) => (prev === application.id ? null : application.id))
                      }
                      className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Mesaj Gönder
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleApplicationStatus(application.id, "accepted")}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Kabul Et
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleApplicationStatus(application.id, "rejected")}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Reddet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("mine");
                        setOpenApplicationsListingId(listing.id);
                      }}
                      className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      İlan Detayını Aç
                    </button>
                  </div>
                  {activeContactApplicationId === application.id ? (
                    <div className="mt-3 rounded-xl border border-black/10 bg-slate-50 p-3">
                      <textarea
                        value={getContactDraft(application.id)}
                        onChange={(event) =>
                          setContactDrafts((prev) => ({
                            ...prev,
                            [application.id]: event.target.value,
                          }))
                        }
                        placeholder="Kabul sonrası iletmek istediğin mesajı yaz..."
                        rows={3}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSendAcceptedMessage(listing, application)}
                          disabled={sendingContactApplicationId === application.id}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {sendingContactApplicationId === application.id ? "Gönderiliyor..." : "Mesajı Gönder"}
                        </button>
                        <Link
                          href="/messages"
                          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Mesaj Kutusu
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </section>
      ) : (
        <section className="mt-4 grid gap-3">
          {loading ? (
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-6 text-sm text-slate-600">
              İlanlar yükleniyor...
            </div>
          ) : displayedListings.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-6 text-sm text-slate-600">
              {activeViewMode === "mine" ? "Henüz ilanın yok." : "Filtreye uygun ilan bulunamadı."}
            </div>
          ) : (
            displayedListings.map((listing) => {
              const isOwner = userId === listing.owner_id;
              const isNeedServiceListing = listing.listing_type === "need_service";
              const listingApplications = applicationsByListing[listing.id] ?? [];
              const myApplication = userId
                ? listingApplications.find((application) => application.applicant_id === userId)
                : null;
              const bookmarked = bookmarkedIds.has(listing.id);
              const ownerProfile = profilesById[listing.owner_id];
              const ownerName = isOwner
                ? "Sen"
                : profileDisplayName(
                    ownerProfile,
                    listing.owner_role === "homeowner" ? "Kullanıcı" : "Profesyonel"
                  );
              const ownerRole = ownerProfile?.role ?? listing.owner_role;
              const ownerProfileHref = professionalProfileHref(listing.owner_id, ownerRole);
              const ownerRating = ownerProfileHref ? ratingStatsByDesignerId[listing.owner_id] : undefined;
              const ownerRatingText =
                listing.listing_type === "offer_service" && ownerProfileHref
                  ? ownerRating
                    ? ratingLabel(ownerRating.average, ownerRating.count)
                    : "Henüz değerlendirme yok"
                  : null;
              const applyDraft = getApplyDraft(listing.id);
              const showApplications = isNeedServiceListing && openApplicationsListingId === listing.id;
              const showApplyForm =
                isNeedServiceListing && isProfessionalUser && activeApplyListingId === listing.id;
              const showDirectMessageForm =
                listing.listing_type === "offer_service" && activeDirectMessageListingId === listing.id;
              const listingNumber = listingNumberFromId(listing.id);

              return (
                <article
                  key={listing.id}
                  id={`listing-${listing.id}`}
                  className="rounded-3xl border border-black/10 bg-white/85 p-4 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full border border-black/10 bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                          {listingTypeLabel(listing.listing_type)}
                        </span>
                        <span
                          className={[
                            "rounded-full border px-2 py-1 font-semibold",
                            listing.status === "published"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : listing.status === "draft"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          {listingStatusLabel(listing.status)}
                        </span>
                        {listing.is_urgent ? (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 font-semibold text-rose-700">
                            Acil
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{listing.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        İlan No: {listingNumber} •{" "}
                        {listing.city}
                        {listing.district?.trim() ? ` / ${listing.district.trim()}` : ""} •{" "}
                        {isOwner ? (
                          ownerName
                        ) : ownerProfileHref ? (
                          <Link
                            href={ownerProfileHref}
                            className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700"
                          >
                            {ownerName}
                          </Link>
                        ) : (
                          ownerName
                        )}
                        {ownerRatingText ? ` • ${ownerRatingText}` : ""} • {formatDate(listing.created_at)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>{formatMoneyLabel(listing.budget_min, listing.budget_max)}</div>
                      {listing.expires_at ? (
                        <div className="mt-1">Son gün: {formatDate(listing.expires_at)}</div>
                      ) : null}
                    </div>
                  </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">{listing.description}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {neededWithinLabel(listing.needed_within)}
                  </span>
                  {(listing.needed_professions ?? []).map((item) => (
                    <span
                      key={`profession-${listing.id}-${item}`}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                    >
                      {item}
                    </span>
                  ))}
                  {(listing.tags ?? []).map((item) => (
                    <span
                      key={`tag-${listing.id}-${item}`}
                      className="rounded-full border border-black/10 bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                    >
                      #{item}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {userId && !isOwner ? (
                    <button
                      type="button"
                      onClick={() => void toggleBookmark(listing.id)}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {bookmarked ? "Kaydedildi" : "Kaydet"}
                    </button>
                  ) : null}

                  {isOwner ? (
                    <>
                      {listing.status === "draft" ? (
                        <button
                          type="button"
                          onClick={() => startEditingListing(listing)}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          Düzenle
                        </button>
                      ) : null}
                      {listing.status !== "published" ? (
                        <button
                          type="button"
                          onClick={() => void handleListingStatus(listing.id, "published")}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Yayına Al
                        </button>
                      ) : null}
                      {listing.status !== "draft" ? (
                        <button
                          type="button"
                          onClick={() => void handleListingStatus(listing.id, "draft")}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          Taslağa Al
                        </button>
                      ) : null}
                      {listing.status !== "closed" ? (
                        <button
                          type="button"
                          onClick={() => void handleListingStatus(listing.id, "closed")}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          İlanı Kapat
                        </button>
                      ) : null}
                      {isNeedServiceListing ? (
                        <button
                          type="button"
                          onClick={() =>
                            setOpenApplicationsListingId((prev) => (prev === listing.id ? null : listing.id))
                          }
                          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Başvurular ({listingApplications.length})
                        </button>
                      ) : null}
                    </>
                  ) : !userId ? (
                    <Link
                      href={`/giris?redirect=${encodeURIComponent("/ilanlar")}`}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {isNeedServiceListing ? "Başvuru için giriş yap" : "Mesaj için giriş yap"}
                    </Link>
                  ) : isNeedServiceListing ? (
                    myApplication ? (
                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-xs font-semibold",
                          myApplication.status === "accepted"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : myApplication.status === "shortlisted"
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : myApplication.status === "rejected"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-amber-200 bg-amber-50 text-amber-700",
                        ].join(" ")}
                      >
                        Başvuru durumu: {applicationStatusLabel(myApplication.status)}
                      </span>
                    ) : !isProfessionalUser ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Başvuru için profesyonel hesap gerekli
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDirectMessageListingId(null);
                          setActiveApplyListingId((prev) => (prev === listing.id ? null : listing.id));
                        }}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Başvuru Yap
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveApplyListingId(null);
                        setActiveDirectMessageListingId((prev) => (prev === listing.id ? null : listing.id));
                      }}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Mesaj At
                    </button>
                  )}
                </div>

                {showApplyForm ? (
                  <div className="mt-3 rounded-2xl border border-black/10 bg-slate-50 p-3">
                    <textarea
                      value={applyDraft.message}
                      onChange={(event) =>
                        setApplyDrafts((prev) => ({
                          ...prev,
                          [listing.id]: { ...getApplyDraft(listing.id), message: event.target.value },
                        }))
                      }
                      placeholder="İlgini çeken noktaları ve neden uygun olduğunu yaz..."
                      rows={3}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    />
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <input
                        value={applyDraft.priceQuote}
                        onChange={(event) =>
                          setApplyDrafts((prev) => ({
                            ...prev,
                            [listing.id]: { ...getApplyDraft(listing.id), priceQuote: event.target.value },
                          }))
                        }
                        placeholder="Teklif (örn. 150.000 ₺)"
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                      />
                      <input
                        value={applyDraft.timeline}
                        onChange={(event) =>
                          setApplyDrafts((prev) => ({
                            ...prev,
                            [listing.id]: { ...getApplyDraft(listing.id), timeline: event.target.value },
                          }))
                        }
                        placeholder="Tahmini süre (örn. 4 hafta)"
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => void handleSendApplication(listing.id)}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Başvuruyu Gönder
                      </button>
                    </div>
                  </div>
                ) : null}

                {showDirectMessageForm ? (
                  <div className="mt-3 rounded-2xl border border-black/10 bg-slate-50 p-3">
                    <textarea
                      value={getDirectMessageDraft(listing.id)}
                      onChange={(event) =>
                        setDirectMessageDrafts((prev) => ({
                          ...prev,
                          [listing.id]: event.target.value,
                        }))
                      }
                      placeholder="Bu hizmet ilanı için mesajını yaz..."
                      rows={3}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSendDirectMessage(listing)}
                        disabled={sendingDirectMessageListingId === listing.id}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingDirectMessageListingId === listing.id ? "Gönderiliyor..." : "Mesajı Gönder"}
                      </button>
                      <Link
                        href="/messages"
                        className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Mesaj Kutusu
                      </Link>
                    </div>
                  </div>
                ) : null}

                {showApplications ? (
                  <div className="mt-3 space-y-2 rounded-2xl border border-black/10 bg-slate-50 p-3">
                    {listingApplications.length === 0 ? (
                      <p className="text-sm text-slate-600">Henüz başvuru yok.</p>
                    ) : (
                      listingApplications.map((application) => {
                        const applicantProfile = profilesById[application.applicant_id];
                        const applicantName = profileDisplayName(
                          applicantProfile,
                          `Üye ${firstName(application.applicant_id.slice(0, 8))}`
                        );
                        const applicantRole = applicantProfile?.role ?? null;
                        const applicantProfileHref = professionalProfileHref(application.applicant_id, applicantRole);
                        const applicantRating =
                          applicantProfileHref ? ratingStatsByDesignerId[application.applicant_id] : undefined;
                        const applicantRatingText = applicantProfileHref
                          ? applicantRating
                            ? ratingLabel(applicantRating.average, applicantRating.count)
                            : "Henüz değerlendirme yok"
                          : null;
                        return (
                          <article key={application.id} className="rounded-xl border border-black/10 bg-white p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                              <span className="font-semibold text-slate-700">
                                {applicantProfileHref ? (
                                  <Link
                                    href={applicantProfileHref}
                                    className="underline underline-offset-2 hover:text-slate-900"
                                  >
                                    {applicantName}
                                  </Link>
                                ) : (
                                  applicantName
                                )}
                                {applicantRatingText ? ` • ${applicantRatingText}` : ""}
                              </span>
                              <span>{formatDate(application.created_at)}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{application.message}</p>
                            {(application.price_quote || application.timeline) ? (
                              <p className="mt-1 text-xs text-slate-600">
                                {application.price_quote ? `Teklif: ${application.price_quote}` : ""}
                                {application.price_quote && application.timeline ? " • " : ""}
                                {application.timeline ? `Süre: ${application.timeline}` : ""}
                              </p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-black/10 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                {applicationStatusLabel(application.status)}
                              </span>
                              {application.status === "accepted" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveContactApplicationId((prev) =>
                                      prev === application.id ? null : application.id
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                >
                                  Mesaj Gönder
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void handleApplicationStatus(application.id, "shortlisted")}
                                className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                              >
                                Kısa Liste
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleApplicationStatus(application.id, "accepted")}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                Kabul Et
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleApplicationStatus(application.id, "rejected")}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Reddet
                              </button>
                            </div>
                            {application.status === "accepted" &&
                            activeContactApplicationId === application.id ? (
                              <div className="mt-3 rounded-xl border border-black/10 bg-slate-50 p-3">
                                <textarea
                                  value={getContactDraft(application.id)}
                                  onChange={(event) =>
                                    setContactDrafts((prev) => ({
                                      ...prev,
                                      [application.id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Kabul sonrası iletmek istediğin mesajı yaz..."
                                  rows={3}
                                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                                />
                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleSendAcceptedMessage(listing, application)}
                                    disabled={sendingContactApplicationId === application.id}
                                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {sendingContactApplicationId === application.id
                                      ? "Gönderiliyor..."
                                      : "Mesajı Gönder"}
                                  </button>
                                  <Link
                                    href="/messages"
                                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    Mesaj Kutusu
                                  </Link>
                                </div>
                              </div>
                            ) : null}
                          </article>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </article>
            );
            })
          )}
        </section>
      )}

      {userId ? (
        <section className="mt-4 rounded-3xl border border-black/10 bg-white/85 p-4 text-sm text-slate-600 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.2)]">
          <strong className="text-slate-900">Özet:</strong> {myListings.length} ilanın var.
          {myListings.length > 0 ? " İlanlarının durumunu kart içinden yönetebilirsin." : " İlk ilanını açarak görünürlük kazanabilirsin."}
        </section>
      ) : null}
    </main>
  );
}
