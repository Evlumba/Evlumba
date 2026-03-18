import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../_lib";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin } = auth.context;

  const { data: projects, error } = await admin
    .from("designer_projects")
    .select("id, title, project_type, designer_id, designer_project_images (id, image_url, sort_order)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Fetch designer names from profiles separately
  const designerIds = [...new Set((projects ?? []).map((p) => p.designer_id))];
  const { data: profileRows } = await admin
    .from("profiles")
    .select("id, full_name, business_name")
    .in("id", designerIds);

  const profileMap = Object.fromEntries((profileRows ?? []).map((p) => [p.id, p]));

  const result = (projects ?? []).map((p) => ({
    ...p,
    profiles: profileMap[p.designer_id] ?? null,
  }));

  return NextResponse.json({ ok: true, projects: result });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin } = auth.context;

  const body = await req.json().catch(() => null);
  const { projectId, projectType } = body ?? {};

  if (!projectId || typeof projectType !== "string") {
    return NextResponse.json({ ok: false, error: "projectId ve projectType zorunlu." }, { status: 400 });
  }

  const { error } = await admin
    .from("designer_projects")
    .update({ project_type: projectType || null })
    .eq("id", projectId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
