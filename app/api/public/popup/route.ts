import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PopupRow = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  max_impressions_per_user: number;
  start_date: string;
  end_date: string | null;
  pages: string[] | null;
  media_type: string | null;
  updated_at: string | null;
};

function normalizePath(value: string | null | undefined) {
  let raw = String(value ?? "").trim();
  if (!raw) return "/";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      raw = new URL(raw).pathname;
    } catch {
      raw = "/";
    }
  }

  if (!raw.startsWith("/")) raw = `/${raw}`;
  if (raw.length > 1) raw = raw.replace(/\/+$/, "");
  return raw || "/";
}

function matchesCurrentPath(pages: string[] | null | undefined, currentPath: string) {
  const normalizedPages = (pages ?? []).map((page) => normalizePath(page)).filter(Boolean);
  if (normalizedPages.length === 0) return true;

  return normalizedPages.some((page) => {
    if (page === "/") return currentPath === "/";
    return currentPath === page || currentPath.startsWith(`${page}/`);
  });
}

// GET - aktif popup'i getir (public, cache'li)
export async function GET(req: Request) {
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const requestUrl = new URL(req.url);
  const currentPath = normalizePath(requestUrl.searchParams.get("path"));

  const { data, error } = await admin
    .from("popup_banners")
    .select(
      "id, title, image_url, link_url, max_impressions_per_user, start_date, end_date, pages, media_type, updated_at"
    )
    .eq("is_active", true)
    .lte("start_date", now)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, popup: null });
  }

  const popup =
    ((data ?? []) as PopupRow[]).find((row) => matchesCurrentPath(row.pages, currentPath)) ?? null;

  return NextResponse.json(
    { ok: true, popup },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  );
}
