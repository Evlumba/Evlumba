"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SifreYenile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const isRecoveryType = searchParams.get("type") === "recovery";
  const hasResetError = searchParams.get("reset_error") === "1";
  const needsRecoveryRedirect = Boolean(code || tokenHash || isRecoveryType);
  const linkIsInvalid = hasResetError || invalidLink;

  useEffect(() => {
    if (needsRecoveryRedirect) {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (code) callbackUrl.searchParams.set("code", code);
      if (tokenHash) callbackUrl.searchParams.set("token_hash", tokenHash);
      callbackUrl.searchParams.set("type", "recovery");
      callbackUrl.searchParams.set("next", "/sifre-yenile");
      window.location.replace(callbackUrl.toString());
    }
  }, [needsRecoveryRedirect, code, tokenHash]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (linkIsInvalid) return;
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
      const normalized = error.message.toLowerCase();
      if (normalized.includes("auth session missing") || normalized.includes("invalid jwt")) {
        setInvalidLink(true);
        setError("Bağlantı geçersiz veya süresi dolmuş. Şifremi unuttum sayfasından tekrar deneyin.");
        return;
      }
      setError("Şifre güncellenemedi: " + error.message);
    } else {
      router.push("/giris?reset=success");
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Yeni Şifre Belirle</h1>
      <p className="mt-2 text-sm text-gray-600">Hesabın için yeni bir şifre oluştur.</p>

      {needsRecoveryRedirect ? (
        <p className="mt-4 text-sm text-gray-500">Bağlantı doğrulanıyor…</p>
      ) : linkIsInvalid ? (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error ?? "Bağlantı geçersiz veya süresi dolmuş. Şifremi unuttum sayfasından tekrar deneyin."}
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
