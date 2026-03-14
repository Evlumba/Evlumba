"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

const tabs = [
  { id: "general", label: "Genel" },
  { id: "about", label: "Hakkında" },
  { id: "contact", label: "İletişim" },
  { id: "business", label: "İşletme" },
  { id: "cover-photo", label: "Kapak Fotoğrafı" },
  { id: "security", label: "Güvenlik" },
] as const;

const COVER_WIDTH = 1920;
const COVER_HEIGHT = 640;

type TabId = (typeof tabs)[number]["id"];

type DesignerProfileDraft = {
  fullName: string;
  businessName: string;
  specialty: string;
  projectTypesText: string;
  servicesText: string;
  city: string;
  tagsText: string;
  startingFrom: string;

  aboutHeadline: string;
  aboutBio: string;
  aboutSpecialtiesText: string;
  aboutServiceAreasText: string;
  aboutLanguagesText: string;
  aboutTeamSize: string;
  aboutAvailability: string;

  phone: string;
  contactEmail: string;
  address: string;
  website: string;
  instagram: string;
  facebook: string;
  linkedin: string;

  employees: string;
  founded: string;
  license: string;
  workingWeekdays: string;
  workingSaturday: string;
  workingSunday: string;

  coverPhotoUrl: string;
  avatarUrl: string;
};

const DEFAULT_DRAFT: DesignerProfileDraft = {
  fullName: "",
  businessName: "",
  specialty: "",
  projectTypesText: "",
  servicesText: "",
  city: "",
  tagsText: "",
  startingFrom: "",

  aboutHeadline: "",
  aboutBio: "",
  aboutSpecialtiesText: "",
  aboutServiceAreasText: "",
  aboutLanguagesText: "",
  aboutTeamSize: "",
  aboutAvailability: "",

  phone: "",
  contactEmail: "",
  address: "",
  website: "",
  instagram: "",
  facebook: "",
  linkedin: "",

  employees: "",
  founded: "",
  license: "",
  workingWeekdays: "",
  workingSaturday: "",
  workingSunday: "",

  coverPhotoUrl: "",
  avatarUrl: "",
};

function draftStorageKey(userId: string) {
  return `evlumba_designer_profile_v3_${userId}`;
}

function loadLocalDraft(userId: string): Partial<DesignerProfileDraft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(draftStorageKey(userId));
    if (!raw) return {};
    return JSON.parse(raw) as Partial<DesignerProfileDraft>;
  } catch {
    return {};
  }
}

function saveLocalDraft(userId: string, value: DesignerProfileDraft) {
  if (typeof window === "undefined") return;
  const key = draftStorageKey(userId);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return;
  } catch {
    // Fallback: localStorage kotası dolarsa büyük görsel alanlarını atmadan tekrar dene.
  }

  const lightweightValue: DesignerProfileDraft = {
    ...value,
    avatarUrl: "",
    coverPhotoUrl: "",
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(lightweightValue));
  } catch {
    // Son çare: eski draft'ı temizle, akışı bozma.
    try {
      window.localStorage.removeItem(key);
    } catch {
      // no-op
    }
  }
}

function splitCsv(value: string) {
  return value
    .split(/\r?\n|,/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function toCsv(value?: string[]) {
  return value?.join(", ") ?? "";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel yüklenemedi"));
    img.src = src;
  });
}

async function normalizeCoverImage(file: File, width: number, height: number): Promise<string> {
  const sourceDataUrl = await fileToDataUrl(file);
  const image = await loadImage(sourceDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas başlatılamadı");

  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;

  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;

  // Center-crop to target ratio.
  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else if (sourceRatio < targetRatio) {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs = 12000,
  timeoutMessage = "İşlem zaman aşımına uğradı."
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function isGoogleUser(user: { app_metadata?: Record<string, unknown> | null }) {
  const metadata = user.app_metadata ?? {};
  const provider = String(metadata.provider ?? "").toLowerCase();
  if (provider === "google") return true;

  const providers = Array.isArray(metadata.providers)
    ? metadata.providers.map((item) => String(item).toLowerCase())
    : [];
  return providers.includes("google");
}

function pickGoogleFullName(user: { user_metadata?: Record<string, unknown> | null }) {
  const metadata = user.user_metadata ?? {};
  const fullName = String(metadata.full_name ?? "").trim();
  if (fullName) return fullName;

  const name = String(metadata.name ?? "").trim();
  if (name) return name;

  const givenName = String(metadata.given_name ?? "").trim();
  const familyName = String(metadata.family_name ?? "").trim();
  return `${givenName} ${familyName}`.trim();
}

export default function DesignerProfileEditPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DesignerProfileDraft>(DEFAULT_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [isGoogleAuthUser, setIsGoogleAuthUser] = useState(false);
  const [googleLockedName, setGoogleLockedName] = useState("");
  const [googleLockedEmail, setGoogleLockedEmail] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordAgain, setNewPasswordAgain] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setMessage(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await withTimeout(
          supabase.auth.getUser(),
          12000,
          "Oturum kontrolü zaman aşımına uğradı."
        );
        if (error || !data.user) {
          if (!cancelled) setMessage("Profil ayarları için giriş yapmalısın.");
          return;
        }

        const id = data.user.id;
        const googleAccount = isGoogleUser(data.user);
        const googleName = pickGoogleFullName(data.user);
        const googleEmail = data.user.email ?? "";
        if (cancelled) return;
        setUserId(id);
        setAuthEmail(googleEmail);
        setIsGoogleAuthUser(googleAccount);
        setGoogleLockedName(googleAccount ? googleName : "");
        setGoogleLockedEmail(googleAccount ? googleEmail : "");

        const local = loadLocalDraft(id);
        const { data: profile } = await withTimeout(
          supabase
            .from("profiles")
            .select(
              "full_name, avatar_url, business_name, specialty, city, phone, contact_email, address, website, instagram, facebook, linkedin, cover_photo_url, tags, starting_from, about_details, business_details"
            )
            .eq("id", id)
            .maybeSingle(),
          12000,
          "Profil verisi alınırken zaman aşımı oldu."
        );

        const aboutDetails = (profile?.about_details ?? {}) as Record<string, unknown>;
        const businessDetails = (profile?.business_details ?? {}) as Record<string, unknown>;
        const workingHours = (businessDetails.workingHours ?? {}) as Record<string, unknown>;

        if (!cancelled) {
          setDraft({
            ...DEFAULT_DRAFT,
            ...local,
            fullName: googleAccount
              ? googleName || profile?.full_name || local.fullName || ""
              : profile?.full_name ?? local.fullName ?? "",
            avatarUrl: profile?.avatar_url ?? local.avatarUrl ?? "",
            businessName: profile?.business_name ?? local.businessName ?? "",
            specialty: profile?.specialty ?? local.specialty ?? "",
            projectTypesText: toCsv(aboutDetails.projectTypes as string[] | undefined),
            servicesText: toCsv(aboutDetails.services as string[] | undefined),
            city: profile?.city ?? local.city ?? "",
            phone: profile?.phone ?? local.phone ?? "",
            contactEmail: googleAccount
              ? googleEmail
              : profile?.contact_email ?? local.contactEmail ?? googleEmail,
            address: profile?.address ?? local.address ?? "",
            website: profile?.website ?? local.website ?? "",
            instagram: profile?.instagram ?? local.instagram ?? "",
            facebook: profile?.facebook ?? local.facebook ?? "",
            linkedin: profile?.linkedin ?? local.linkedin ?? "",
            coverPhotoUrl: profile?.cover_photo_url ?? local.coverPhotoUrl ?? "",
            tagsText: toCsv(profile?.tags as string[] | undefined),
            startingFrom: profile?.starting_from ?? local.startingFrom ?? "",
            aboutHeadline: (aboutDetails.headline as string | undefined) ?? local.aboutHeadline ?? "",
            aboutBio: (aboutDetails.bio as string | undefined) ?? local.aboutBio ?? "",
            aboutSpecialtiesText: toCsv(aboutDetails.specialties as string[] | undefined),
            aboutServiceAreasText: toCsv(aboutDetails.serviceAreas as string[] | undefined),
            aboutLanguagesText: toCsv(aboutDetails.languages as string[] | undefined),
            aboutTeamSize: (aboutDetails.teamSize as string | undefined) ?? local.aboutTeamSize ?? "",
            aboutAvailability: (aboutDetails.availability as string | undefined) ?? local.aboutAvailability ?? "",
            employees: (businessDetails.employees as string | undefined) ?? local.employees ?? "",
            founded: (businessDetails.founded as string | undefined) ?? local.founded ?? "",
            license: (businessDetails.license as string | undefined) ?? local.license ?? "",
            workingWeekdays: (workingHours.weekdays as string | undefined) ?? local.workingWeekdays ?? "",
            workingSaturday: (workingHours.saturday as string | undefined) ?? local.workingSaturday ?? "",
            workingSunday: (workingHours.sunday as string | undefined) ?? local.workingSunday ?? "",
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setMessage(loadError instanceof Error ? loadError.message : "Profil yüklenemedi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

async function onPickAvatar(file: File | null) {
  if (!file) return;
  try {
      const url = await fileToDataUrl(file);
      setDraft((prev) => ({ ...prev, avatarUrl: url }));
  } catch {
    toast("Profil fotoğrafı yüklenemedi");
  }
}

async function onPickCover(file: File | null) {
  if (!file) return;
  try {
      const url = await normalizeCoverImage(file, COVER_WIDTH, COVER_HEIGHT);
      setDraft((prev) => ({ ...prev, coverPhotoUrl: url }));
      toast(`Kapak fotoğrafı otomatik ${COVER_WIDTH}x${COVER_HEIGHT} olarak ayarlandı`);
  } catch {
    toast("Kapak fotoğrafı yüklenemedi");
  }
}

  async function saveProfile() {
    if (!userId) return;
    const normalizedFullName =
      isGoogleAuthUser && googleLockedName.trim() ? googleLockedName.trim() : draft.fullName.trim();
    const normalizedContactEmail =
      isGoogleAuthUser && googleLockedEmail.trim()
        ? googleLockedEmail.trim()
        : draft.contactEmail.trim();

    if (!normalizedFullName) {
      setMessage("Tam ad zorunlu.");
      setActiveTab("general");
      return;
    }
    if (!draft.city.trim()) {
      setMessage("Şehir zorunlu.");
      setActiveTab("general");
      return;
    }
    if (!normalizedContactEmail || !isValidEmail(normalizedContactEmail)) {
      setMessage("Geçerli bir iletişim e-postası zorunlu.");
      setActiveTab("contact");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const aboutDetails = {
        headline: draft.aboutHeadline || null,
        bio: draft.aboutBio || null,
        projectTypes: splitCsv(draft.projectTypesText),
        services: splitCsv(draft.servicesText),
        specialties: splitCsv(draft.aboutSpecialtiesText),
        serviceAreas: splitCsv(draft.aboutServiceAreasText),
        languages: splitCsv(draft.aboutLanguagesText),
        teamSize: draft.aboutTeamSize || null,
        availability: draft.aboutAvailability || null,
      };
      const businessDetails = {
        employees: draft.employees || null,
        founded: draft.founded || null,
        license: draft.license || null,
        workingHours: {
          weekdays: draft.workingWeekdays || null,
          saturday: draft.workingSaturday || null,
          sunday: draft.workingSunday || null,
        },
      };

      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        role: "designer",
        full_name: normalizedFullName,
        business_name: draft.businessName || null,
        specialty: draft.specialty || null,
        city: draft.city.trim(),
        tags: splitCsv(draft.tagsText),
        starting_from: draft.startingFrom || null,
        avatar_url: draft.avatarUrl || null,
        cover_photo_url: draft.coverPhotoUrl || null,
        phone: draft.phone || null,
        contact_email: normalizedContactEmail,
        address: draft.address || null,
        website: draft.website || null,
        instagram: draft.instagram || null,
        facebook: draft.facebook || null,
        linkedin: draft.linkedin || null,
        about_details: aboutDetails,
        business_details: businessDetails,
      });

      if (error) {
        setMessage(error.message);
        toast(error.message);
        return;
      }

      const draftToPersist = {
        ...draft,
        fullName: normalizedFullName,
        contactEmail: normalizedContactEmail,
      };
      setDraft(draftToPersist);
      saveLocalDraft(userId, draftToPersist);
      setMessage("Profil kaydedildi.");
      toast("Profil kaydedildi");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm";

  async function changePassword() {
    if (!authEmail) {
      toast("Giriş e-postası bulunamadı.");
      return;
    }
    if (!currentPassword) {
      toast("Mevcut şifre zorunlu.");
      return;
    }
    if (newPassword.length < 6) {
      toast("Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    if (newPassword !== newPasswordAgain) {
      toast("Yeni şifreler aynı olmalı.");
      return;
    }

    setSecurityLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: currentPassword,
      });
      if (verifyError) {
        toast("Mevcut şifre hatalı.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        toast(updateError.message);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordAgain("");
      toast("Şifre güncellendi.");
    } finally {
      setSecurityLoading(false);
    }
  }

  async function sendResetPasswordMail() {
    if (!authEmail) {
      toast("Giriş e-postası bulunamadı.");
      return;
    }
    setSecurityLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/sifremi-unuttum` : undefined,
      });
      if (error) {
        toast(error.message);
        return;
      }
      toast("Şifre sıfırlama maili gönderildi.");
    } finally {
      setSecurityLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-base font-bold text-slate-900">Evlumba Profil Ayarları</h1>
            <button
              type="button"
              onClick={() => {
                if (!userId) {
                  toast("Profil bilgileri yükleniyor...");
                  return;
                }
                router.push(`/tasarimcilar/supa_${encodeURIComponent(userId)}`);
              }}
              disabled={!userId}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Görüntüle
            </button>
          </div>
          <div className="mt-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                  activeTab === tab.id ? "bg-sky-600 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          {loading ? <div className="text-sm text-slate-600">Yükleniyor...</div> : null}

          {!loading && activeTab === "general" ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Genel Bilgiler</h2>
              <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <div className="text-sm text-slate-600">Profil Fotoğrafı</div>
                  <div className="mt-3 flex justify-center">
                    {draft.avatarUrl ? (
                      <img src={draft.avatarUrl} alt="Profil" className="h-24 w-24 rounded-full border object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-white text-xs text-slate-400">Yok</div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="mt-3 w-full text-xs" onChange={(e) => void onPickAvatar(e.target.files?.[0] ?? null)} />
                </div>
                <div className="space-y-3">
                  <input
                    className={`${inputCls}${isGoogleAuthUser ? " bg-slate-100 text-slate-500" : ""}`}
                    value={draft.fullName}
                    onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Tam Ad (zorunlu)"
                    readOnly={isGoogleAuthUser}
                    aria-readonly={isGoogleAuthUser}
                  />
                  {isGoogleAuthUser ? (
                    <p className="text-xs text-slate-500">Tam ad Google hesabından otomatik alınır.</p>
                  ) : null}
                  <input className={inputCls} value={draft.specialty} onChange={(e) => setDraft((p) => ({ ...p, specialty: e.target.value }))} placeholder="İş Türü (zorunlu önerilir)" />
                  <input
                    className={inputCls}
                    value={draft.projectTypesText}
                    onChange={(e) => setDraft((p) => ({ ...p, projectTypesText: e.target.value }))}
                    placeholder="Proje türleri (virgülle: Komple yenileme, Planlama)"
                  />
                  <input
                    className={inputCls}
                    value={draft.servicesText}
                    onChange={(e) => setDraft((p) => ({ ...p, servicesText: e.target.value }))}
                    placeholder="Hizmetler (virgülle: Danışmanlık, Uygulama)"
                  />
                  <input className={inputCls} value={draft.city} onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))} placeholder="Şehir (zorunlu)" />
                  <input className={inputCls} value={draft.businessName} onChange={(e) => setDraft((p) => ({ ...p, businessName: e.target.value }))} placeholder="İşletme Adı" />
                  <input className={inputCls} value={draft.tagsText} onChange={(e) => setDraft((p) => ({ ...p, tagsText: e.target.value }))} placeholder="Etiketler (virgülle)" />
                  <input className={inputCls} value={draft.startingFrom} onChange={(e) => setDraft((p) => ({ ...p, startingFrom: e.target.value }))} placeholder="Başlangıç fiyatı (örn: ₺15K+)" />
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === "about" ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Hakkında</h2>
              <input className={inputCls} value={draft.aboutHeadline} onChange={(e) => setDraft((p) => ({ ...p, aboutHeadline: e.target.value }))} placeholder="Başlık" />
              <textarea className={inputCls} rows={6} value={draft.aboutBio} onChange={(e) => setDraft((p) => ({ ...p, aboutBio: e.target.value }))} placeholder="Biyografi" />
              <input className={inputCls} value={draft.aboutSpecialtiesText} onChange={(e) => setDraft((p) => ({ ...p, aboutSpecialtiesText: e.target.value }))} placeholder="Uzmanlıklar (virgülle)" />
              <input className={inputCls} value={draft.aboutServiceAreasText} onChange={(e) => setDraft((p) => ({ ...p, aboutServiceAreasText: e.target.value }))} placeholder="Hizmet Bölgeleri (virgülle)" />
              <input className={inputCls} value={draft.aboutLanguagesText} onChange={(e) => setDraft((p) => ({ ...p, aboutLanguagesText: e.target.value }))} placeholder="Diller (virgülle)" />
              <input className={inputCls} value={draft.aboutTeamSize} onChange={(e) => setDraft((p) => ({ ...p, aboutTeamSize: e.target.value }))} placeholder="Ekip büyüklüğü" />
              <input className={inputCls} value={draft.aboutAvailability} onChange={(e) => setDraft((p) => ({ ...p, aboutAvailability: e.target.value }))} placeholder="Müsaitlik" />
            </div>
          ) : null}

          {!loading && activeTab === "contact" ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">İletişim</h2>
              <input
                className={`${inputCls}${isGoogleAuthUser ? " bg-slate-100 text-slate-500" : ""}`}
                value={draft.contactEmail}
                onChange={(e) => setDraft((p) => ({ ...p, contactEmail: e.target.value }))}
                placeholder="İletişim e-posta (zorunlu)"
                readOnly={isGoogleAuthUser}
                aria-readonly={isGoogleAuthUser}
              />
              {isGoogleAuthUser ? (
                <p className="text-xs text-slate-500">İletişim e-postası Google hesabından otomatik alınır.</p>
              ) : null}
              <input className={inputCls} value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} placeholder="Telefon" />
              <input className={inputCls} value={draft.address} onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))} placeholder="Adres" />
              <input className={inputCls} value={draft.website} onChange={(e) => setDraft((p) => ({ ...p, website: e.target.value }))} placeholder="Website" />
              <input className={inputCls} value={draft.instagram} onChange={(e) => setDraft((p) => ({ ...p, instagram: e.target.value }))} placeholder="Instagram" />
              <input className={inputCls} value={draft.facebook} onChange={(e) => setDraft((p) => ({ ...p, facebook: e.target.value }))} placeholder="Facebook" />
              <input className={inputCls} value={draft.linkedin} onChange={(e) => setDraft((p) => ({ ...p, linkedin: e.target.value }))} placeholder="LinkedIn" />
            </div>
          ) : null}

          {!loading && activeTab === "business" ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">İşletme</h2>
              <input className={inputCls} value={draft.employees} onChange={(e) => setDraft((p) => ({ ...p, employees: e.target.value }))} placeholder="Çalışan sayısı" />
              <input className={inputCls} value={draft.founded} onChange={(e) => setDraft((p) => ({ ...p, founded: e.target.value }))} placeholder="Kuruluş yılı" />
              <input className={inputCls} value={draft.license} onChange={(e) => setDraft((p) => ({ ...p, license: e.target.value }))} placeholder="Lisans/Sicil no" />
              <input className={inputCls} value={draft.workingWeekdays} onChange={(e) => setDraft((p) => ({ ...p, workingWeekdays: e.target.value }))} placeholder="Çalışma saatleri (Hafta içi)" />
              <input className={inputCls} value={draft.workingSaturday} onChange={(e) => setDraft((p) => ({ ...p, workingSaturday: e.target.value }))} placeholder="Çalışma saatleri (Cumartesi)" />
              <input className={inputCls} value={draft.workingSunday} onChange={(e) => setDraft((p) => ({ ...p, workingSunday: e.target.value }))} placeholder="Çalışma saatleri (Pazar)" />
            </div>
          ) : null}

          {!loading && activeTab === "cover-photo" ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Kapak Fotoğrafı</h2>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="text-sm text-slate-600">Kapak görseli ({COVER_WIDTH}x{COVER_HEIGHT})</div>
                <div className="mt-3">
                  {draft.coverPhotoUrl ? (
                    <img src={draft.coverPhotoUrl} alt="Kapak" className="h-36 w-full rounded-xl border object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center rounded-xl border bg-white text-xs text-slate-400">Yok</div>
                  )}
                </div>
                <input type="file" accept="image/*" className="mt-3 w-full text-xs" onChange={(e) => void onPickCover(e.target.files?.[0] ?? null)} />
                <input className={`${inputCls} mt-3`} value={draft.coverPhotoUrl} onChange={(e) => setDraft((p) => ({ ...p, coverPhotoUrl: e.target.value }))} placeholder="veya URL yapıştır" />
              </div>
            </div>
          ) : null}

          {!loading && activeTab === "security" ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Güvenlik</h2>
              <input className={`${inputCls} bg-slate-100`} value={authEmail} readOnly placeholder="Giriş e-postası" />
              <input
                type="password"
                className={inputCls}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mevcut şifre"
              />
              <input
                type="password"
                className={inputCls}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni şifre"
              />
              <input
                type="password"
                className={inputCls}
                value={newPasswordAgain}
                onChange={(e) => setNewPasswordAgain(e.target.value)}
                placeholder="Yeni şifre (tekrar)"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void changePassword()}
                  disabled={securityLoading}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Şifreyi Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => void sendResetPasswordMail()}
                  disabled={securityLoading}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Şifre Sıfırlama Maili Gönder
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <button type="button" onClick={() => void saveProfile()} disabled={loading || saving} className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
