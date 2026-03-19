"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SifreYenile() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let done = false;

    const failTimer = setTimeout(() => {
      if (!done) {
        done = true;
        setError("Bağlantı zaman aşımına uğradı. Şifremi unuttum sayfasından tekrar deneyin.");
      }
    }, 8000);

    async function initSession() {
      try {
        // PKCE flow: ?code= in query params
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            window.history.replaceState(null, "", window.location.pathname);
            if (!done) { done = true; setSessionReady(true); }
            return;
          }
        }

        // Implicit flow: #access_token= in URL fragment
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken && refreshToken && type === "recovery") {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            window.history.replaceState(null, "", window.location.pathname);
            if (!done) { done = true; setSessionReady(true); }
            return;
          }
        }

        // Fallback: session already set
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (!done) { done = true; setSessionReady(true); }
          return;
        }

        if (!done) { done = true; setError("Geçersiz veya süresi dolmuş bağlantı. Şifremi unuttum sayfasından tekrar deneyin."); }
      } catch {
        if (!done) { done = true; setError("Bir hata oluştu. Lütfen şifremi unuttum sayfasından tekrar deneyin."); }
      }
    }

    initSession();
    return () => clearTimeout(failTimer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Şifre güncellenemedi: " + error.message);
    } else {
      router.push("/giris?reset=success");
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Yeni Şifre Belirle</h1>
      <p className="mt-2 text-sm text-gray-600">Hesabın için yeni bir şifre oluştur.</p>

      {!sessionReady && error ? (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
          <div className="mt-2">
            <a href="/sifremi-unuttum" className="underline">Tekrar dene</a>
          </div>
        </div>
      ) : !sessionReady ? (
        <p className="mt-4 text-sm text-gray-500">Yükleniyor…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Yeni Şifre</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Şifre Tekrar</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="Şifreni tekrar gir"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Kaydediliyor…" : "Şifremi Güncelle"}
          </button>
        </form>
      )}
    </div>
  );
}
