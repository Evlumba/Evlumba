import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type UpdatePasswordBody = {
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpdatePasswordBody;
    const password = String(body?.password ?? "");

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Şifre en az 6 karakter olmalı." },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { ok: false, error: "Şifre sıfırlama oturumu geçersiz veya süresi dolmuş." },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message || "Şifre güncellenemedi." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Şifre güncellenirken beklenmeyen bir hata oluştu.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

