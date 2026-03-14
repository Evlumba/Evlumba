"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { loginUser, syncSessionFromSupabase, type Role } from "@/lib/storage";
import { toast } from "@/lib/toast";

function RoleCard({
  title,
  desc,
  cta,
  selected,
  onClick,
}: {
  title: string;
  desc: string;
  cta: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border bg-white p-6 text-left transition ${
        selected ? "border-sky-500 shadow-lg shadow-sky-100" : "border-slate-200 hover:border-sky-300"
      }`}
    >
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
      <div className="mt-5 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
        {cta}
      </div>
    </button>
  );
}

function KayitPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>("homeowner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [contactConsentTouched, setContactConsentTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const oauthHandledRef = useRef(false);

  const selectedRoleFromQuery = useMemo<Role>(() => {
    return searchParams.get("role") === "designer" ? "designer" : "homeowner";
  }, [searchParams]);

  const isOAuthReturn = useMemo(
    () => searchParams.get("oauth") === "1" || searchParams.has("code"),
    [searchParams]
  );
  const authError = searchParams.get("auth_error");
  const authErrorMessage =
    authError === "oauth_exchange_failed"
      ? "Google ile kayıt tamamlanamadı. Lütfen tekrar deneyin."
      : "";
  const showContactConsentError = contactConsentTouched && !contactConsent;

  useEffect(() => {
    setRole(selectedRoleFromQuery);
  }, [selectedRoleFromQuery]);

  useEffect(() => {
    if (!isOAuthReturn || oauthHandledRef.current) return;
    oauthHandledRef.current = true;

    let cancelled = false;
    const completeGoogleSignup = async () => {
      setFeedback("");
      const synced = await syncSessionFromSupabase();
      if (cancelled) return;
      if (!synced.ok || !synced.session?.id) {
        const msg = synced.error || "Google ile kayıt tamamlanamadı.";
        setFeedback(msg);
        toast(msg);
        setGoogleLoading(false);
        return;
      }

      const userId = synced.session.id;
      const desiredRole = selectedRoleFromQuery;
      const fallbackName = synced.session.name || "Yeni Kullanıcı";
      const supabase = getSupabaseBrowserClient();

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: fallbackName,
        role: desiredRole,
      });

      if (cancelled) return;
      if (profileError) {
        setFeedback(profileError.message);
        toast(profileError.message);
        setGoogleLoading(false);
        return;
      }

      await syncSessionFromSupabase();
      if (cancelled) return;

      setFeedback("Google ile kayıt başarılı. Yönlendiriliyorsun...");
      toast("Google ile kayıt başarılı");
      setGoogleLoading(false);
      router.push(desiredRole === "designer" ? "/designer-panel" : "/");
    };

    void completeGoogleSignup();

    return () => {
      cancelled = true;
    };
  }, [isOAuthReturn, router, selectedRoleFromQuery]);

  async function submit() {
    if (googleLoading) return;
    if (!contactConsent) {
      setContactConsentTouched(true);
      setFeedback("Devam etmek için iletişim linkini onaylamalısın.");
      toast("İletişim onayı zorunlu");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setFeedback("Email ve şifre zorunlu.");
      toast("Email ve şifre zorunlu");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Yeni Kullanıcı",
          email: email.trim(),
          password: password.trim(),
          role,
        }),
      });
      const result = (await res.json()) as {
        ok: boolean;
        error?: string;
        role?: Role;
      };

      if (!result.ok) {
        setFeedback(result.error || "Kayıt başarısız.");
        toast(result.error || "Kayıt başarısız");
        return;
      }

      const loginRes = await loginUser({ email: email.trim(), password: password.trim() });
      if (!loginRes.ok) {
        setFeedback(loginRes.error || "Kayıt oldu, giriş sırasında hata oluştu.");
        toast(loginRes.error || "Kayıt oldu, giriş sırasında hata oluştu.");
        router.push("/giris");
        return;
      }

      setFeedback("Kayıt başarılı. Yönlendiriliyorsun...");
      toast("Kayıt başarılı");
      router.push((result.role || role) === "designer" ? "/designer-panel" : "/");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
      setFeedback(msg);
      toast(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleEmailRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  async function signUpWithGoogle() {
    if (loading || googleLoading) return;
    if (!contactConsent) {
      setContactConsentTouched(true);
      setFeedback("Google ile kayıt için iletişim onayı zorunlu.");
      toast("İletişim onayı zorunlu");
      return;
    }
    setFeedback("");
    setGoogleLoading(true);

    const supabase = getSupabaseBrowserClient();
    const redirectUrl = new URL("/auth/callback", window.location.origin);
    redirectUrl.searchParams.set("flow", "signup");
    redirectUrl.searchParams.set("role", role);
    redirectUrl.searchParams.set("next", role === "designer" ? "/designer-panel" : "/");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl.toString(),
      },
    });

    if (error) {
      setGoogleLoading(false);
      setFeedback(error.message);
      toast(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-center text-3xl font-bold text-slate-900">
          Evlumba&apos;ya Hoş Geldiniz! Kaydolun veya Giriş Yapın
        </h1>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <RoleCard
            title="Ev Sahibi Olarak Kaydol"
            desc="İlham al, projeler kaydet, profesyonellerle iletişim kur."
            cta="Ev Sahibi Kaydı"
            selected={role === "homeowner"}
            onClick={() => setRole("homeowner")}
          />
          <RoleCard
            title="Profesyonel Olarak Kaydol"
            desc="İşini sergile, yeni müşterilere ulaş, liderlik kazan."
            cta="Profesyonel Kaydı"
            selected={role === "designer"}
            onClick={() => setRole("designer")}
          />
        </div>

        <section className="mx-auto mt-8 max-w-xl rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {role === "designer" ? "Profesyonel Kaydı" : "Ev Sahibi Kaydı"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {role === "designer"
              ? "Profesyonel hesap olarak kayıt oluyorsun."
              : "Ev sahibi hesap olarak kayıt oluyorsun."}
          </p>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              disabled={loading || googleLoading}
              onClick={() => void signUpWithGoogle()}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
            >
              {googleLoading
                ? "Google'a yönlendiriliyor..."
                : role === "designer"
                ? "Google ile profesyonel kayıt ol"
                : "Google ile kayıt ol"}
            </button>
            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">veya</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <form className="space-y-3" onSubmit={handleEmailRegisterSubmit}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ad Soyad (opsiyonel)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {role === "designer" ? "Profesyonel Hesap Oluştur" : "Ev Sahibi Hesap Oluştur"}
              </button>
            </form>
            <label
              className={`mt-2 flex items-start gap-2 text-sm ${
                showContactConsentError ? "text-red-600" : "text-slate-600"
              }`}
            >
              <input
                type="checkbox"
                checked={contactConsent}
                onChange={(e) => {
                  setContactConsent(e.target.checked);
                  setContactConsentTouched(true);
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
              />
              <span>
                <Link href="/iletisim" className="font-semibold text-sky-700 hover:underline">
                  İletişim
                </Link>{" "}
                sayfasını okudum ve onaylıyorum.
              </span>
            </label>
            {showContactConsentError ? (
              <p className="text-sm font-medium text-red-600">Zorunlu alan: Bu onayı vermelisin.</p>
            ) : null}
            {feedback || authErrorMessage ? (
              <p className="text-sm text-slate-600">{feedback || authErrorMessage}</p>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Zaten bir hesabın var mı?{" "}
            <Link href="/giris" className="font-semibold text-sky-700 hover:underline">
              Giriş yap
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

export default function KayitPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 px-4 py-10">Kayit sayfasi yukleniyor...</main>
      }
    >
      <KayitPageContent />
    </Suspense>
  );
}
