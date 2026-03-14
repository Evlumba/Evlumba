"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createDesignerProject,
  deleteDesignerProject,
  listMyDesignerProjects,
  setDesignerProjectPublished,
  updateDesignerProject,
  type DesignerProject,
} from "@/lib/designerProjects";
import { exploreFilterOptions } from "@/lib/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

const MAX_GALLERY_IMAGES = 5;
const REQUIRED_IMAGE_SIZE = 512;
const ROOM_OPTIONS = [
  { id: "mutfak", label: "Mutfak", patterns: ["mutfak", "kitchen"] },
  { id: "banyo", label: "Banyo", patterns: ["banyo", "bath"] },
  { id: "salon", label: "Salon", patterns: ["salon", "oturma", "living"] },
  { id: "yatak-odasi", label: "Yatak Odası", patterns: ["yatak", "bedroom"] },
  { id: "cocuk", label: "Bebek & Çocuk", patterns: ["cocuk", "çocuk", "bebek", "kids", "child"] },
  { id: "ev-ofisi", label: "Ev Ofisi", patterns: ["ofis", "calisma", "çalışma", "study", "home office"] },
  { id: "balkon", label: "Balkon", patterns: ["balkon", "teras", "terrace"] },
  { id: "antre", label: "Antre", patterns: ["antre", "giris", "giriş", "hol", "hall", "entry"] },
] as const;

type RoomCategory = (typeof ROOM_OPTIONS)[number]["id"];
const ROOM_LABEL_BY_ID: Record<RoomCategory, string> = ROOM_OPTIONS.reduce(
  (acc, item) => {
    acc[item.id] = item.label;
    return acc;
  },
  {} as Record<RoomCategory, string>
);

type FormState = {
  title: string;
  projectType: string;
  roomCategory: RoomCategory | "";
  exploreStyle: string;
  location: string;
  description: string;
  tagsText: string;
  colorPaletteText: string;
  budgetLevel: "low" | "medium" | "high" | "pro" | "";
  coverImageUrl: string;
  galleryText: string;
};

const INITIAL_FORM: FormState = {
  title: "",
  projectType: "",
  roomCategory: "",
  exploreStyle: "",
  location: "",
  description: "",
  tagsText: "",
  colorPaletteText: "",
  budgetLevel: "",
  coverImageUrl: "",
  galleryText: "",
};

function splitCsv(value: string) {
  return value
    .split(/\r?\n|,/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function isRoomTag(value: string) {
  const normalized = normalizeText(value.trim());
  return normalized.startsWith("oda:") || normalized.startsWith("room:");
}

function extractRoomCategoryFromTags(tags: string[]): RoomCategory | "" {
  for (const tag of tags) {
    const normalized = normalizeText(tag.trim());
    if (!normalized.startsWith("oda:") && !normalized.startsWith("room:")) continue;
    const value = normalized.split(":")[1]?.trim() || "";
    if (ROOM_OPTIONS.some((room) => room.id === value)) return value as RoomCategory;
  }
  return "";
}

function inferRoomCategory(projectType: string, tags: string[]): RoomCategory | "" {
  const tagBased = extractRoomCategoryFromTags(tags);
  if (tagBased) return tagBased;

  const haystack = normalizeText([projectType, ...tags].join(" "));
  const matched = ROOM_OPTIONS.find((room) =>
    room.patterns.some((pattern) => haystack.includes(normalizeText(pattern)))
  );
  return matched?.id ?? "";
}

function findMatchingOption(options: readonly string[], source: string[]): string {
  const normalizedSource = new Set(source.map((item) => normalizeText(item.trim())).filter(Boolean));
  for (const option of options) {
    if (normalizedSource.has(normalizeText(option))) return option;
  }
  return "";
}

function toBudgetLabel(value: DesignerProject["budgetLevel"]) {
  if (value === "low") return "Düşük";
  if (value === "medium") return "Orta";
  if (value === "high") return "Yüksek";
  if (value === "pro") return "Pro";
  return "Belirtilmedi";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

function compressSquareImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = REQUIRED_IMAGE_SIZE;
        canvas.height = REQUIRED_IMAGE_SIZE;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Görsel işlenemedi"));
          return;
        }
        // Center-crop then fit to 512x512 so we accept any input ratio.
        const sourceSize = Math.min(image.width, image.height);
        const sourceX = Math.floor((image.width - sourceSize) / 2);
        const sourceY = Math.floor((image.height - sourceSize) / 2);
        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          REQUIRED_IMAGE_SIZE,
          REQUIRED_IMAGE_SIZE
        );
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => reject(new Error("Görsel sıkıştırılamadı"));
    image.src = dataUrl;
  });
}

async function validateAndReadImage(file: File) {
  const dataUrl = await fileToDataUrl(file);
  return compressSquareImage(dataUrl);
}

export default function DesignerProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDesigner, setIsDesigner] = useState(false);
  const [projects, setProjects] = useState<DesignerProject[]>([]);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [uploadedGalleryImages, setUploadedGalleryImages] = useState<string[]>([]);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: userRes } = await supabase.auth.getUser();
        if (!userRes.user) {
          if (!cancelled) setProjects([]);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userRes.user.id)
          .maybeSingle();

        const designer =
          profile?.role === "designer" ||
          profile?.role === "designer_pending" ||
          userRes.user.user_metadata?.role === "designer";
        if (!cancelled) setIsDesigner(Boolean(designer));

        const rows = await listMyDesignerProjects();
        if (!cancelled) setProjects(rows);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Projeler yüklenemedi.";
        if (!cancelled) {
          setSubmitMessage({ type: "error", text: msg });
        }
        toast(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const projectCountLabel = useMemo(() => {
    if (projects.length === 0) return "Henüz proje yok";
    return `${projects.length} proje`;
  }, [projects.length]);

  const draftProjects = useMemo(
    () => projects.filter((project) => !project.isPublished),
    [projects]
  );
  const publishedProjects = useMemo(
    () => projects.filter((project) => project.isPublished),
    [projects]
  );

  async function onPickCover(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await validateAndReadImage(file);
      setForm((prev) => ({ ...prev, coverImageUrl: dataUrl }));
      toast("Kapak görseli eklendi");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Kapak görseli yüklenemedi.";
      toast(msg);
    }
  }

  async function onPickGallery(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = MAX_GALLERY_IMAGES - uploadedGalleryImages.length;
    if (remaining <= 0) {
      toast(`En fazla ${MAX_GALLERY_IMAGES} görsel ekleyebilirsin.`);
      return;
    }

    const picked = Array.from(files).slice(0, remaining);
    const added: string[] = [];

    for (const file of picked) {
      try {
        const dataUrl = await validateAndReadImage(file);
        added.push(dataUrl);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Görsel yüklenemedi.";
        toast(msg);
      }
    }

    if (added.length) {
      setUploadedGalleryImages((prev) => Array.from(new Set([...prev, ...added])).slice(0, MAX_GALLERY_IMAGES));
      toast(`${added.length} görsel eklendi`);
    }
  }

  async function saveDraft() {
    setSubmitMessage(null);
    if (!form.title.trim()) {
      const msg = "Proje başlığı zorunlu.";
      setSubmitMessage({ type: "error", text: msg });
      toast(msg);
      return;
    }
    try {
      setSaving(true);

      const supabase = getSupabaseBrowserClient();
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user?.id) {
        throw new Error("Taslak kaydetmek için giriş yapmalısın.");
      }

      const galleryFromText = splitCsv(form.galleryText);
      const galleryUrls = Array.from(new Set([...uploadedGalleryImages, ...galleryFromText])).slice(
        0,
        MAX_GALLERY_IMAGES
      );

      if (galleryFromText.length + uploadedGalleryImages.length > MAX_GALLERY_IMAGES) {
        toast(`Galeri en fazla ${MAX_GALLERY_IMAGES} görsel olabilir. İlk ${MAX_GALLERY_IMAGES} kayıt alındı.`);
      }

      const rawTags = splitCsv(form.tagsText);
      const tagsWithoutRoom = rawTags.filter((tag) => !isRoomTag(tag));
      const roomTag = form.roomCategory ? [`oda:${form.roomCategory}`] : [];
      const mergedTags = Array.from(
        new Set([
          ...roomTag,
          ...(form.exploreStyle ? [form.exploreStyle.trim()] : []),
          ...tagsWithoutRoom,
        ])
      );
      const mergedColorPalette = Array.from(
        new Set([
          ...splitCsv(form.colorPaletteText),
        ])
      );
      const locationValue = form.location.trim();

      const payload = {
        title: form.title,
        projectType: form.projectType.trim() || (form.roomCategory ? ROOM_LABEL_BY_ID[form.roomCategory] : ""),
        location: locationValue,
        description: form.description,
        tags: mergedTags,
        colorPalette: mergedColorPalette,
        budgetLevel: form.budgetLevel,
        coverImageUrl: form.coverImageUrl,
        galleryUrls,
      };

      const savedProject = editingProjectId
        ? await updateDesignerProject({ id: editingProjectId, ...payload })
        : await createDesignerProject(payload);

      const hydratedProject =
        savedProject.imageUrls.length > 0 || galleryUrls.length === 0
          ? savedProject
          : {
              ...savedProject,
              imageUrls: galleryUrls,
              coverImageUrl: savedProject.coverImageUrl || galleryUrls[0] || "",
            };

      setProjects((prev) => [hydratedProject, ...prev.filter((x) => x.id !== hydratedProject.id)]);
      setForm(INITIAL_FORM);
      setUploadedGalleryImages([]);
      setEditingProjectId(null);
      const successText = editingProjectId ? "Taslak güncellendi." : "Taslak kaydedildi.";
      setSubmitMessage({ type: "success", text: successText });
      toast(successText);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Proje eklenemedi.";
      setSubmitMessage({ type: "error", text: msg });
      toast(msg);
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void saveDraft();
  }

  function editProject(project: DesignerProject) {
    const roomCategory = inferRoomCategory(project.projectType, project.tags);
    const exploreStyle = findMatchingOption(exploreFilterOptions.styles, project.tags);

    const visibleTags = project.tags.filter(
      (tag) => !isRoomTag(tag) && normalizeText(tag) !== normalizeText(exploreStyle)
    );
    const visiblePalette = project.colorPalette;

    setEditingProjectId(project.id);
    setForm({
      title: project.title,
      projectType: project.projectType,
      roomCategory,
      exploreStyle,
      location: project.location,
      description: project.description,
      tagsText: visibleTags.join(", "),
      colorPaletteText: visiblePalette.join(", "),
      budgetLevel: project.budgetLevel,
      coverImageUrl: project.coverImageUrl,
      galleryText: "",
    });
    setUploadedGalleryImages(project.imageUrls);
    setSubmitMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingProjectId(null);
    setForm(INITIAL_FORM);
    setUploadedGalleryImages([]);
    setSubmitMessage(null);
  }

  async function toggleProjectPublish(project: DesignerProject) {
    try {
      await setDesignerProjectPublished(project.id, !project.isPublished);
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id ? { ...item, isPublished: !item.isPublished } : item
        )
      );
      toast(project.isPublished ? "Proje yayından kaldırıldı" : "Proje yayınlandı");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Proje güncellenemedi.");
    }
  }

  async function removeProject(project: DesignerProject) {
    const ok = window.confirm("Bu projeyi kalıcı olarak silmek istediğine emin misin?");
    if (!ok) return;
    try {
      await deleteDesignerProject(project.id);
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
      toast("Proje silindi");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Proje silinemedi.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Projelerim</h1>
              <p className="mt-1 text-sm text-slate-600">
                Houzz benzeri vitrin düzeni: projelerini görselleriyle yayınla, portföyünü büyüt.
              </p>
            </div>
            <div className="rounded-xl bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">{projectCountLabel}</div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            Tasarım kartlarında tutarlı görünüm için görseller otomatik <strong>512x512</strong> kare formata çevrilir.
            Galeriye en fazla <strong>{MAX_GALLERY_IMAGES}</strong> görsel ekleyebilirsin.
          </div>

          {!loading && !isDesigner ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Hesabın henüz profesyonel rolüne geçmemiş görünüyor. Yine de proje taslağı kaydedebilirsin.
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingProjectId ? "Taslak Düzenle" : "Yeni Proje Ekle"}
          </h2>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(e) => void onSubmit(e)}>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Proje başlığı (örn. Nişantaşı Daire Renovasyonu)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              disabled={saving}
            />
            <input
              value={form.projectType}
              onChange={(e) => setForm((prev) => ({ ...prev, projectType: e.target.value }))}
              placeholder="Proje türü (Konut, Villa, Ofis...) - opsiyonel"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              disabled={saving}
            />
            <select
              value={form.roomCategory}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  roomCategory: e.target.value as RoomCategory | "",
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              disabled={saving}
            >
              <option value="">Keşfet oda kategorisi seç (önerilen)</option>
              {ROOM_OPTIONS.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.label}
                </option>
              ))}
            </select>
            <select
              value={form.exploreStyle}
              onChange={(e) => setForm((prev) => ({ ...prev, exploreStyle: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              disabled={saving}
            >
              <option value="">Keşfet stili seç (opsiyonel)</option>
              {exploreFilterOptions.styles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
            <input
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Konum (İstanbul, Ankara...)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              disabled={saving}
            />
            <select
              value={form.budgetLevel}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  budgetLevel: e.target.value as FormState["budgetLevel"],
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              disabled={saving}
            >
              <option value="">Bütçe seviyesi seç</option>
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
              <option value="pro">Pro</option>
            </select>
            <input
              value={form.tagsText}
              onChange={(e) => setForm((prev) => ({ ...prev, tagsText: e.target.value }))}
              placeholder="Etiketler (modern, japandi, açık mutfak)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              disabled={saving}
            />
            <input
              value={form.colorPaletteText}
              onChange={(e) => setForm((prev) => ({ ...prev, colorPaletteText: e.target.value }))}
              placeholder="Renk paleti (bej, gri, meşe)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              disabled={saving}
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Projenin hikayesi, metrekare, kullanılan malzemeler..."
              className="md:col-span-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              rows={5}
              disabled={saving}
            />

            <div className="md:col-span-2 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Kapak Görseli</h3>
              <input
                value={form.coverImageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                placeholder="Kapak görsel URL (veya aşağıdan dosya yükle)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                disabled={saving}
              />
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm"
                disabled={saving}
                onChange={(e) => void onPickCover(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="md:col-span-2 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Galeri Görselleri (max 5)</h3>
              <textarea
                value={form.galleryText}
                onChange={(e) => setForm((prev) => ({ ...prev, galleryText: e.target.value }))}
                placeholder={"Galeri URL'leri (satır satır veya virgülle)"}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                disabled={saving}
              />
              <input
                type="file"
                accept="image/*"
                multiple
                className="w-full text-sm"
                disabled={saving}
                onChange={(e) => void onPickGallery(e.target.files)}
              />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {uploadedGalleryImages.map((img, index) => (
                  <div key={img} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="aspect-square bg-slate-100">
                      <img src={img} alt={`Galeri ${index + 1}`} className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      className="w-full border-t px-3 py-2 text-xs font-semibold text-rose-600"
                      onClick={() =>
                        setUploadedGalleryImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index))
                      }
                    >
                      Kaldır
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={saving}
                className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : editingProjectId ? "Taslağı Güncelle" : "Taslak Olarak Kaydet"}
              </button>
              {editingProjectId ? (
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Düzenlemeyi İptal Et
                </button>
              ) : null}
              {submitMessage ? (
                <p
                  className={`text-sm font-medium ${
                    submitMessage.type === "success" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {submitMessage.text}
                </p>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Taslak Projeler</h2>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Projeler yükleniyor...</p>
          ) : draftProjects.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Taslak proje yok. Yeni proje eklediğinde buraya düşer.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {draftProjects.map((project) => (
                <article key={project.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="aspect-[4/3] bg-slate-100">
                    {project.coverImageUrl ? (
                      <img src={project.coverImageUrl} alt={project.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">Görsel yok</div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{project.title}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                          project.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {project.isPublished ? "Yayında" : "Yayında değil"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {[project.projectType, project.location].filter(Boolean).join(" • ") || "Proje bilgisi"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.colorPalette.slice(0, 4).map((color) => (
                        <span key={color} className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                          {color}
                        </span>
                      ))}
                    </div>
                    <p className="line-clamp-3 text-sm text-slate-600">{project.description || "Açıklama eklenmedi."}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-sky-700">{project.imageUrls.length} galeri görseli</p>
                      <p className="text-xs font-semibold text-slate-700">Bütçe: {toBudgetLabel(project.budgetLevel)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => editProject(project)}
                        className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleProjectPublish(project)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Yayınla
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeProject(project)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Yayınlanan Projeler</h2>
          {loading ? (
            <p className="mt-3 text-sm text-slate-600">Projeler yükleniyor...</p>
          ) : publishedProjects.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Henüz yayınladığın proje yok.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {publishedProjects.map((project) => (
                <article key={project.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <Link href={`/tasarimcilar/${project.designerSlug}/proje/${project.id}`} className="block">
                    <div className="aspect-[4/3] bg-slate-100">
                      {project.coverImageUrl ? (
                        <img src={project.coverImageUrl} alt={project.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">Görsel yok</div>
                      )}
                    </div>
                  </Link>
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{project.title}</h3>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        Yayında
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {[project.projectType, project.location].filter(Boolean).join(" • ") || "Proje bilgisi"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.colorPalette.slice(0, 4).map((color) => (
                        <span key={color} className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                          {color}
                        </span>
                      ))}
                    </div>
                    <p className="line-clamp-3 text-sm text-slate-600">{project.description || "Açıklama eklenmedi."}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-sky-700">{project.imageUrls.length} galeri görseli</p>
                      <p className="text-xs font-semibold text-slate-700">Bütçe: {toBudgetLabel(project.budgetLevel)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void toggleProjectPublish(project)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Yayından kaldır
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeProject(project)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600"
                      >
                        Sil
                      </button>
                      <Link
                        href={`/tasarimcilar/${project.designerSlug}/proje/${project.id}`}
                        className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700"
                      >
                        Detaya git
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
