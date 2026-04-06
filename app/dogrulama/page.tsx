"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function VerificationPageContent() {
  const searchParams = useSearchParams();
  const prefillName = searchParams.get("name") ?? "";
  const prefillUrl = searchParams.get("url") ?? "";

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState(prefillName);
  const [evlumbaUrl, setEvlumbaUrl] = useState(prefillUrl);
  const [email, setEmail] = useState("");
  const [petition, setPetition] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSending(true);

    const response = await fetch("/api/profile/verification/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, evlumbaUrl, email, petition }),
    });

    const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };

    if (!response.ok || !data.ok) {
      setError(data.error ?? "Bir hata oluştu.");
      setSending(false);
      return;
    }

    setMessage(data.message ?? "Talebin gönderildi.");
    setSending(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_22px_55px_-40px_rgba(0,0,0,0.25)] backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hesap Doğrulama</h1>
        <p className="mt-2 text-sm text-slate-600">
          Evlumba&apos;daki profesyonel hesabınızın size ait olduğunu doğrulamak için aşağıdaki formu doldurun. Talebiniz admin ekibi tarafından incelenecektir.
        </p>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        {!message ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ad Soyad *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Evlumba Profil URL *</label>
              <input
                type="text"
                value={evlumbaUrl}
                onChange={(e) => setEvlumbaUrl(e.target.value)}
                required
                placeholder="https://www.evlumba.com/tasarimcilar/..."
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">E-posta Adresi *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Doğrulama Dilekçesi *</label>
              <p className="mb-2 text-xs text-slate-500">
                Bu hesabın size ait olduğunu kanıtlayan bir açıklama yazın (en az 20 karakter).
              </p>
              <textarea
                value={petition}
                onChange={(e) => setPetition(e.target.value)}
                required
                rows={5}
                placeholder="Bu hesabın bana ait olduğunu doğrulamak istiyorum. Firma adım ... olarak ... yılından beri faaliyet gösteriyorum..."
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Gönderiliyor..." : "Doğrulama Talebi Gönder"}
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-2xl px-4 py-12 text-center text-sm text-slate-500">Yükleniyor...</main>}>
      <VerificationPageContent />
    </Suspense>
  );
}
