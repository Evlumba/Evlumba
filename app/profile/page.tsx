"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { logout } from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

const tabs = [
  { id: "general", label: "Genel" },
  { id: "contact", label: "İletişim" },
  { id: "cover-photo", label: "Kapak Fotoğrafı" },
  { id: "security", label: "Güvenlik" },
  { id: "professional", label: "Profesyonel Ol" },
] as const;

type TabId = (typeof tabs)[number]["id"];

type ProfileDraft = {
  fullName: string;
  city: string;
  phone: string;
  contactEmail: string;
  address: string;
  konum: string;
  website: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  coverPhotoUrl: string;
  avatarUrl: string;
};

const DEFAULT_DRAFT: ProfileDraft = {
  fullName: "",
  city: "",
  phone: "",
  contactEmail: "",
  address: "",
  konum: "",
  website: "",
  instagram: "",
  facebook: "",
  linkedin: "",
  coverPhotoUrl: "",
  avatarUrl: "",
};

const AUTH_REQUEST_TIMEOUT_MS = 6000;
const PROFILE_REQUEST_TIMEOUT_MS = 5000;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
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

function isGoogleUser(user: {
  app_metadata?: Record<string, unknown> | null;
  identities?: Array<{ provider?: string | null }> | null;
}) {
  const metadata = user.app_metadata ?? {};
  const provider = String(metadata.provider ?? "").toLowerCase();
  if (provider === "google") return true;

  const providers = Array.isArray(metadata.providers)
    ? metadata.providers.map((item) => String(item).toLowerCase())
    : [];
  if (providers.includes("google")) return true;

  const identityProviders = Array.isArray(user.identities)
    ? user.identities.map((identity) => String(identity?.provider ?? "").toLowerCase())
    : [];
  return identityProviders.includes("google");
}

function pickGoogleFullName(
  user: { user_metadata?: Record<string, unknown> | null },
  fallbackEmail = ""
) {
  const metadata = user.user_metadata ?? {};
  const fullName = String(metadata.full_name ?? "").trim();
  if (fullName) return fullName;

  const name = String(metadata.name ?? "").trim();
  if (name) return name;

  const givenName = String(metadata.given_name ?? "").trim();
  const familyName = String(metadata.family_name ?? "").trim();
  const combined = `${givenName} ${familyName}`.trim();
  if (combined) return combined;

  return fallbackEmail ? fallbackEmail.split("@")[0] : "";
}

function pickAuthEmail(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: Array<{
    email?: string | null;
    identity_data?: Record<string, unknown> | null;
  }> | null;
}) {
  const directEmail = String(user.email ?? "").trim();
  if (directEmail) return directEmail;

  const metadata = user.user_metadata ?? {};
  const metadataEmail = firstNonEmpty(
    typeof metadata.email === "string" ? metadata.email : "",
    typeof metadata.email_address === "string" ? metadata.email_address : ""
  );
  if (metadataEmail) return metadataEmail;

  if (!Array.isArray(user.identities)) return "";
  return firstNonEmpty(
    ...user.identities.map((identity) => {
      const identityDataEmail =
        identity?.identity_data && typeof identity.identity_data.email === "string"
          ? identity.identity_data.email
          : "";
      return firstNonEmpty(identity?.email, identityDataEmail);
    })
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("homeowner");
  const [authEmail, setAuthEmail] = useState("");
  const [googleLockedName, setGoogleLockedName] = useState("");
  const [googleLockedEmail, setGoogleLockedEmail] = useState("");
  const [draft, setDraft] = useState<ProfileDraft>(DEFAULT_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [securityLoading, setSecurityLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordAgain, setNewPasswordAgain] = useState("");
  const [proSwitchChecked, setProSwitchChecked] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [queryHandled, setQueryHandled] = useState(false);
  const isHomeowner = role === "homeowner";
  const isProfessional = role === "designer" || role === "designer_pending";
  const canEditFullName = true;
  const visibleTabs = tabs.filter((tab) => {
    if (tab.id === "professional" && isProfessional) return false;
    if (tab.id === "cover-photo" && !isProfessional) return false;
    return true;
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setMessage(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await withTimeout(
          supabase.auth.getUser(),
          AUTH_REQUEST_TIMEOUT_MS,
          "Oturum kontrolü zaman aşımına uğradı."
        );
        if (error || !data.user) {
          if (!cancelled) setMessage("Profil için önce giriş yapmalısın.");
          return;
        }

        const metadata = data.user.user_metadata ?? {};
        const metadataRole =
          metadata.role === "designer" || metadata.role === "designer_pending"
            ? metadata.role
            : "homeowner";
        const googleAccount = isGoogleUser(data.user);
        const googleEmail = pickAuthEmail(data.user);
        const googleName = pickGoogleFullName(data.user, googleEmail);
        const metadataName = firstNonEmpty(
          typeof metadata.full_name === "string" ? metadata.full_name : "",
          typeof metadata.name === "string" ? metadata.name : "",
          googleEmail ? googleEmail.split("@")[0] : ""
        );
        const fallbackName = firstNonEmpty(googleAccount ? googleName : "", metadataName);
        const baseDraft: ProfileDraft = {
          ...DEFAULT_DRAFT,
          fullName: fallbackName,
          contactEmail: firstNonEmpty(googleEmail),
        };

        if (cancelled) return;

        setUserId(data.user.id);
        setAuthEmail(googleEmail);
        setRole(metadataRole);
        setGoogleLockedName(googleAccount ? firstNonEmpty(googleName, fallbackName) : "");
        setGoogleLockedEmail(googleAccount ? firstNonEmpty(googleEmail) : "");
        setDraft(baseDraft);
        setLoading(false);

        try {
          const { data: profile, error: profileError } = await withTimeout(
            supabase
              .from("profiles")
              .select(
                "full_name, role, avatar_url, city, phone, contact_email, address, konum, website, instagram, facebook, linkedin, cover_photo_url"
              )
              .eq("id", data.user.id)
              .maybeSingle(),
            PROFILE_REQUEST_TIMEOUT_MS,
            "Profil verisi alınırken zaman aşımı oldu."
          );

          if (profileError) {
            throw profileError;
          }

          if (!cancelled) {
            const mergedRole = profile?.role || metadataRole;
            const mergedIsProfessional =
              mergedRole === "designer" || mergedRole === "designer_pending";
            const mergedFullName = firstNonEmpty(
              profile?.full_name,
              googleAccount ? googleName : "",
              baseDraft.fullName
            );
            const mergedContactEmail = mergedIsProfessional
              ? firstNonEmpty(profile?.contact_email, baseDraft.contactEmail)
              : firstNonEmpty(googleEmail, profile?.contact_email, baseDraft.contactEmail);
            const mergedDraft: ProfileDraft = {
              ...baseDraft,
              fullName: mergedFullName,
              avatarUrl: profile?.avatar_url || baseDraft.avatarUrl,
              city: profile?.city || baseDraft.city,
              phone: profile?.phone || baseDraft.phone,
              contactEmail: mergedContactEmail,
              address: profile?.address || baseDraft.address,
              konum: profile?.konum || baseDraft.konum,
              website: profile?.website || baseDraft.website,
              instagram: profile?.instagram || baseDraft.instagram,
              facebook: profile?.facebook || baseDraft.facebook,
              linkedin: profile?.linkedin || baseDraft.linkedin,
              coverPhotoUrl: profile?.cover_photo_url || baseDraft.coverPhotoUrl,
            };

            setRole(mergedRole);
            setGoogleLockedName(googleAccount ? firstNonEmpty(mergedFullName, googleName) : "");
            setGoogleLockedEmail(googleAccount ? firstNonEmpty(googleEmail, mergedContactEmail) : "");
            setDraft(mergedDraft);

            if (mergedRole === "homeowner" && googleEmail) {
              const currentProfileName = firstNonEmpty(profile?.full_name);
              const currentProfileEmail = firstNonEmpty(profile?.contact_email).toLowerCase();
              const normalizedGoogleName = firstNonEmpty(googleName, mergedDraft.fullName);
              const normalizedGoogleEmail = firstNonEmpty(googleEmail, mergedDraft.contactEmail).toLowerCase();

              if (
                (normalizedGoogleName && currentProfileName !== normalizedGoogleName) ||
                currentProfileEmail !== normalizedGoogleEmail
              ) {
                void supabase.from("profiles").upsert(
                  {
                    id: data.user.id,
                    role: mergedRole,
                    full_name: normalizedGoogleName || mergedDraft.fullName || null,
                    contact_email: googleEmail,
                  },
                  { onConflict: "id" }
                );
              }
            }
          }
        } catch (profileLoadError) {
          if (!cancelled) {
            console.warn("Profile fetch warning:", profileLoadError);
          }
        }
      } catch (loadError) {
        if (!cancelled) setMessage(loadError instanceof Error ? loadError.message : "Profil yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || queryHandled) return;

    const requestedTab = searchParams.get("tab");
    if (requestedTab && visibleTabs.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab as TabId);
    }

    setQueryHandled(true);
  }, [loading, queryHandled, searchParams, visibleTabs]);

  useEffect(() => {
    if (!isHomeowner) return;
    const contactEmailFromAuth = firstNonEmpty(authEmail, googleLockedEmail);
    if (!contactEmailFromAuth) return;
    setDraft((prev) => {
      if (prev.contactEmail.trim() === contactEmailFromAuth) return prev;
      return { ...prev, contactEmail: contactEmailFromAuth };
    });
  }, [isHomeowner, authEmail, googleLockedEmail]);

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
      const url = await fileToDataUrl(file);
      setDraft((prev) => ({ ...prev, coverPhotoUrl: url }));
    } catch {
      toast("Kapak fotoğrafı yüklenemedi");
    }
  }

  async function saveProfile() {
    if (!userId) return;
    const normalizedFullName = canEditFullName
      ? draft.fullName.trim()
      : firstNonEmpty(googleLockedName, draft.fullName);
    const normalizedContactEmail = firstNonEmpty(draft.contactEmail, authEmail, googleLockedEmail);

    if (!normalizedFullName) {
      setMessage("Tam ad zorunlu.");
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
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        role,
        full_name: normalizedFullName,
        city: draft.city || null,
        avatar_url: draft.avatarUrl || null,
        cover_photo_url: draft.coverPhotoUrl || null,
        phone: draft.phone || null,
        contact_email: normalizedContactEmail,
        address: draft.address || null,
        konum: draft.konum || null,
        website: draft.website || null,
        instagram: draft.instagram || null,
        facebook: draft.facebook || null,
        linkedin: draft.linkedin || null,
      });

      if (!error) {
        setDraft((prev) => ({
          ...prev,
          fullName: normalizedFullName,
          contactEmail: normalizedContactEmail,
        }));
      }
      setMessage(error ? error.message : "Profil kaydedildi ✅");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!authEmail) return toast("Giriş e-postası bulunamadı.");
    if (!currentPassword) return toast("Mevcut şifre zorunlu.");
    if (newPassword.length < 6) return toast("Yeni şifre en az 6 karakter olmalı.");
    if (newPassword !== newPasswordAgain) return toast("Yeni şifreler aynı olmalı.");

    setSecurityLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: currentPassword,
      });
      if (verifyError) return toast("Mevcut şifre hatalı.");

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) return toast(updateError.message);

      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordAgain("");
      toast("Şifre güncellendi.");
    } finally {
      setSecurityLoading(false);
    }
  }

  async function sendResetPasswordMail() {
    if (!authEmail) return toast("Giriş e-postası bulunamadı.");
    setSecurityLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?type=recovery&next=/sifre-yenile`
            : undefined,
      });
      if (error) return toast(error.message);
      toast("Şifre sıfırlama maili gönderildi.");
    } finally {
      setSecurityLoading(false);
    }
  }

  async function requestAccountDeletion() {
    if (!userId) return toast("Hesap silme için önce giriş yapmalısın.");

    const confirmed = window.confirm(
      "Hesabını pasife alıp 1 hafta sonra tamamen silinmek üzere işaretlemek istediğine emin misin?"
    );
    if (!confirmed) return;

    setSecurityLoading(true);
    try {
      const response = await fetch("/api/profile/account-deletion", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const result = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            message?: string;
            error?: string;
          }
        | null;

      if (!response.ok || !result?.ok) {
        const failMessage = result?.error || "Hesap silme süreci başlatılamadı.";
        setMessage(failMessage);
        toast(failMessage);
        return;
      }

      const infoMessage =
        result.message ||
        "hesabın pasife alındı ve 1 hafta içerisinde silinecek, bu süre içerisinde tekrar login olursan hesabının silme süreci duracaktır.";
      setMessage(infoMessage);
      toast(infoMessage);
      window.alert(infoMessage);

      await logout();
      router.replace("/giris?account_delete_scheduled=1");
    } catch (error) {
      const failMessage = error instanceof Error ? error.message : "Hesap silme süreci başlatılamadı.";
      setMessage(failMessage);
      toast(failMessage);
    } finally {
      setSecurityLoading(false);
    }
  }

  async function upgradeToProfessional() {
    setUpgradeLoading(true);
    setMessage(null);
    try {
      const response = await withTimeout(
        fetch("/api/profile/upgrade-role", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }),
        AUTH_REQUEST_TIMEOUT_MS + PROFILE_REQUEST_TIMEOUT_MS,
        "Hesap tipi değişikliği zaman aşımına uğradı."
      );

      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        profile?: {
          id: string;
          role: string;
          full_name?: string | null;
          contact_email?: string | null;
        };
      };

      if (!response.ok || !result.ok || result.profile?.role !== "designer") {
        const errorMessage = result.error || "Hesap tipi güncellenemedi. Lütfen tekrar dene.";
        setMessage(errorMessage);
        toast(errorMessage);
        return;
      }

      setUserId(result.profile.id);
      setRole("designer");
      setDraft((prev) => ({
        ...prev,
        fullName: firstNonEmpty(result.profile?.full_name, prev.fullName),
        contactEmail: firstNonEmpty(result.profile?.contact_email, prev.contactEmail),
      }));
      setShowUpgradeConfirm(false);
      setProSwitchChecked(false);
      setMessage("Hesabın profesyonel hesaba geçirildi ✅");
      toast("Profesyonel hesap aktif edildi.");
      router.replace("/designer-panel/profile");
    } catch (upgradeError) {
      const message =
        upgradeError instanceof Error
          ? upgradeError.message
          : "Hesap tipi değişikliği sırasında beklenmeyen bir hata oluştu.";
      setMessage(message);
      toast(message);
    } finally {
      setUpgradeLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-base font-bold text-slate-900">Profil Ayarları</h1>
            {isProfessional ? (
              <button
                type="button"
                onClick={() => {
                  if (!userId) return;
                  router.push(`/tasarimcilar/supa_${userId}`);
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Görüntüle
              </button>
            ) : null}
          </div>
          <div className="mt-4 space-y-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                  activeTab === tab.id
                    ? tab.id === "professional"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_14px_35px_-20px_rgba(79,70,229,0.9)]"
                      : "bg-sky-600 text-white"
                    : tab.id === "professional"
                    ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Coming Soon Features */}
          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">Yeni Özellikler</p>
            <div className="group relative">
              <button
                type="button"
                disabled
                className="flex w-full items-center gap-2.5 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2.5 text-left text-sm font-medium text-amber-800 opacity-75"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
                </span>
                Evlumba Tools
              </button>
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Çok Yakında ✨
              </span>
            </div>
            <div className="group relative">
              <button
                type="button"
                disabled
                className="flex w-full items-center gap-2.5 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5 text-left text-sm font-medium text-emerald-800 opacity-75"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                </span>
                Taşınıyorum
              </button>
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Çok Yakında ✨
              </span>
            </div>
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
                    className={`${inputCls}${!canEditFullName ? " bg-slate-100 text-slate-500" : ""}`}
                    value={draft.fullName}
                    onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Tam Ad"
                    readOnly={!canEditFullName}
                    aria-readonly={!canEditFullName}
                  />
                  <input className={inputCls} value={draft.city} onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))} placeholder="Şehir" />
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === "contact" ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">İletişim</h2>
              <input
                className={inputCls}
                value={draft.contactEmail}
                onChange={(e) => setDraft((p) => ({ ...p, contactEmail: e.target.value }))}
                placeholder="İletişim e-posta"
              />
              <input className={inputCls} value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} placeholder="Telefon" />
              <input className={inputCls} value={draft.address} onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))} placeholder="Adres" />
              <input className={inputCls} value={draft.konum} onChange={(e) => setDraft((p) => ({ ...p, konum: e.target.value }))} placeholder="Google Maps Konum URL'si" />
              <input className={inputCls} value={draft.website} onChange={(e) => setDraft((p) => ({ ...p, website: e.target.value }))} placeholder="Website" />
              <input className={inputCls} value={draft.instagram} onChange={(e) => setDraft((p) => ({ ...p, instagram: e.target.value }))} placeholder="Instagram" />
              <input className={inputCls} value={draft.facebook} onChange={(e) => setDraft((p) => ({ ...p, facebook: e.target.value }))} placeholder="Facebook" />
              <input className={inputCls} value={draft.linkedin} onChange={(e) => setDraft((p) => ({ ...p, linkedin: e.target.value }))} placeholder="LinkedIn" />
            </div>
          ) : null}

          {!loading && isProfessional && activeTab === "cover-photo" ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Kapak Fotoğrafı</h2>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="text-sm text-slate-600">Kapak görseli</div>
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
              <input className={`${inputCls} bg-slate-100`} value={authEmail} readOnly />
              <input type="password" className={inputCls} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Mevcut şifre" />
              <input type="password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Yeni şifre" />
              <input type="password" className={inputCls} value={newPasswordAgain} onChange={(e) => setNewPasswordAgain(e.target.value)} placeholder="Yeni şifre (tekrar)" />
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => void changePassword()} disabled={securityLoading} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  Şifreyi Güncelle
                </button>
                <button type="button" onClick={() => void sendResetPasswordMail()} disabled={securityLoading} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">
                  Şifre Sıfırlama Maili Gönder
                </button>
              </div>

            </div>
          ) : null}

          {!loading && activeTab === "professional" && !isProfessional ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Profesyonel Ol</h2>
              <div className="relative overflow-hidden rounded-[30px] border border-indigo-200/80 bg-white p-6 shadow-[0_32px_70px_-45px_rgba(15,23,42,0.55)]">
                <div
                  className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full blur-3xl"
                  style={{ background: "radial-gradient(circle, rgba(99,102,241,0.28), rgba(99,102,241,0))" }}
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -left-16 -bottom-20 h-56 w-56 rounded-full blur-3xl"
                  style={{ background: "radial-gradient(circle, rgba(16,185,129,0.2), rgba(16,185,129,0))" }}
                  aria-hidden="true"
                />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-700">
                    PROFESYONEL MOD
                  </div>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                    Profesyonel ol ve anında kazanmaya başla
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Portföyünü vitrine çıkar, lead topla, mesaj ve teklif akışını hızlandır.
                    Hesabını tek adımda profesyonel hesaba dönüştürebilirsin.
                  </p>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 text-xs font-semibold text-slate-700">
                      Portföy vitrini ile daha fazla görünürlük
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 text-xs font-semibold text-slate-700">
                      Daha hızlı lead ve mesaj akışı
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 text-xs font-semibold text-slate-700">
                      Profilden doğrudan teklif alma
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-indigo-300/80 bg-slate-900 px-4 py-3 text-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.7)]">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-sm font-semibold">Profesyonel hesaba geçiş</div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={proSwitchChecked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setProSwitchChecked(true);
                              setShowUpgradeConfirm(true);
                            } else {
                              setProSwitchChecked(false);
                            }
                          }}
                        />
                        <span className="h-9 w-16 rounded-full bg-white/30 transition peer-checked:bg-emerald-500" />
                        <span className="pointer-events-none absolute left-1 top-1 h-7 w-7 rounded-full bg-white shadow transition peer-checked:translate-x-7" />
                      </label>
                      <span className="text-xs font-medium text-white/75">Switch’i açıp onay vererek geçişi tamamla.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <button type="button" onClick={() => void saveProfile()} disabled={loading || saving} className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
          </div>

          <div className="mt-8 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => void requestAccountDeletion()}
              disabled={securityLoading}
              className="text-xs text-slate-400 underline decoration-slate-300 hover:text-rose-500 disabled:opacity-50"
            >
              Hesabımı sil
            </button>
          </div>
        </section>
      </div>

      {showUpgradeConfirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)]">
            <div className="text-xs font-semibold tracking-wide text-indigo-600">ONAY GEREKİYOR</div>
            <h3 className="mt-2 text-xl font-bold text-slate-900">Hesap tipi değişikliği</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hesabın <span className="font-semibold text-slate-900">Profesyonel hesap</span> olarak
              değiştirilecektir.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeConfirm(false);
                  setProSwitchChecked(false);
                }}
                disabled={upgradeLoading}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
              >
                Geri Dön
              </button>
              <button
                type="button"
                onClick={() => void upgradeToProfessional()}
                disabled={upgradeLoading}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {upgradeLoading ? "Onaylanıyor..." : "Onay"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={<main className="min-h-screen bg-slate-100 px-4 py-8">Profil yukleniyor...</main>}
    >
      <ProfilePageContent />
    </Suspense>
  );
}
