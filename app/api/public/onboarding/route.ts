import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET - get active onboarding flow for a role
export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = url.searchParams.get("role") || "homeowner";

  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from("onboarding_flows")
    .select("id, title, target_role, max_impressions_per_user, onboarding_steps(id, step_order, title, body, image_url)")
    .eq("is_active", true)
    .or(`target_role.eq.${role},target_role.eq.all`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, flow: null });
  }

  if (!data) {
    return NextResponse.json({ ok: true, flow: null });
  }

  // Sort steps
  const flow = {
    ...data,
    onboarding_steps: ((data.onboarding_steps as Array<Record<string, unknown>>) ?? []).sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (a.step_order as number) - (b.step_order as number)
    ),
  };

  return NextResponse.json(
    { ok: true, flow },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
