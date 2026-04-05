"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const CAREER_CV_BUCKET = "career-cvs";
const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024;

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "öğrenci", label: "Öğrenci" },
  { value: "mezun", label: "Mezun" },
  { value: "tam zamanlı", label: "Tam Zamanlı" },
  { value: "yarı zamanlı", label: "Yarı Zamanlı" },
  { value: "iş sahibi", label: "İş Sahibi" },
  { value: "diğer", label: "Diğer" },
] as const;

type EmploymentStatus = (typeof EMPLOYMENT_STATUS_OPTIONS)[number]["value"];
type CareerJobStatus = "draft" | "published" | "closed";

type CareerJobRow = {
  id: string;
  position: string | null;
  summary: string | null;
  responsibilities: string | null;
  requirements: string | null;
  city: string | null;
  work_mode: string | null;
  status: CareerJobStatus;
  created_at: string;
};

type ApplicationFormState = {
  fullName: string;
  linkedinUrl: string;
  employmentStatus: EmploymentStatus | "";
  consentApproved: boolean;
  cvFile: File | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(sizeInBytes: number) {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) return "0 KB";
  const sizeInMb = sizeInBytes / (1024 * 1024);
  if (sizeInMb >= 1) return `${sizeInMb.toFixed(1)} MB`;
  const sizeInKb = sizeInBytes / 1024;
  return `${Math.max(1, Math.round(sizeInKb))} KB`;
}

function isValidLinkedinUrl(value: string) {
  try {
    const url = new URL(value);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const host = url.hostname.toLocaleLowerCase("en-US");
    return isHttp && host.includes("linkedin.");
  } catch {
    return false;
  }
}

function normalizeFileStem(fileName: string) {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const normalized = stem
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return normalized || "cv";
}

function toParagraphs(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/\r?\n+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function shortText(value: string | null | undefined, max = 150) {
  const text = String(value ?? "").trim();
  if (!text) return "Detay eklenecek.";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function getInitialApplicationFormState(): ApplicationFormState {
  return {
    fullName: "",
    linkedinUrl: "",
    employmentStatus: "",
    consentApproved: false,
    cvFile: null,
  };
}

export default function AdayPage() {
  const router = useRouter();
  const [requestedJobId, setRequestedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<CareerJobRow[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [applicationModalJobId, setApplicationModalJobId] = useState<string | null>(null);
  const [applicationSubmitting, setApplicationSubmitting] = useState(false);
  const [sharingJobId, setSharingJobId] = useState<string | null>(null);
  const [applicationFormError, setApplicationFormError] = useState<string | null>(null);
  const [cvInputResetKey, setCvInputResetKey] = useState(0);
  const [applicationForm, setApplicationForm] = useState<ApplicationFormState>(getInitialApplicationFormState);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedJob = useMemo(
    () => jobs.find((item) => item.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId]
  );

  const applicationModalJob = useMemo(
    () => jobs.find((item) => item.id === applicationModalJobId) ?? null,
    [applicationModalJobId, jobs]
  );

  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    setError(null);

    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id ?? null;
    setUserId(currentUserId);

    const { data: jobsData, error: jobsError } = await supabase
      .from("career_job_posts")
      .select("id, position, summary, responsibilities, requirements, city, work_mode, status, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (jobsError) {
      setJobs([]);
      setSelectedJobId(null);
      setError(jobsError.message);
      setLoading(false);
      return;
    }

    const nextJobs = (jobsData ?? []) as CareerJobRow[];
    setJobs(nextJobs);
    setSelectedJobId((prev) => {
      if (prev && nextJobs.some((job) => job.id === prev)) return prev;
      if (requestedJobId && nextJobs.some((job) => job.id === requestedJobId)) return requestedJobId;
      return nextJobs[0]?.id ?? null;
    });

    if (currentUserId) {
      const { data: applicationRows, error: applicationsError } = await supabase
        .from("career_job_applications")
        .select("job_id")
        .eq("applicant_id", currentUserId);

      if (!applicationsError && applicationRows) {
        setAppliedJobIds(new Set(applicationRows.map((item: { job_id: string }) => item.job_id)));
      } else {
        setAppliedJobIds(new Set());
      }
    } else {
      setAppliedJobIds(new Set());
    }

    setLoading(false);
  }, [requestedJobId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = new URLSearchParams(window.location.search);
    setRequestedJobId(search.get("ilan")?.trim() || null);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  useEffect(() => {
    if (!requestedJobId || jobs.length === 0) return;
    if (selectedJobId === requestedJobId) return;
    if (jobs.some((job) => job.id === requestedJobId)) {
      setSelectedJobId(requestedJobId);
    }
  }, [jobs, requestedJobId, selectedJobId]);

  function syncJobQueryParam(jobId: string) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("ilan", jobId);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function selectJob(jobId: string) {
    setSelectedJobId(jobId);
    setRequestedJobId(jobId);
    syncJobQueryParam(jobId);
  }

  function closeApplicationModal() {
    setApplicationModalJobId(null);
    setApplicationForm(getInitialApplicationFormState());
    setApplicationFormError(null);
    setCvInputResetKey((value) => value + 1);
  }

  async function startApplication(jobId: string) {
    setError(null);
    setNotice(null);

    if (!userId) {
      const target = `/kayit?next=${encodeURIComponent("/aday")}`;
      router.push(target);
      return;
    }

    if (appliedJobIds.has(jobId)) {
      setNotice("Bu ilana zaten başvurdunuz.");
      return;
    }

    setApplicationModalJobId(jobId);
    setApplicationForm(getInitialApplicationFormState());
    setApplicationFormError(null);
    setCvInputResetKey((value) => value + 1);
  }

  async function copyJobLink(jobId: string) {
    setError(null);
    setNotice(null);
    setSharingJobId(jobId);
    try {
      const shareUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/aday?ilan=${encodeURIComponent(jobId)}`
          : `/aday?ilan=${encodeURIComponent(jobId)}`;

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      } else {
        throw new Error("Kopyalama desteklenmiyor.");
      }

      setNotice("İlan linki kopyalandı.");
    } catch {
      setError("İlan linki kopyalanamadı. Lütfen tekrar deneyin.");
    } finally {
      setSharingJobId(null);
    }
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplicationFormError(null);
    setNotice(null);

    const jobId = applicationModalJob?.id ?? null;
    if (!jobId) {
      setApplicationFormError("Başvuru yapılacak ilan bulunamadı.");
      return;
    }
    if (!userId) {
      setApplicationFormError("Başvuru için önce giriş yapmalısınız.");
      return;
    }

    const fullName = applicationForm.fullName.trim();
    const linkedinUrl = applicationForm.linkedinUrl.trim();
    const employmentStatus = applicationForm.employmentStatus;
    const cvFile = applicationForm.cvFile;

    if (!fullName) {
      setApplicationFormError("Ad soyad alanı zorunludur.");
      return;
    }
    if (!linkedinUrl) {
      setApplicationFormError("LinkedIn profil URL alanı zorunludur.");
      return;
    }
    if (!isValidLinkedinUrl(linkedinUrl)) {
      setApplicationFormError("Geçerli bir LinkedIn profil URL giriniz (https://linkedin.com/...).");
      return;
    }
    if (!employmentStatus) {
      setApplicationFormError("Çalışma durumu seçimi zorunludur.");
      return;
    }
    if (!applicationForm.consentApproved) {
      setApplicationFormError("Devam etmek için onay tikini işaretlemelisiniz.");
      return;
    }
    if (cvFile && cvFile.size > MAX_CV_SIZE_BYTES) {
      setApplicationFormError("CV dosyası en fazla 10 MB olabilir.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let uploadedCvPath: string | null = null;

    setApplicationSubmitting(true);
    try {
      if (cvFile) {
        const extension = cvFile.name.split(".").pop()?.toLocaleLowerCase("en-US") || "pdf";
        const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const fileName = `${normalizeFileStem(cvFile.name)}-${uniquePart}.${extension}`;
        const filePath = `${userId}/${jobId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(CAREER_CV_BUCKET)
          .upload(filePath, cvFile, {
            upsert: false,
            contentType: cvFile.type || "application/octet-stream",
          });

        if (uploadError) {
          setApplicationForm((prev) => ({ ...prev, cvFile: null }));
          setCvInputResetKey((value) => value + 1);
          throw new Error(`CV yüklenemedi: ${uploadError.message}`);
        }
        uploadedCvPath = filePath;
      }

      const { error: insertError } = await supabase.from("career_job_applications").insert({
        job_id: jobId,
        applicant_id: userId,
        full_name: fullName,
        linkedin_url: linkedinUrl,
        employment_status: employmentStatus,
        consent_approved: true,
        cv_file_path: uploadedCvPath,
        cv_file_name: cvFile?.name ?? null,
        cv_content_type: cvFile?.type || null,
        cv_size_bytes: cvFile?.size ?? null,
      });

      if (insertError) {
        if (uploadedCvPath) {
          await supabase.storage.from(CAREER_CV_BUCKET).remove([uploadedCvPath]);
        }

        if (insertError.code === "23505") {
          setAppliedJobIds((prev) => new Set([...prev, jobId]));
          setNotice("Bu ilana zaten başvurdunuz.");
          closeApplicationModal();
          return;
        }

        throw new Error(insertError.message);
      }

      setAppliedJobIds((prev) => new Set([...prev, jobId]));
      setNotice("Başvurun başarıyla alındı. Teşekkür ederiz.");
      closeApplicationModal();
    } catch (submitError) {
      setApplicationFormError(submitError instanceof Error ? submitError.message : "Başvuru gönderilemedi.");
    } finally {
      setApplicationSubmitting(false);
    }
  }

  return (
    <main className="space-y-6 pb-4">
      <section className="overflow-hidden rounded-3xl border border-black/10 bg-[linear-gradient(145deg,#f8fafc_0%,#eef2ff_55%,#ecfdf5_100%)] p-6 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.35)]">
        <div className="grid items-center gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Evlumba Kariyer</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Bizimle Çalışın</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Açık pozisyonlarımızı inceleyin, size en uygun ilana hemen başvurun. Başvuru için Evlumba hesabı gerekir.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white/60 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.42)]">
            <Image
              src="/images/aday.png"
              alt="Evlumba kariyer görseli"
              width={2436}
              height={1414}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

      {notice ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.35fr)]">
        <div className="space-y-3 rounded-3xl border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Açık İlanlar</h2>
            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Yenile
            </button>
          </div>

          {loading ? <p className="text-sm text-slate-500">İlanlar yükleniyor...</p> : null}

          {!loading && jobs.length === 0 ? (
            <p className="rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Şu an yayında iş ilanı bulunmuyor.
            </p>
          ) : null}

          {jobs.map((job) => {
            const selected = selectedJob?.id === job.id;
            return (
              <div
                key={job.id}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  selected
                    ? "border-emerald-200 bg-emerald-50 text-slate-900 shadow-[0_20px_50px_-35px_rgba(16,185,129,0.42)]"
                    : "border-black/10 bg-slate-50 text-slate-900 hover:border-slate-400 hover:bg-white"
                }`}
              >
                <button type="button" onClick={() => selectJob(job.id)} className="w-full text-left">
                  <p className="text-sm font-semibold">{job.position?.trim() || "Pozisyon belirtilmedi"}</p>
                  <p className={`mt-1 text-xs ${selected ? "text-emerald-900/80" : "text-slate-600"}`}>
                    {shortText(job.summary, 110)}
                  </p>
                </button>
                <div className={`mt-2 flex items-center justify-between gap-2 text-[11px] ${selected ? "text-emerald-900/75" : "text-slate-500"}`}>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-current/20 px-2 py-0.5">{job.city?.trim() || "Şehir esnek"}</span>
                    <span className="rounded-full border border-current/20 px-2 py-0.5">
                      {job.work_mode?.trim() || "Çalışma şekli belirtilecek"}
                    </span>
                    <span className="rounded-full border border-current/20 px-2 py-0.5">{formatDate(job.created_at)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyJobLink(job.id)}
                    disabled={sharingJobId === job.id}
                    aria-label="İlan linkini kopyala"
                    title="İlan linkini kopyala"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/25 bg-white/80 text-current hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sharingJobId === job.id ? (
                      <span className="text-[10px] leading-none">...</span>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path
                          d="M15 8L9 12L15 16M7 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm10 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0-13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-5">
          {!selectedJob ? (
            <p className="text-sm text-slate-500">Detay görmek için soldan bir ilan seçin.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {selectedJob.position?.trim() || "Pozisyon belirtilmedi"}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="rounded-full border border-black/10 bg-slate-50 px-2.5 py-1">
                      {selectedJob.city?.trim() || "Şehir esnek"}
                    </span>
                    <span className="rounded-full border border-black/10 bg-slate-50 px-2.5 py-1">
                      {selectedJob.work_mode?.trim() || "Çalışma şekli belirtilecek"}
                    </span>
                    <span className="rounded-full border border-black/10 bg-slate-50 px-2.5 py-1">
                      {formatDate(selectedJob.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedJob.summary?.trim() ? (
                <section className="mt-5 rounded-2xl border border-black/10 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">İlan Özeti</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selectedJob.summary}</p>
                </section>
              ) : null}

              {toParagraphs(selectedJob.responsibilities).length > 0 ? (
                <section className="mt-4 rounded-2xl border border-black/10 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Sorumluluklar</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                    {toParagraphs(selectedJob.responsibilities).map((line, index) => (
                      <li key={`${selectedJob.id}-resp-${index}`}>{line}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {toParagraphs(selectedJob.requirements).length > 0 ? (
                <section className="mt-4 rounded-2xl border border-black/10 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Aranan Kriterler</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                    {toParagraphs(selectedJob.requirements).map((line, index) => (
                      <li key={`${selectedJob.id}-req-${index}`}>{line}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="mt-6">
                {appliedJobIds.has(selectedJob.id) ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                  >
                    Bu ilana başvurdunuz
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void startApplication(selectedJob.id)}
                    disabled={applicationSubmitting}
                    className="w-full rounded-2xl border border-black/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {applicationSubmitting ? "Başvurun gönderiliyor..." : userId ? "Başvur" : "Başvurmak için kayıt ol"}
                  </button>
                )}
                {!userId ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Başvuru yapabilmek için önce giriş yapmalı veya kayıt olmalısınız.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>

      {applicationModalJob ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-6 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.75)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">İş Başvurusu</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {applicationModalJob.position?.trim() || "Pozisyon belirtilmedi"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeApplicationModal}
                disabled={applicationSubmitting}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Kapat
              </button>
            </div>

            {applicationFormError ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {applicationFormError}
              </div>
            ) : null}

            <form className="mt-4 space-y-3" onSubmit={(event) => void submitApplication(event)}>
              <label className="block text-sm text-slate-700">
                Ad Soyad
                <input
                  type="text"
                  value={applicationForm.fullName}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                  required
                  placeholder="Ad Soyad"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </label>

              <label className="block text-sm text-slate-700">
                LinkedIn Profil URL
                <input
                  type="url"
                  value={applicationForm.linkedinUrl}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      linkedinUrl: event.target.value,
                    }))
                  }
                  required
                  placeholder="https://linkedin.com/in/kullaniciadi"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </label>

              <label className="block text-sm text-slate-700">
                Çalışma Durumu
                <select
                  value={applicationForm.employmentStatus}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      employmentStatus: event.target.value as EmploymentStatus | "",
                    }))
                  }
                  required
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                >
                  <option value="">Seçiniz</option>
                  {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-black/10 bg-slate-50 p-3">
                <label className="block text-sm text-slate-700">
                  CV Ekle
                  <input
                    key={cvInputResetKey}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      if (!nextFile) {
                        setApplicationForm((prev) => ({ ...prev, cvFile: null }));
                        return;
                      }
                      if (nextFile.size > MAX_CV_SIZE_BYTES) {
                        event.target.value = "";
                        setApplicationForm((prev) => ({ ...prev, cvFile: null }));
                        setApplicationFormError("CV dosyası en fazla 10 MB olabilir.");
                        return;
                      }
                      setApplicationFormError(null);
                      setApplicationForm((prev) => ({ ...prev, cvFile: nextFile }));
                    }}
                    className="mt-1 block w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">Maksimum dosya boyutu 10 MB.</p>
                {applicationForm.cvFile ? (
                  <p className="mt-1 text-xs font-medium text-slate-700">
                    Seçilen dosya: {applicationForm.cvFile.name} ({formatFileSize(applicationForm.cvFile.size)})
                  </p>
                ) : null}
              </div>

              <label className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
                <input
                  type="checkbox"
                  required
                  checked={applicationForm.consentApproved}
                  onChange={(event) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      consentApproved: event.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-emerald-300"
                />
                <span>
                  <span className="mr-1 font-semibold">✓</span>
                  İş süreçlerinde bilgilerimin değerlendirilmesini onaylıyorum.
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeApplicationModal}
                  disabled={applicationSubmitting}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={applicationSubmitting}
                  className="rounded-xl border border-black/10 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {applicationSubmitting ? "Gönderiliyor..." : "Başvurumu Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
