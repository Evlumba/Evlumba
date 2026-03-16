import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { ok: false, error: authError?.message || "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const user = authData.user;
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const accountEmail = firstNonEmpty(
      user.email,
      typeof metadata.email === "string" ? metadata.email : "",
      typeof metadata.email_address === "string" ? metadata.email_address : ""
    );
    const fullName = firstNonEmpty(
      typeof metadata.full_name === "string" ? metadata.full_name : "",
      typeof metadata.name === "string" ? metadata.name : "",
      accountEmail ? accountEmail.split("@")[0] : "",
      "Kullanıcı"
    );

    const admin = getSupabaseAdminClient();
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        role: "designer",
        full_name: fullName,
        contact_email: accountEmail || null,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.json(
        { ok: false, error: profileError.message },
        { status: 500 }
      );
    }

    const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...metadata,
        role: "designer",
      },
    });

    if (metadataError) {
      return NextResponse.json(
        {
          ok: false,
          error: metadataError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: {
        id: user.id,
        role: "designer",
        full_name: fullName,
        contact_email: accountEmail || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rol güncellenemedi.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
