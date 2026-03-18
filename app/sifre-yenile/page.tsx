"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SifreYenile() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
}
