"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  consumeIntendedAction,
  executeIntendedAction,
  loginUser,
  syncSessionFromSupabase,
} from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

type AuthLoginViewProps = {
  title: string;
  subtitle: string;
  googleLabel: string;
};

function ArchitectureSide() {
  return (
    <aside className="relative hidden overflow-hidden border-l border-black/10 bg-[linear-gradient(160deg,#f5f1e8_0%,#edf3ef_52%,#f8f7f4_100%)] p-8 lg:block">
      <div className="absolute -left-10 -top-14 h-44 w-44 rounded-full bg-[#d9cdb6]/45 blur-3xl" />
      <div className="absolute -bottom-16 -right-12 h-56 w-56 rounded-full bg-[#c8d8cf]/45 blur-3xl" />

      <div className="relative rounded-3xl border border-black/10 bg-white/65 p-5 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          Mimari Doku
        </p>
        <h3 className="mt-3 text-xl font-semibold text-slate-900">
          Sade, dengeli, ışığı güçlü mekanlar
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Doğru profesyonelle eşleşmek için sadece giriş yapman yeterli.
        </p>
      </div>

      <div className="relative mt-5 overflow-hidden rounded-3xl border border-black/10 bg-white/70 p-3 shadow-[0_22px_60px_-45px_rgba(15,23,42,0.42)]">
        <svg
          viewBox="0 0 520 420"
          className="h-auto w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="12" y="12" width="496" height="396" rx="24" fill="#FDFCF8" />
          <rect x="32" y="34" width="456" height="352" rx="18" stroke="#334155" strokeOpacity="0.18" />
          <path d="M66 314H456" stroke="#0F172A" strokeOpacity="0.65" strokeWidth="2.4" />
          <path d="M96 314V196H220V314" stroke="#0F172A" strokeOpacity="0.75" strokeWidth="2.2" />
          <path d="M118 196V146H196V196" stroke="#0F172A" strokeOpacity="0.7" strokeWidth="2" />
          <path d="M254 314V176H422V314" stroke="#0F172A" strokeOpacity="0.78" strokeWidth="2.2" />
          <path d="M286 176V132H390V176" stroke="#0F172A" strokeOpacity="0.65" strokeWidth="2" />
          <path d="M66 114H236" stroke="#334155" strokeOpacity="0.45" strokeWidth="1.5" />
          <path d="M278 96H456" stroke="#334155" strokeOpacity="0.45" strokeWidth="1.5" />
          <circle cx="157" cy="174" r="8" fill="#D7C8A9" />
          <circle cx="338" cy="158" r="8" fill="#C4D8CB" />
          <rect x="116" y="232" width="38" height="68" rx="4" fill="#E9DFCB" />
          <rect x="316" y="214" width="58" height="86" rx="4" fill="#DCE9E2" />
        </svg>
      </div>
    </aside>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.35 12.27c0-.72-.06-1.25-.2-1.8H12v3.28h5.37c-.1.81-.64 2.04-1.84 2.86l-.02.11 2.68 2.04.19.02c1.73-1.56 2.97-3.85 2.97-6.51Z"
        fill="#4285F4"
      />
      <path
        d="M12 21.5c2.63 0 4.83-.85 6.44-2.3l-3.06-2.35c-.82.55-1.92.94-3.38.94-2.58 0-4.77-1.67-5.56-3.98l-.11.01-2.78 2.12-.04.1C5.1 19.19 8.29 21.5 12 21.5Z"
        fill="#34A853"
      />
      <path
        d="M6.44 13.81A5.8 5.8 0 0 1 6.11 12c0-.63.12-1.24.32-1.81l-.01-.12-2.82-2.16-.09.04A9.38 9.38 0 0 0 2.5 12c0 1.5.36 2.9 1 4.05l2.94-2.24Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.2c1.84 0 3.08.78 3.78 1.43l2.76-2.64C16.81 3.41 14.63 2.5 12 2.5c-3.7 0-6.9 2.3-8.5 5.65l2.93 2.23C7.23 7.86 9.42 6.2 12 6.2Z"
        fill="#EB4335"
      />
    </svg>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AuthLoginView({
  title,
  subtitle,
  googleLabel,
}: AuthLoginViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showGoogleConsent, setShowGoogleConsent] = useState(false);
  const [googleConsentChecked, setGoogleConsentChecked] = useState(false);
  const [googleConsentError, setGoogleConsentError] = useState<string | null>(null);
  const [consentAfterOauth, setConsentAfterOauth] = useState(false);
  const oauthHandledRef = useRef(false);

  const nextPath = useMemo(() => {
    const raw = searchParams.get("next")?.trim();
    if (!raw) return "/";
    return raw.startsWith("/") ? raw : "/";
  }, [searchParams]);

  const isOAuthReturn = useMemo(
    () => searchParams.get("oauth") === "1" || searchParams.has("code"),
    [searchParams]
  );
  const authError = searchParams.get("auth_error");
  const needsContactConsent = searchParams.get("needs_contact_consent") === "1";
  const authErrorMessage =
    authError === "oauth_exchange_failed"
      ? "Google ile giriş tamamlanamadı. Lütfen tekrar deneyin."
      : null;

  const afterLogin = useCallback((successMessage: string) => {
    const action = consumeIntendedAction();

    if (action) {
      executeIntendedAction(action);
      toast(successMessage);
      router.push(action.returnTo || "/");
      return;
    }

    toast(successMessage);
    router.push(nextPath || "/");
  }, [nextPath, router]);

  const afterGoogleLogin = useCallback((successMessage: string) => {
    consumeIntendedAction();
    toast(successMessage);
    router.push("/");
  }, [router]);

  const syncSessionWithRetry = useCallback(
    async (
      attempts = 6,
      delayMs = 250
    ): Promise<Awaited<ReturnType<typeof syncSessionFromSupabase>>> => {
      let lastResult: Awaited<ReturnType<typeof syncSessionFromSupabase>> = {
        ok: false,
        error: "Google ile giriş tamamlanamadı.",
      };
      for (let index = 0; index < attempts; index += 1) {
        lastResult = await syncSessionFromSupabase();
        if (lastResult.ok && lastResult.session?.id) return lastResult;
        if (index < attempts - 1) {
          await sleep(delayMs);
        }
      }
      return lastResult;
    },
    []
  );

  useEffect(() => {
    if (!isOAuthReturn || oauthHandledRef.current) return;
    oauthHandledRef.current = true;

    let cancelled = false;
    const completeOauthLogin = async () => {
      if (needsContactConsent) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error || !data.user) {
          setFormError(error?.message || "Google oturumu alınamadı.");
          return;
        }

        setFormError(null);
        setGoogleConsentChecked(false);
        setGoogleConsentError(null);
        setConsentAfterOauth(true);
        setShowGoogleConsent(true);
        return;
      }

      const synced = await syncSessionWithRetry();
      if (cancelled) return;
      if (!synced.ok) {
        setFormError(synced.error || "Google ile giriş tamamlanamadı.");
        return;
      }
      afterGoogleLogin("Google ile giriş başarılı ✅");
    };

    void completeOauthLogin();
    return () => {
      cancelled = true;
    };
  }, [afterGoogleLogin, isOAuthReturn, needsContactConsent, syncSessionWithRetry]);

  useEffect(() => {
    if (isOAuthReturn) return;

    let cancelled = false;
    const redirectIfAlreadyLoggedIn = async () => {
      const synced = await syncSessionFromSupabase();
      if (cancelled) return;
      if (!synced.ok || !synced.session?.id) return;
      router.replace(nextPath || "/");
    };

    void redirectIfAlreadyLoggedIn();
    return () => {
      cancelled = true;
    };
  }, [isOAuthReturn, nextPath, router]);

  async function handleEmailLogin() {
    if (loading || googleLoading) return;
    setFormError(null);
    setLoading(true);

    const response = await loginUser({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (!response.ok) {
      setFormError(response.error || "Giriş başarısız.");
      return;
    }

    afterLogin("Giriş başarılı ✅");
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleEmailLogin();
  }

  async function startGoogleLogin() {
    if (loading || googleLoading) return;
    setFormError(null);
    setGoogleLoading(true);

    const supabase = getSupabaseBrowserClient();
    const redirectUrl = new URL("/auth/callback", window.location.origin);
    redirectUrl.searchParams.set("flow", "login");
    if (nextPath && nextPath !== "/") {
      redirectUrl.searchParams.set("next", nextPath);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl.toString(),
      },
    });

    if (error) {
      setGoogleLoading(false);
      setFormError(error.message);
    }
  }

  function handleGoogleLogin() {
    void startGoogleLogin();
  }

  async function confirmGoogleConsent() {
    if (!googleConsentChecked) {
      setGoogleConsentError("Google ile devam etmek için iletişim onayı zorunlu.");
      return;
    }
    setShowGoogleConsent(false);

    if (consentAfterOauth) {
      setFormError(null);
      setGoogleLoading(true);
      const synced = await syncSessionWithRetry();
      setGoogleLoading(false);
      if (!synced.ok) {
        setFormError(synced.error || "Google ile giriş tamamlanamadı.");
        return;
      }
      setConsentAfterOauth(false);
      afterGoogleLogin("Google ile giriş başarılı ✅");
      return;
    }

    void startGoogleLogin();
  }

  return (
    <section className="mx-auto w-full max-w-5xl py-2">
      <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white/65 shadow-[0_40px_95px_-70px_rgba(15,23,42,0.5)] backdrop-blur">
        <div className="grid lg:grid-cols-[1fr_420px]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Evlumba Hesap
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

            <div className="mt-6 space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleIcon />
                {googleLoading ? "Yönlendiriliyor..." : googleLabel}
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">veya</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form className="space-y-3" onSubmit={handleEmailSubmit}>
                <div>
                  <label className="text-sm text-slate-700">E-posta</label>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ornek@evlumba.com"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-700">Şifre</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Şifreniz"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Giriş yapılıyor..." : "E-posta ile giriş yap"}
                </button>
              </form>

              {formError || authErrorMessage ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {formError || authErrorMessage}
                </p>
              ) : null}

              <div className="flex items-center justify-between text-sm text-slate-600">
                <Link href="/sifremi-unuttum" className="hover:text-slate-900 hover:underline">
                  Şifremi unuttum
                </Link>
                <Link href="/kayit" className="font-medium text-slate-800 hover:underline">
                  Hesap oluştur
                </Link>
              </div>
            </div>
          </div>

          <ArchitectureSide />
        </div>
      </div>

      {showGoogleConsent ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)]">
            <h3 className="text-lg font-semibold text-slate-900">Google ile Devam Et</h3>
            <p className="mt-2 text-sm text-slate-600">
              {consentAfterOauth
                ? "Bu Google hesabı sistemde yeni görünüyor. Devam etmeden önce iletişim onayı vermelisin."
                : "Devam etmeden önce iletişim metnini onaylamalısın."}
            </p>

            <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={googleConsentChecked}
                onChange={(event) => {
                  setGoogleConsentChecked(event.target.checked);
                  setGoogleConsentError(null);
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

            {googleConsentError ? (
              <p className="mt-2 text-sm font-medium text-red-600">{googleConsentError}</p>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!consentAfterOauth) {
                    setShowGoogleConsent(false);
                    return;
                  }

                  setShowGoogleConsent(false);
                  setConsentAfterOauth(false);
                  void (async () => {
                    const supabase = getSupabaseBrowserClient();
                    await supabase.auth.signOut();
                    router.replace("/giris");
                  })();
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={confirmGoogleConsent}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Devam Et
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
