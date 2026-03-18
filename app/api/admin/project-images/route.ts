import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, UUID_REGEX } from "../_lib";

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
  const { imageId, projectType } = body ?? {};

  if (!imageId || !UUID_REGEX.test(imageId) || typeof projectType !== "string") {
    return NextResponse.json({ ok: false, error: "imageId ve projectType zorunlu." }, { status: 400 });
  }

  // Find the image and its parent project
  const { data: imageRow, error: imgErr } = await admin
    .from("designer_project_images")
    .select("id, project_id, image_url, sort_order")
    .eq("id", imageId)
    .single();

  if (imgErr || !imageRow) {
    return NextResponse.json({ ok: false, error: "Görsel bulunamadı." }, { status: 404 });
  }

  const { data: project, error: projErr } = await admin
    .from("designer_projects")
    .select("id, designer_id, title, designer_project_images(id)")
    .eq("id", imageRow.project_id)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ ok: false, error: "Proje bulunamadı." }, { status: 404 });
  }

  const imageCount = (project.designer_project_images as { id: string }[]).length;

  if (imageCount <= 1) {
    // Only image in project — just update project_type
    const { error } = await admin
      .from("designer_projects")
      .update({ project_type: projectType || null })
      .eq("id", project.id);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, newProjectId: project.id });
  }

  // Multiple images — create a new solo project for this image
  const { data: newProject, error: createErr } = await admin
    .from("designer_projects")
    .insert({
      designer_id: project.designer_id,
      title: project.title,
      project_type: projectType || null,
      is_published: true,
      cover_image_url: imageRow.image_url,
    })
    .select("id")
    .single();

  if (createErr || !newProject) {
    return NextResponse.json({ ok: false, error: createErr?.message ?? "Proje oluşturulamadı." }, { status: 500 });
  }

  // Move image to new project
  const { error: moveErr } = await admin
    .from("designer_project_images")
    .update({ project_id: newProject.id, sort_order: 0 })
    .eq("id", imageId);

  if (moveErr) return NextResponse.json({ ok: false, error: moveErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, newProjectId: newProject.id });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin } = auth.context;

  const body = await req.json().catch(() => null);
  const { imageId } = body ?? {};

  if (!imageId || !UUID_REGEX.test(imageId)) {
    return NextResponse.json({ ok: false, error: "Geçerli imageId gerekli." }, { status: 400 });
  }

  const { error } = await admin
    .from("designer_project_images")
    .delete()
    .eq("id", imageId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
