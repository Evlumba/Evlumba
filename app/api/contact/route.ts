import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ContactBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  company?: string;
  pageUrl?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function trimTo(value: string, maxLen: number) {
  return value.slice(0, maxLen).trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContactBody;

    const fullName = trimTo(String(body.fullName || ""), 80);
    const email = trimTo(String(body.email || "").toLowerCase(), 120);
    const phone = trimTo(String(body.phone || ""), 40);
    const subject = trimTo(String(body.subject || "Genel destek"), 120);
    const message = trimTo(String(body.message || ""), 3000);
    const company = trimTo(String(body.company || ""), 120);
    const pageUrl = trimTo(String(body.pageUrl || ""), 400);

    // Honeypot: bot dolumunu sessizce başarılı dön.
    if (company) {
      return NextResponse.json({ ok: true });
    }

    if (fullName.length < 2) {
      return NextResponse.json({ ok: false, error: "Ad soyad en az 2 karakter olmalı." }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: "Geçerli bir e-posta adresi gir." }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ ok: false, error: "Mesaj en az 10 karakter olmalı." }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const contactTo = process.env.CONTACT_TO_EMAIL || "info@evlumba.com";
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "Evlumba <onboarding@resend.dev>";

    if (!resendApiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Mail servisi henüz yapılandırılmamış. RESEND_API_KEY tanımlanmalı.",
        },
        { status: 503 }
      );
    }

    const submittedAt = new Date().toISOString();
    const safeSubject = subject || "Genel destek";
    const safePhone = phone || "-";
    const safePage = pageUrl || "-";

    const text = [
      "Evlumba iletişim formu",
      "",
      `Ad Soyad: ${fullName}`,
      `E-posta: ${email}`,
      `Telefon: ${safePhone}`,
      `Konu: ${safeSubject}`,
      `Sayfa: ${safePage}`,
      `Tarih: ${submittedAt}`,
      "",
      "Mesaj:",
      message,
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
        <h2 style="margin:0 0 12px">Evlumba iletişim formu</h2>
        <p><strong>Ad Soyad:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>E-posta:</strong> ${escapeHtml(email)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(safePhone)}</p>
        <p><strong>Konu:</strong> ${escapeHtml(safeSubject)}</p>
        <p><strong>Sayfa:</strong> ${escapeHtml(safePage)}</p>
        <p><strong>Tarih:</strong> ${escapeHtml(submittedAt)}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
        <p><strong>Mesaj:</strong></p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>
    `;

    const sendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [contactTo],
        reply_to: email,
        subject: `[Evlumba İletişim] ${safeSubject}`,
        text,
        html,
      }),
    });

    if (!sendResponse.ok) {
      const errorPayload = (await sendResponse.json().catch(() => null)) as { message?: string } | null;
      const providerMessage = errorPayload?.message || "Mail sağlayıcısı hatası.";
      return NextResponse.json({ ok: false, error: providerMessage }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
