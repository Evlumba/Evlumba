"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SifremiUnuttum() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/sifre-yenile`,
    });
    setLoading(false);
    if (error) {
      setError("Bir hata oluştu. Lütfen tekrar dene.");
    } else {
      setSent(true);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Şifremi Unuttum</h1>

      {sent ? (
        <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Şifre sıfırlama bağlantısı gönderildi. E-postanı kontrol et.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm text-gray-600">
            Kayıtlı e-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim.
          </p>
          <input
            type="email"
            required
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-gray-400"
            placeholder="mail@ornek.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
          </button>
        </form>
      )}

      <div className="mt-4 text-sm">
        <Link className="underline" href="/giris">Girişe dön</Link>
      </div>
    </div>
  );
}
