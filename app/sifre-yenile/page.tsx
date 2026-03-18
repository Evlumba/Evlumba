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
    // Handle both PKCE flow (session already set via cookie by /auth/callback)
    // and implicit flow (tokens in URL fragment)
    const supabase = getSupabaseBrowserClient();

    async function initSession() {
      // First check if session already exists (set by /auth/callback PKCE flow)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
        return;
      }

      // Fallback: try to extract tokens from URL fragment (implicit flow)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (accessToken && refreshToken && type === "recovery") {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          // Clean up the fragment from URL
          window.history.replaceState(null, "", window.location.pathname);
          setSessionReady(true);
          return;
        }
      }

      // No valid session found
      setError("Geçersiz veya süresi dolmuş bağlantı. Şifremi unuttum sayfasından tekrar deneyin.");
    }

    initSession();
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
      setError("Şifre güncellenemedi. Bağlantı süresi dolmuş olabilir, tekrar dene.");
    } else {
      router.push("/giris?reset=success");
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Yeni Şifre Belirle</h1>
      <p className="mt-2 text-sm text-gray-600">Hesabın için yeni bir şifre oluştur.</p>

      {error && !sessionReady ? (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
          <div className="mt-2">
            <a href="/sifremi-unuttum" className="underline">Tekrar dene</a>
          </div>
        </div>
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
            disabled={loading || !sessionReady}
            className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Kaydediliyor…" : "Şifremi Güncelle"}
          </button>
        </form>
      )}
    </div>
  );
}
