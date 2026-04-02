import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeInternalPath } from "@/lib/safe-path";

export const runtime = "nodejs";

/**
 * Mobile app WebView session bridge.
 * Called by the Flutter app to set the Supabase session as a server-side cookie
 * before redirecting to the target page.
 *
 * Usage: GET /api/auth/set-session?access_token=...&refresh_token=...&redirect=/forum
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token");
  const redirect = url.searchParams.get("redirect") ?? "/";

  // Validate redirect to prevent open redirect
  const safePath = sanitizeInternalPath(redirect, "/");

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL(safePath, url.origin));
  }

  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch {
    // If session is invalid, just redirect without setting auth
  }

  return NextResponse.redirect(new URL(safePath, url.origin));
}
