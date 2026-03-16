import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Role = "homeowner" | "designer";

function isRole(value: string | null): value is Role {
  return value === "homeowner" || value === "designer";
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

function pickAuthEmail(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: Array<{
    email?: string | null;
    identity_data?: Record<string, unknown> | null;
  }> | null;
}) {
  const directEmail = String(user.email ?? "").trim();
  if (directEmail) return directEmail;

  const metadata = user.user_metadata ?? {};
  const metadataEmail = firstNonEmpty(
    typeof metadata.email === "string" ? metadata.email : "",
    typeof metadata.email_address === "string" ? metadata.email_address : ""
  );
  if (metadataEmail) return metadataEmail;

  if (!Array.isArray(user.identities)) return "";
  return firstNonEmpty(
    ...user.identities.map((identity) => {
      const identityDataEmail =
        identity?.identity_data && typeof identity.identity_data.email === "string"
          ? identity.identity_data.email
          : "";
      return firstNonEmpty(identity?.email, identityDataEmail);
    })
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawRole = requestUrl.searchParams.get("role");
  const flow = requestUrl.searchParams.get("flow");
  const nextPath = requestUrl.searchParams.get("next");
  const safeNextPath = nextPath && nextPath.startsWith("/") ? nextPath : "/";

  const roleFromQuery: Role | null = isRole(rawRole) ? rawRole : null;
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
  let needsContactConsent = false;
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

    const authEmail = pickAuthEmail(authData.user);
    const metadataName =
      (metadata.full_name as string | undefined) ||
      (metadata.name as string | undefined) ||
      (authEmail ? authEmail.split("@")[0] : "Kullanıcı");
    const metadataEmail = authEmail || null;
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

    const createdAtMs = Number(new Date(authData.user.created_at ?? "").getTime());
    const lastSignInAtMs = Number(new Date(authData.user.last_sign_in_at ?? "").getTime());
    const hasValidAuthTimes = Number.isFinite(createdAtMs) && Number.isFinite(lastSignInAtMs);
    const isLikelyFirstOauthSession =
      hasValidAuthTimes && Math.abs(lastSignInAtMs - createdAtMs) <= 2 * 60 * 1000;

    // Sadece gerçekten yeni OAuth hesabı gibi görünen durumda login sonrası consent iste.
    // Eski hesapta profile satırı eksikse kullanıcıyı consent popup'a zorlamadan profile'ı aç.
    needsContactConsent = flow === "login" && !hasExistingProfile && isLikelyFirstOauthSession;
    const skipProfileUpsertUntilConsent = needsContactConsent;

    if (!skipProfileUpsertUntilConsent) {
      const profilePayload = {
        id: authData.user.id,
        full_name: nameToSave,
        role: roleToSave,
        contact_email: contactEmailToSave,
        avatar_url: avatarToSave,
      };

      const { error: profileUpsertError } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (profileUpsertError) {
        try {
          const admin = getSupabaseAdminClient();
          const { error: adminUpsertError } = await admin
            .from("profiles")
            .upsert(profilePayload, { onConflict: "id" });

          if (adminUpsertError) {
            const errorUrl = new URL(errorPath, requestUrl.origin);
            errorUrl.searchParams.set("auth_error", "profile_sync_failed");
            if (flow === "signup" && roleFromQuery) {
              errorUrl.searchParams.set("role", roleFromQuery);
            }
            return NextResponse.redirect(errorUrl);
          }
        } catch {
          const errorUrl = new URL(errorPath, requestUrl.origin);
          errorUrl.searchParams.set("auth_error", "profile_sync_failed");
          if (flow === "signup" && roleFromQuery) {
            errorUrl.searchParams.set("role", roleFromQuery);
          }
          return NextResponse.redirect(errorUrl);
        }
      }
    }
  }

  if (flow === "signup") {
    return NextResponse.redirect(new URL(safeNextPath, requestUrl.origin));
  }

  if (flow === "login" && needsContactConsent) {
    const completeUrl = new URL("/giris", requestUrl.origin);
    completeUrl.searchParams.set("oauth", "1");
    completeUrl.searchParams.set("needs_contact_consent", "1");
    return NextResponse.redirect(completeUrl);
  }
  return NextResponse.redirect(new URL(safeNextPath, requestUrl.origin));
}
