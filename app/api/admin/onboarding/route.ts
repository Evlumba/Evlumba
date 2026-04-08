import { NextResponse } from "next/server";
import { getCurrentAdminContext } from "@/lib/admin/access";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - list all onboarding flows with steps
export async function GET() {
  const admin = await getCurrentAdminContext();
  if (!admin) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 403 });

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("onboarding_flows")
    .select("*, onboarding_steps(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Sort steps by step_order
  const flows = (data ?? []).map((f: Record<string, unknown>) => ({
    ...f,
    onboarding_steps: ((f.onboarding_steps as Array<Record<string, unknown>>) ?? []).sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (a.step_order as number) - (b.step_order as number)
    ),
  }));

  return NextResponse.json({ ok: true, flows });
}

// POST - create/update flow or add/update step
export async function POST(req: Request) {
  const admin = await getCurrentAdminContext();
  if (!admin) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 403 });

  const body = (await req.json()) as {
    action: "upsert_flow" | "upsert_step" | "delete_step" | "delete_flow";
    // flow fields
    flowId?: string;
    title?: string;
    targetRole?: string;
    isActive?: boolean;
    maxImpressionsPerUser?: number;
    // step fields
    stepId?: string;
    stepOrder?: number;
    stepTitle?: string;
    stepBody?: string;
    stepImageUrl?: string;
  };

  const supabaseAdmin = getSupabaseAdminClient();

  if (body.action === "upsert_flow") {
    if (body.flowId) {
      const { error } = await supabaseAdmin.from("onboarding_flows").update({
        title: body.title ?? "",
        target_role: body.targetRole ?? "homeowner",
        is_active: body.isActive ?? false,
        max_impressions_per_user: body.maxImpressionsPerUser ?? 1,
        updated_at: new Date().toISOString(),
      }).eq("id", body.flowId);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, message: "Akış güncellendi." });
    }

    const { error } = await supabaseAdmin.from("onboarding_flows").insert({
      title: body.title ?? "Yeni Onboarding",
      target_role: body.targetRole ?? "homeowner",
      is_active: body.isActive ?? false,
      max_impressions_per_user: body.maxImpressionsPerUser ?? 1,
      created_by: admin.userId,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Akış oluşturuldu." });
  }

  if (body.action === "upsert_step") {
    if (!body.flowId) return NextResponse.json({ ok: false, error: "Flow ID gerekli." }, { status: 400 });

    if (body.stepId) {
      const { error } = await supabaseAdmin.from("onboarding_steps").update({
        title: body.stepTitle ?? "",
        body: body.stepBody ?? "",
        image_url: body.stepImageUrl || null,
        step_order: body.stepOrder ?? 0,
      }).eq("id", body.stepId);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, message: "Adım güncellendi." });
    }

    const { error } = await supabaseAdmin.from("onboarding_steps").insert({
      flow_id: body.flowId,
      title: body.stepTitle ?? "Yeni Adım",
      body: body.stepBody ?? "",
      image_url: body.stepImageUrl || null,
      step_order: body.stepOrder ?? 0,
    });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Adım eklendi." });
  }

  if (body.action === "delete_step" && body.stepId) {
    const { error } = await supabaseAdmin.from("onboarding_steps").delete().eq("id", body.stepId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Adım silindi." });
  }

  if (body.action === "delete_flow" && body.flowId) {
    const { error } = await supabaseAdmin.from("onboarding_flows").delete().eq("id", body.flowId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Akış silindi." });
  }

  return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
}
