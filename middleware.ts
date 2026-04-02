import { NextRequest, NextResponse } from "next/server";
import { sanitizeInternalPath } from "@/lib/safe-path";

function sanitizeHostEntry(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";

  const withoutProtocol = normalized.replace(/^[a-z]+:\/\//, "");
  const hostPart = withoutProtocol.split("/")[0] ?? "";
  return hostPart.split(":")[0]?.replace(/\.$/, "") ?? "";
}

function parseAdminHosts() {
  const raw = process.env.ADMIN_HOSTS?.trim() || "admin.evlumba.com";
  const parsed = raw
    .split(",")
    .map(sanitizeHostEntry)
    .filter(Boolean);

  return parsed.length > 0 ? parsed : ["admin.evlumba.com"];
}

function normalizeHost(rawHost: string) {
  return sanitizeHostEntry(rawHost);
}

export function middleware(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host") ?? "");
  const adminHosts = parseAdminHosts();

  if (!host || !adminHosts.includes(host)) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (pathname === "/giris" || pathname === "/login") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/admin/login";
    const requestedNext = request.nextUrl.searchParams.get("next") ?? request.nextUrl.searchParams.get("redirect");
    const safeNext = sanitizeInternalPath(requestedNext, "");
    if (safeNext) {
      destination.searchParams.set("next", safeNext);
    }
    return NextResponse.redirect(destination);
  }

  const allowedPrefixes = ["/admin", "/api", "/_next", "/giris", "/login", "/auth", "/sifremi-unuttum"];
  const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAsset = pathname.includes(".");

  if (isAllowed || isAsset) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.pathname = "/admin";
  destination.searchParams.set("host", host);
  if (pathname !== "/") {
    destination.searchParams.set("from", pathname);
  }

  return NextResponse.redirect(destination);
}

// COST-FIX: Exclude static assets, images, fonts, _next from middleware
// This prevents middleware function invocations on every static file request
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
};
