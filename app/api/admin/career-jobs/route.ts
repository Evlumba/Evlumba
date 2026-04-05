import { NextResponse } from "next/server";
import { jsonError, requireAdmin, writeAdminAuditLog } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CAREER_CV_BUCKET = "career-cvs";

type CareerJobApplicationRow = {
  id: string;
  applicant_id: string;
  full_name: string | null;
  linkedin_url: string | null;
  employment_status: string | null;
  status: string;
  cv_file_path: string | null;
  cv_file_name: string | null;
  cv_content_type: string | null;
  cv_size_bytes: number | null;
  created_at: string;
};

type CareerJobRow = {
  id: string;
  position: string | null;
  summary: string | null;
  responsibilities: string | null;
  requirements: string | null;
  city: string | null;
  work_mode: string | null;
  status: "draft" | "published" | "closed";
  created_at: string;
  updated_at: string;
  career_job_applications: CareerJobApplicationRow[] | null;
};

type JobItemPayload = {
  position?: string | null;
  summary?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  city?: string | null;
  workMode?: string | null;
  status?: string | null;
};

type CreatePayload = {
  action: "create";
  item?: JobItemPayload;
};

type UpdatePayload = {
  action: "update";
  id?: string | null;
  item?: JobItemPayload;
};

type DeletePayload = {
  action: "delete";
  id?: string | null;
};

type SetStatusPayload = {
  action: "set_status";
  id?: string | null;
  status?: string | null;
};

function normalizeOptionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function normalizeStatus(value: unknown): "draft" | "published" | "closed" {
  return value === "draft" || value === "closed" ? value : "published";
}

export async function GET() {
  try {
    const guard = await requireAdmin("admin");
    if (!guard.ok) return guard.response;

    const { admin } = guard.context;
    const { data, error } = await admin
      .from("career_job_posts")
      .select(
        "id, position, summary, responsibilities, requirements, city, work_mode, status, created_at, updated_at, career_job_applications(id, applicant_id, full_name, linkedin_url, employment_status, status, cv_file_path, cv_file_name, cv_content_type, cv_size_bytes, created_at)"
      )
      .order("created_at", { ascending: false });

    if (error) return jsonError(error.message, 500);

    const rows = (data ?? []) as CareerJobRow[];
    const cvPaths = Array.from(
      new Set(
        rows.flatMap((job) =>
          (job.career_job_applications ?? [])
            .map((application) => application.cv_file_path)
            .filter((path): path is string => Boolean(path?.trim()))
        )
      )
    );

    const cvSignedUrlByPath = new Map<string, string>();
    if (cvPaths.length > 0) {
      const { data: signedData, error: signedError } = await admin.storage
        .from(CAREER_CV_BUCKET)
        .createSignedUrls(cvPaths, 60 * 60);

      if (!signedError && signedData) {
        for (let index = 0; index < cvPaths.length; index += 1) {
          const signedUrl = signedData[index]?.signedUrl ?? null;
          if (signedUrl) {
            cvSignedUrlByPath.set(cvPaths[index], signedUrl);
          }
        }
      }
    }

    const jobs = rows.map((item) => ({
      id: item.id,
      position: item.position,
      summary: item.summary,
      responsibilities: item.responsibilities,
      requirements: item.requirements,
      city: item.city,
      workMode: item.work_mode,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      applications: (item.career_job_applications ?? [])
        .map((application) => ({
          id: application.id,
          applicantId: application.applicant_id,
          fullName: application.full_name,
          linkedinUrl: application.linkedin_url,
          employmentStatus: application.employment_status,
          status: application.status,
          cvFilePath: application.cv_file_path,
          cvFileName: application.cv_file_name,
          cvContentType: application.cv_content_type,
          cvSizeBytes: application.cv_size_bytes,
          cvSignedUrl: application.cv_file_path ? cvSignedUrlByPath.get(application.cv_file_path) ?? null : null,
          createdAt: application.created_at,
        }))
        .sort((left, right) => {
          const leftTime = new Date(left.createdAt).getTime();
          const rightTime = new Date(right.createdAt).getTime();
          return rightTime - leftTime;
        }),
    }));

    return NextResponse.json({ ok: true, jobs });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "İş ilanları alınamadı.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdmin("admin");
    if (!guard.ok) return guard.response;

    const { actorRole, actorUserId, admin } = guard.context;
    const body = (await request.json().catch(() => null)) as
      | CreatePayload
      | UpdatePayload
      | DeletePayload
      | SetStatusPayload
      | null;
    if (!body) return jsonError("Geçersiz istek gövdesi.", 400);

    if (body.action === "create") {
      const payload = {
        position: normalizeOptionalText(body.item?.position),
        summary: normalizeOptionalText(body.item?.summary),
        responsibilities: normalizeOptionalText(body.item?.responsibilities),
        requirements: normalizeOptionalText(body.item?.requirements),
        city: normalizeOptionalText(body.item?.city),
        work_mode: normalizeOptionalText(body.item?.workMode),
        status: normalizeStatus(body.item?.status),
        created_by: actorUserId,
      };

      const { data: inserted, error: insertError } = await admin
        .from("career_job_posts")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) return jsonError(insertError.message, 500);

      await writeAdminAuditLog(admin, {
        actorRole,
        actorUserId,
        action: "career_job_create",
        targetType: "career_job_post",
        targetId: inserted.id,
        details: { status: payload.status },
      });

      return NextResponse.json({ ok: true, id: inserted.id });
    }

    if (body.action === "update") {
      const id = String(body.id ?? "").trim();
      if (!id) return jsonError("Güncellenecek ilan ID zorunlu.", 400);

      const payload = {
        position: normalizeOptionalText(body.item?.position),
        summary: normalizeOptionalText(body.item?.summary),
        responsibilities: normalizeOptionalText(body.item?.responsibilities),
        requirements: normalizeOptionalText(body.item?.requirements),
        city: normalizeOptionalText(body.item?.city),
        work_mode: normalizeOptionalText(body.item?.workMode),
        status: normalizeStatus(body.item?.status),
      };

      const { error: updateError } = await admin
        .from("career_job_posts")
        .update(payload)
        .eq("id", id);
      if (updateError) return jsonError(updateError.message, 500);

      await writeAdminAuditLog(admin, {
        actorRole,
        actorUserId,
        action: "career_job_update",
        targetType: "career_job_post",
        targetId: id,
        details: { status: payload.status },
      });

      return NextResponse.json({ ok: true });
    }

    if (body.action === "delete") {
      const id = String(body.id ?? "").trim();
      if (!id) return jsonError("Silinecek ilan ID zorunlu.", 400);

      const { error: deleteError } = await admin.from("career_job_posts").delete().eq("id", id);
      if (deleteError) return jsonError(deleteError.message, 500);

      await writeAdminAuditLog(admin, {
        actorRole,
        actorUserId,
        action: "career_job_delete",
        targetType: "career_job_post",
        targetId: id,
        details: {},
      });

      return NextResponse.json({ ok: true });
    }

    if (body.action === "set_status") {
      const id = String(body.id ?? "").trim();
      if (!id) return jsonError("İlan ID zorunlu.", 400);
      const status = normalizeStatus(body.status);

      const { error: updateError } = await admin
        .from("career_job_posts")
        .update({ status })
        .eq("id", id);
      if (updateError) return jsonError(updateError.message, 500);

      await writeAdminAuditLog(admin, {
        actorRole,
        actorUserId,
        action: "career_job_set_status",
        targetType: "career_job_post",
        targetId: id,
        details: { status },
      });

      return NextResponse.json({ ok: true });
    }

    return jsonError("Geçersiz işlem.", 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "İş ilanı işlemi başarısız oldu.", 500);
  }
}
