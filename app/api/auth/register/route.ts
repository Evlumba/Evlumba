import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Role = "homeowner" | "designer";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
};

function isRole(value: unknown): value is Role {
  return value === "homeowner" || value === "designer";
}

async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;
    const name = String(body.name || "Yeni Kullanıcı").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = body.role;

    if (!email || !password || !isRole(role)) {
      return NextResponse.json(
        { ok: false, error: "Eksik veya geçersiz kayıt bilgisi." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Şifre en az 6 karakter olmalı." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { data: created, error: createError } = await withTimeout(
      admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, role },
      }),
      12000,
      "Kayıt servisi zaman aşımına uğradı. Lütfen tekrar deneyin."
    );

    if (createError) {
      const msg = createError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("exists")) {
        return NextResponse.json(
          { ok: false, error: "Bu e-posta zaten kayıtlı." },
          { status: 409 }
        );
      }
      if (
        msg.includes("rate") ||
        msg.includes("quota") ||
        msg.includes("limit") ||
        msg.includes("too many")
      ) {
        return NextResponse.json(
          { ok: false, error: "Kayıt sınırına ulaşıldı. Birkaç dakika sonra tekrar dene." },
          { status: 429 }
        );
      }
      return NextResponse.json({ ok: false, error: createError.message }, { status: 400 });
    }

    if (!created.user) {
      return NextResponse.json({ ok: false, error: "Kullanıcı oluşturulamadı." }, { status: 500 });
    }

    const { error: profileError } = await withTimeout(
      admin.from("profiles").upsert({
        id: created.user.id,
        full_name: name,
        role,
      }),
      8000,
      "Profil kaydı sırasında zaman aşımı oldu."
    );

    if (profileError) {
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
