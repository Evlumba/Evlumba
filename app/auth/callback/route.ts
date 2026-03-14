import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Role = "homeowner" | "designer";

function isRole(value: string | null): value is Role {
  return value === "homeowner" || value === "designer";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawRole = requestUrl.searchParams.get("role");
  const flow = requestUrl.searchParams.get("flow");

  const roleFromQuery: Role | null = isRole(rawRole) ? rawRole : null;
  const targetPath = "/";
  const errorPath = flow === "signup" ? "/kayit" : "/giris";

  const supabase = await getSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errorUrl = new URL(errorPath, requestUrl.origin);
      errorUrl.searchParams.set("auth_error", "oauth_exchange_failed");
      if (flow === "signup" && roleFromQuery) {
        errorUrl.searchParams.set("role", roleFromQuery);
      }
      return NextResponse.redirect(errorUrl);
    }
  }

  const { data: authData } = await supabase.auth.getUser();
  if (authData.user) {
    const metadata = authData.user.user_metadata || {};
    const appMetadata = authData.user.app_metadata || {};
    const provider = String(appMetadata.provider ?? "").toLowerCase();
    const metadataProviders = Array.isArray(appMetadata.providers)
      ? appMetadata.providers.map((item) => String(item).toLowerCase())
      : [];
    const identityProviders = Array.isArray(authData.user.identities)
      ? authData.user.identities.map((identity) => String(identity?.provider ?? "").toLowerCase())
      : [];
    const isGoogleAccount =
      provider === "google" ||
      metadataProviders.includes("google") ||
      identityProviders.includes("google");

    const metadataName =
      (metadata.full_name as string | undefined) ||
      (metadata.name as string | undefined) ||
      (authData.user.email ? authData.user.email.split("@")[0] : "Kullanıcı");
    const metadataEmail = authData.user.email ?? null;
    const metadataAvatar =
      typeof metadata.avatar_url === "string" && metadata.avatar_url.trim()
        ? metadata.avatar_url.trim()
        : null;

    const metadataRole = metadata.role === "designer" ? "designer" : "homeowner";
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, full_name, role, contact_email, avatar_url")
      .eq("id", authData.user.id)
      .maybeSingle();
    const hasExistingProfile = Boolean(existingProfile?.id);

    const existingRole =
      typeof existingProfile?.role === "string" && existingProfile.role.trim()
        ? existingProfile.role
        : null;
    const existingName =
      typeof existingProfile?.full_name === "string" && existingProfile.full_name.trim()
        ? existingProfile.full_name
        : null;
    const existingContactEmail =
      typeof existingProfile?.contact_email === "string" && existingProfile.contact_email.trim()
        ? existingProfile.contact_email.trim()
        : null;
    const existingAvatar =
      typeof existingProfile?.avatar_url === "string" && existingProfile.avatar_url.trim()
        ? existingProfile.avatar_url.trim()
        : null;

    const roleToSave = roleFromQuery || existingRole || metadataRole;
    const nameToSave = isGoogleAccount ? metadataName : existingName || metadataName;
    const isHomeownerRole = roleToSave === "homeowner";
    const contactEmailToSave = isHomeownerRole
      ? metadataEmail || existingContactEmail
      : existingContactEmail || metadataEmail;
    const avatarToSave = existingAvatar || metadataAvatar;

    const skipProfileUpsertUntilConsent = flow === "login" && !hasExistingProfile;

    if (!skipProfileUpsertUntilConsent) {
      await supabase.from("profiles").upsert(
        {
          id: authData.user.id,
          full_name: nameToSave,
          role: roleToSave,
          contact_email: contactEmailToSave,
          avatar_url: avatarToSave,
        },
        { onConflict: "id" }
      );
    }
  }

  if (flow === "signup") {
    return NextResponse.redirect(new URL(targetPath, requestUrl.origin));
  }

  const completionPath = "/giris";
  const completeUrl = new URL(completionPath, requestUrl.origin);
  completeUrl.searchParams.set("oauth", "1");
  if (flow === "login") {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authData.user?.id ?? "")
      .maybeSingle();
    if (!profileRow?.id) {
      completeUrl.searchParams.set("needs_contact_consent", "1");
    }
  }
  return NextResponse.redirect(completeUrl);
}
