"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  website: "",
  instagram: "",
  facebook: "",
  linkedin: "",
  coverPhotoUrl: "",
  avatarUrl: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("homeowner");
  const [authEmail, setAuthEmail] = useState("");
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
  const isProfessional = role === "designer" || role === "designer_pending";

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
          if (!cancelled) setMessage("Profil için önce giriş yapmalısın.");
          return;
        }

        setUserId(data.user.id);
        setAuthEmail(data.user.email ?? "");
        const { data: profile } = await withTimeout(
          supabase
            .from("profiles")
            .select(
              "full_name, role, avatar_url, city, phone, contact_email, address, website, instagram, facebook, linkedin, cover_photo_url"
            )
            .eq("id", data.user.id)
            .maybeSingle(),
          12000,
          "Profil verisi alınırken zaman aşımı oldu."
        );

        if (!cancelled) {
          setRole(profile?.role || "homeowner");
          setDraft({
            ...DEFAULT_DRAFT,
            fullName: profile?.full_name || "",
            avatarUrl: profile?.avatar_url || "",
            city: profile?.city || "",
            phone: profile?.phone || "",
            contactEmail: profile?.contact_email || data.user.email || "",
            address: profile?.address || "",
            website: profile?.website || "",
            instagram: profile?.instagram || "",
            facebook: profile?.facebook || "",
            linkedin: profile?.linkedin || "",
            coverPhotoUrl: profile?.cover_photo_url || "",
          });
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
    if (requestedTab && tabs.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab as TabId);
    }

    setQueryHandled(true);
  }, [loading, queryHandled, searchParams]);

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
    if (!draft.fullName.trim()) {
      setMessage("Tam ad zorunlu.");
      setActiveTab("general");
      return;
    }
    if (!draft.contactEmail.trim() || !isValidEmail(draft.contactEmail.trim())) {
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
        full_name: draft.fullName.trim(),
        city: draft.city || null,
        avatar_url: draft.avatarUrl || null,
        cover_photo_url: draft.coverPhotoUrl || null,
        phone: draft.phone || null,
        contact_email: draft.contactEmail.trim(),
        address: draft.address || null,
        website: draft.website || null,
        instagram: draft.instagram || null,
        facebook: draft.facebook || null,
        linkedin: draft.linkedin || null,
      });

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
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/sifremi-unuttum` : undefined,
      });
      if (error) return toast(error.message);
      toast("Şifre sıfırlama maili gönderildi.");
    } finally {
      setSecurityLoading(false);
    }
  }

  async function upgradeToProfessional() {
    if (!userId) return;
    setUpgradeLoading(true);
    setMessage(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: roleError } = await supabase.from("profiles").upsert({
        id: userId,
        role: "designer",
      });
      if (roleError) {
        toast(roleError.message);
        return;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { role: "designer" },
      });
      if (metadataError) {
        console.warn("Role metadata update warning:", metadataError.message);
      }

      setRole("designer");
      setShowUpgradeConfirm(false);
      setProSwitchChecked(false);
      setMessage("Hesabın profesyonel hesaba geçirildi ✅");
      toast("Profesyonel hesap aktif edildi.");
      router.refresh();
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
            <button
              type="button"
              onClick={() => {
                if (isProfessional && userId) {
                  router.push(`/tasarimcilar/supa_${userId}`);
                  return;
                }
                setActiveTab("professional");
                toast("Görüntülemek için önce profesyonel hesaba geç.");
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Görüntüle
            </button>
          </div>
          <div className="mt-4 space-y-1">
            {tabs
              .filter((tab) => !(tab.id === "professional" && isProfessional))
              .map((tab) => (
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
                  <button
                    type="button"
                    onClick={() => router.push("/messages")}
                    className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Mesajlar
                  </button>
                </div>
                <div className="space-y-3">
                  <input className={inputCls} value={draft.fullName} onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))} placeholder="Tam Ad" />
                  <input className={inputCls} value={draft.city} onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))} placeholder="Şehir" />
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === "contact" ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">İletişim</h2>
              <input className={inputCls} value={draft.contactEmail} onChange={(e) => setDraft((p) => ({ ...p, contactEmail: e.target.value }))} placeholder="İletişim e-posta" />
              <input className={inputCls} value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} placeholder="Telefon" />
              <input className={inputCls} value={draft.address} onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))} placeholder="Adres" />
              <input className={inputCls} value={draft.website} onChange={(e) => setDraft((p) => ({ ...p, website: e.target.value }))} placeholder="Website" />
              <input className={inputCls} value={draft.instagram} onChange={(e) => setDraft((p) => ({ ...p, instagram: e.target.value }))} placeholder="Instagram" />
              <input className={inputCls} value={draft.facebook} onChange={(e) => setDraft((p) => ({ ...p, facebook: e.target.value }))} placeholder="Facebook" />
              <input className={inputCls} value={draft.linkedin} onChange={(e) => setDraft((p) => ({ ...p, linkedin: e.target.value }))} placeholder="LinkedIn" />
            </div>
          ) : null}

          {!loading && activeTab === "cover-photo" ? (
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
