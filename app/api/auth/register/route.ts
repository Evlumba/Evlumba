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
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role },
    });

    if (createError) {
      const msg = createError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("exists")) {
        return NextResponse.json(
          { ok: false, error: "Bu e-posta zaten kayıtlı." },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: false, error: createError.message }, { status: 400 });
    }

    if (!created.user) {
      return NextResponse.json({ ok: false, error: "Kullanıcı oluşturulamadı." }, { status: 500 });
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: created.user.id,
      full_name: name,
      role,
    });

    if (profileError) {
      return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
