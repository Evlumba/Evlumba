import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Role = "homeowner" | "designer";

function isRole(value: string | null): value is Role {
  return value === "homeowner" || value === "designer";
}

function sanitizeNextPath(raw: string | null): string {
  if (!raw) return "/";
  const value = raw.trim();
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawRole = requestUrl.searchParams.get("role");
  const flow = requestUrl.searchParams.get("flow");

  const roleFromQuery: Role | null = isRole(rawRole) ? rawRole : null;
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const fallbackAfterSignup = roleFromQuery === "designer" ? "/designer-panel" : "/";
  const targetPath = flow === "signup" ? (nextPath === "/" ? fallbackAfterSignup : nextPath) : nextPath;

  const supabase = await getSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errorUrl = new URL("/giris", requestUrl.origin);
      errorUrl.searchParams.set("auth_error", "oauth_exchange_failed");
      return NextResponse.redirect(errorUrl);
    }
  }

  const { data: authData } = await supabase.auth.getUser();
  if (authData.user) {
    const metadata = authData.user.user_metadata || {};
    const metadataName =
      (metadata.full_name as string | undefined) ||
      (metadata.name as string | undefined) ||
      (authData.user.email ? authData.user.email.split("@")[0] : "Kullanıcı");

    const metadataRole = metadata.role === "designer" ? "designer" : "homeowner";
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", authData.user.id)
      .maybeSingle();

    const existingRole =
      typeof existingProfile?.role === "string" && existingProfile.role.trim()
        ? existingProfile.role
        : null;
    const existingName =
      typeof existingProfile?.full_name === "string" && existingProfile.full_name.trim()
        ? existingProfile.full_name
        : null;

    const roleToSave = roleFromQuery || existingRole || metadataRole;
    const nameToSave = existingName || metadataName;

    await supabase.from("profiles").upsert(
      {
        id: authData.user.id,
        full_name: nameToSave,
        role: roleToSave,
      },
      { onConflict: "id" }
    );
  }

  return NextResponse.redirect(new URL(targetPath, requestUrl.origin));
}
