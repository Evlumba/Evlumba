import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

// export const dynamic = "force-dynamic"; // COST-FIX
export const revalidate = 21600; // COST-FIX: 6 hours

type Params = {
  params: Promise<{ id: string }>;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_REGEX.test(value);
}

type ProfileRow = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  avatar_url: string | null;
  about_details: Record<string, unknown> | null;
};

export async function GET(_req: Request, context: Params) {
  try {
    const { id } = await context.params;
    if (!id || !isUuid(id)) {
      return NextResponse.json({ ok: false, error: "Geçersiz profesyonel id" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, business_name, avatar_url, about_details")
      .eq("id", id)
      .in("role", ["designer", "designer_pending"])
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Profesyonel bulunamadı" }, { status: 404 });
    }

    const profile = data as ProfileRow;
    const aboutDetails = (profile.about_details ?? {}) as Record<string, unknown>;
    const name =
      profile.full_name?.trim() || profile.business_name?.trim() || "Profesyonel";

    return NextResponse.json({
      ok: true,
      profile: {
        id: profile.id,
        name,
        avatarUrl: profile.avatar_url?.trim() || null,
        blogHeaderTitle:
          typeof aboutDetails.blogHeaderTitle === "string"
            ? aboutDetails.blogHeaderTitle.trim()
            : "",
        blogHeaderDescription:
          typeof aboutDetails.blogHeaderDescription === "string"
            ? aboutDetails.blogHeaderDescription.trim()
            : "",
        blogHeaderImageUrl:
          typeof aboutDetails.blogHeaderImageUrl === "string"
            ? aboutDetails.blogHeaderImageUrl.trim()
            : "",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen hata";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
