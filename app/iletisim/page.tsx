"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "@/lib/toast";

type ContactFormState = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  company: string;
};

const INITIAL_FORM: ContactFormState = {
  fullName: "",
  email: "",
  phone: "",
  subject: "Genel destek",
  message: "",
  company: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function IletisimPage() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (fullName.length < 2) {
      setFeedback("Lütfen ad soyad bilgisini gir.");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setFeedback("Geçerli bir e-posta adresi gir.");
      return;
    }
    if (message.length < 10) {
      setFeedback("Mesajın en az 10 karakter olmalı.");
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          subject,
          message,
          company: form.company,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !payload?.ok) {
        const errMsg = payload?.error || "Mesaj gönderilemedi. Lütfen tekrar dene.";
        setFeedback(errMsg);
        toast(errMsg);
        return;
      }

      setForm(INITIAL_FORM);
      setFeedback("Mesajın bize ulaştı. En kısa sürede dönüş yapacağız.");
      toast("Mesaj gönderildi ✅");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Mesaj gönderilemedi.";
      setFeedback(errMsg);
      toast(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_40%),#f8fafc] px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/75 p-7 shadow-[0_32px_80px_-55px_rgba(15,23,42,0.6)] backdrop-blur-xl">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.26), rgba(99,102,241,0))" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-24 -bottom-28 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.2), rgba(16,185,129,0))" }}
            aria-hidden="true"
          />

          <div className="relative">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-slate-600">
              İLETİŞİM
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              Evlumba ekibiyle iletişime geç
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ürün, destek, iş birliği veya geri bildirim için formu doldur. Mesajların
              doğrudan <span className="font-semibold text-slate-900">info@evlumba.com</span> adresine iletilir.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
                <div className="text-xs font-semibold tracking-wide text-slate-500">E-POSTA</div>
                <a href="mailto:info@evlumba.com" className="mt-1 block text-sm font-semibold text-slate-900">
                  info@evlumba.com
                </a>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
                <div className="text-xs font-semibold tracking-wide text-slate-500">LOKASYON</div>
                <p className="mt-1 text-sm font-semibold text-slate-900">Kadıköy / İstanbul</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
                <div className="text-xs font-semibold tracking-wide text-slate-500">YANIT SÜRESİ</div>
                <p className="mt-1 text-sm text-slate-700">Çalışma saatlerinde genelde aynı gün içinde.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ana sayfa
              </Link>
              <Link
                href="/gizlilik"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Gizlilik
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">İletişim Formu</h2>
          <p className="mt-2 text-sm text-slate-600">
            Formu doldurduğunda mesajın otomatik olarak destek ekibine iletilir.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
              autoComplete="off"
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Ad Soyad</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Ad Soyad"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">E-posta</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="mail@ornek.com"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Telefon (opsiyonel)</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="+90 5xx xxx xx xx"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Konu</span>
                <select
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option>Genel destek</option>
                  <option>Teknik sorun</option>
                  <option>Profesyonel üyelik</option>
                  <option>İş birliği</option>
                  <option>Diğer</option>
                </select>
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Mesaj</span>
              <textarea
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                required
                rows={7}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Mesajını yaz..."
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Gönderiliyor..." : "Mesajı Gönder"}
            </button>

            {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}
