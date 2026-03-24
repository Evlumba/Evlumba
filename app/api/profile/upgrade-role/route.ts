import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    let authData: { user: import("@supabase/supabase-js").User | null };
    let authError: { message: string } | null = null;

    if (bearerToken) {
      const { url, anonKey } = getSupabasePublicEnv();
      const tokenClient = createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${bearerToken}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const result = await tokenClient.auth.getUser(bearerToken);
      authData = result.data;
      authError = result.error;
    } else {
      const supabase = await getSupabaseServerClient();
      const result = await supabase.auth.getUser();
      authData = result.data;
      authError = result.error;
    }

    if (authError || !authData?.user) {
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
