"use client";

import { getSupabaseBrowserClient } from "./supabase/client";
import { getSession } from "./storage";

export type DesignerProject = {
  id: string;
  designerId: string;
  designerSlug: string;
  title: string;
  projectType: string;
  location: string;
  description: string;
  tags: string[];
  colorPalette: string[];
  budgetLevel: "low" | "medium" | "high" | "pro" | "";
  isPublished: boolean;
  coverImageUrl: string;
  imageUrls: string[];
  shopLinks: ProjectShopLink[];
  createdAt: string;
};

export type ProjectShopLink = {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  productUrl: string;
  productTitle: string;
  productImageUrl: string;
  productPrice: string;
};

type ProjectRow = {
  id: string;
  designer_id: string;
  title: string;
  project_type: string | null;
  location: string | null;
  description: string | null;
  tags: string[] | null;
  color_palette: string[] | null;
  budget_level: string | null;
  is_published: boolean | null;
  cover_image_url: string | null;
  created_at: string;
};

type ProjectImageRow = {
  project_id: string;
  image_url: string;
  sort_order: number | null;
};

type ProjectShopLinkRow = {
  id: string;
  project_id: string;
  image_url: string;
  pos_x: number | null;
  pos_y: number | null;
  product_url: string;
  product_title: string | null;
  product_image_url: string | null;
  product_price: string | null;
};

function isMissingIsPublishedError(message?: string | null) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("is_published") && normalized.includes("schema cache");
}

function isMissingShopLinksTableError(message?: string | null) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("designer_project_shop_links") &&
    (normalized.includes("schema cache") || normalized.includes("could not find the table"))
  );
}

export type NewDesignerProjectInput = {
  title: string;
  projectType?: string;
  location?: string;
  description?: string;
  tags?: string[];
  colorPalette?: string[];
  budgetLevel?: "low" | "medium" | "high" | "pro" | "";
  coverImageUrl?: string;
  galleryUrls?: string[];
  shopLinks?: DesignerProjectShopLinkInput[];
};

export type DesignerProjectShopLinkInput = {
  imageUrl: string;
  x: number;
  y: number;
  productUrl: string;
  productTitle?: string;
  productImageUrl?: string;
  productPrice?: string;
};

export type UpdateDesignerProjectInput = NewDesignerProjectInput & {
  id: string;
};

function cleanProjectInput(input: NewDesignerProjectInput) {
  const title = input.title.trim();
  if (!title) throw new Error("Proje başlığı zorunlu.");

  const cleanedGallery = Array.from(
    new Set((input.galleryUrls ?? []).map((x) => x.trim()).filter(Boolean))
  );
  const cleanedTags = Array.from(new Set((input.tags ?? []).map((x) => x.trim()).filter(Boolean)));
  const cleanedPalette = Array.from(
    new Set((input.colorPalette ?? []).map((x) => x.trim()).filter(Boolean))
  );
  const cleanedShopLinks = Array.from(
    new Map(
      (input.shopLinks ?? [])
        .map((item) => {
          const imageUrl = item.imageUrl.trim();
          const productUrl = item.productUrl.trim();
          if (!imageUrl || !productUrl) return null;
          const x = Number.isFinite(item.x) ? Math.min(100, Math.max(0, item.x)) : 50;
          const y = Number.isFinite(item.y) ? Math.min(100, Math.max(0, item.y)) : 50;
          return {
            imageUrl,
            productUrl,
            x,
            y,
            productTitle: (item.productTitle ?? "").trim(),
            productImageUrl: (item.productImageUrl ?? "").trim(),
            productPrice: (item.productPrice ?? "").trim(),
          };
        })
        .filter(Boolean)
        .map((item) => [`${item!.imageUrl}|${item!.x}|${item!.y}|${item!.productUrl}`, item!])
    ).values()
  );

  return {
    title,
    cleanedGallery,
    cleanedTags,
    cleanedPalette,
    cleanedShopLinks,
  };
}

function mapProject(row: ProjectRow, images: string[], shopLinks: ProjectShopLink[]): DesignerProject {
  const normalizedImages = images.map((item) => item.trim()).filter(Boolean);
  const normalizedCover = (row.cover_image_url ?? "").trim();
  const effectiveCover = normalizedImages[0] || normalizedCover;

  return {
    id: row.id,
    designerId: row.designer_id,
    designerSlug: `supa_${row.designer_id}`,
    title: row.title,
    projectType: row.project_type ?? "",
    location: row.location ?? "",
    description: row.description ?? "",
    tags: row.tags ?? [],
    colorPalette: row.color_palette ?? [],
    budgetLevel:
      row.budget_level === "low" ||
      row.budget_level === "medium" ||
      row.budget_level === "high" ||
      row.budget_level === "pro"
        ? row.budget_level
        : "",
    isPublished: row.is_published === true,
    coverImageUrl: effectiveCover,
    imageUrls: normalizedImages.length > 0 ? normalizedImages : effectiveCover ? [effectiveCover] : [],
    shopLinks,
    createdAt: row.created_at,
  };
}

async function getCurrentUserId() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getUser();
  if (data.user?.id) return data.user.id;

  // Fallback for edge cases where auth state is restoring.
  const cached = getSession();
  return cached?.id ?? null;
}

async function loadProjectImages(projectIds: string[]) {
  if (projectIds.length === 0) return new Map<string, string[]>();

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("designer_project_images")
    .select("project_id, image_url, sort_order")
    .in("project_id", projectIds);

  if (error) {
    throw new Error(`Proje görselleri okunamadı: ${error.message}`);
  }
  if (!data) return new Map<string, string[]>();

  const grouped = new Map<string, ProjectImageRow[]>();
  for (const row of data as ProjectImageRow[]) {
    const current = grouped.get(row.project_id) ?? [];
    current.push(row);
    grouped.set(row.project_id, current);
  }

  const result = new Map<string, string[]>();
  grouped.forEach((rows, projectId) => {
    const ordered = rows
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((item) => (item.image_url ?? "").trim())
      .filter(Boolean);
    result.set(projectId, ordered);
  });

  return result;
}

async function loadProjectShopLinks(projectIds: string[]) {
  if (projectIds.length === 0) return new Map<string, ProjectShopLink[]>();

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("designer_project_shop_links")
    .select(
      "id, project_id, image_url, pos_x, pos_y, product_url, product_title, product_image_url, product_price"
    )
    .in("project_id", projectIds);

  if (error) {
    if (isMissingShopLinksTableError(error.message)) {
      return new Map<string, ProjectShopLink[]>();
    }
    throw new Error(`Shopable linkler okunamadı: ${error.message}`);
  }
  if (!data) return new Map<string, ProjectShopLink[]>();

  const grouped = new Map<string, ProjectShopLink[]>();
  for (const row of data as ProjectShopLinkRow[]) {
    const current = grouped.get(row.project_id) ?? [];
    current.push({
      id: row.id,
      imageUrl: (row.image_url ?? "").trim(),
      x: Number(row.pos_x ?? 50),
      y: Number(row.pos_y ?? 50),
      productUrl: (row.product_url ?? "").trim(),
      productTitle: (row.product_title ?? "").trim(),
      productImageUrl: (row.product_image_url ?? "").trim(),
      productPrice: (row.product_price ?? "").trim(),
    });
    grouped.set(row.project_id, current);
  }

  return grouped;
}

async function verifyProjectImages(projectId: string, expectedCount: number) {
  if (expectedCount <= 0) return;

  const supabase = getSupabaseBrowserClient();
  const { count, error } = await supabase
    .from("designer_project_images")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (error) {
    throw new Error(`Galeri doğrulanamadı: ${error.message}`);
  }

  if ((count ?? 0) < expectedCount) {
    throw new Error("Galeri görselleri tam kaydedilemedi. Lütfen tekrar kaydet.");
  }
}

export async function listMyDesignerProjects() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("designer_projects")
    .select(
      "id, designer_id, title, project_type, location, description, tags, color_palette, budget_level, is_published, cover_image_url, created_at"
    )
    .eq("designer_id", userId)
    .order("created_at", { ascending: false });

  if (!error && data) {
    const rows = data as ProjectRow[];
    const imagesByProject = await loadProjectImages(rows.map((row) => row.id));
    const shopLinksByProject = await loadProjectShopLinks(rows.map((row) => row.id));
    return rows.map((row) =>
      mapProject(row, imagesByProject.get(row.id) ?? [], shopLinksByProject.get(row.id) ?? [])
    );
  }

  if (isMissingIsPublishedError(error?.message)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("designer_projects")
      .select(
        "id, designer_id, title, project_type, location, description, tags, color_palette, budget_level, cover_image_url, created_at"
      )
      .eq("designer_id", userId)
      .order("created_at", { ascending: false });

    if (fallbackError || !fallbackData) return [];
    const rows = (fallbackData as ProjectRow[]).map((row) => ({ ...row, is_published: false }));
    const imagesByProject = await loadProjectImages(rows.map((row) => row.id));
    const shopLinksByProject = await loadProjectShopLinks(rows.map((row) => row.id));
    return rows.map((row) =>
      mapProject(row, imagesByProject.get(row.id) ?? [], shopLinksByProject.get(row.id) ?? [])
    );
  }

  return [];
}

export async function createDesignerProject(input: NewDesignerProjectInput) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Proje eklemek için giriş yapmalısın.");
  }

  const { title, cleanedGallery, cleanedTags, cleanedPalette, cleanedShopLinks } = cleanProjectInput(input);

  const supabase = getSupabaseBrowserClient();
  let { data: created, error: createError } = await supabase
    .from("designer_projects")
    .insert({
      designer_id: userId,
      title,
      project_type: (input.projectType ?? "").trim() || null,
      location: (input.location ?? "").trim() || null,
      description: (input.description ?? "").trim() || null,
      tags: cleanedTags,
      color_palette: cleanedPalette,
      budget_level: input.budgetLevel || null,
      is_published: false,
      cover_image_url: (input.coverImageUrl ?? "").trim() || cleanedGallery[0] || null,
    })
    .select("id")
    .single();

  if (isMissingIsPublishedError(createError?.message)) {
    const retry = await supabase
      .from("designer_projects")
      .insert({
        designer_id: userId,
        title,
        project_type: (input.projectType ?? "").trim() || null,
        location: (input.location ?? "").trim() || null,
        description: (input.description ?? "").trim() || null,
        tags: cleanedTags,
        color_palette: cleanedPalette,
        budget_level: input.budgetLevel || null,
        cover_image_url: (input.coverImageUrl ?? "").trim() || cleanedGallery[0] || null,
      })
      .select("id")
      .single();

    created = retry.data;
    createError = retry.error;
  }

  if (createError || !created?.id) {
    throw new Error(createError?.message || "Proje oluşturulamadı.");
  }

  if (cleanedGallery.length) {
    const { error: imagesError } = await supabase.from("designer_project_images").insert(
      cleanedGallery.map((url, index) => ({
        project_id: created.id,
        image_url: url,
        sort_order: index,
      }))
    );

    if (imagesError) {
      throw new Error(`Galeri görselleri kaydedilemedi: ${imagesError.message}`);
    }
    await verifyProjectImages(created.id, cleanedGallery.length);
  }

  if (cleanedShopLinks.length) {
    const { error: shopLinksError } = await supabase.from("designer_project_shop_links").insert(
      cleanedShopLinks.map((item) => ({
        project_id: created.id,
        image_url: item.imageUrl,
        pos_x: item.x,
        pos_y: item.y,
        product_url: item.productUrl,
        product_title: item.productTitle || null,
        product_image_url: item.productImageUrl || null,
        product_price: item.productPrice || null,
      }))
    );

    if (shopLinksError) {
      if (isMissingShopLinksTableError(shopLinksError.message)) {
        const projects = await listMyDesignerProjects();
        const createdProject = projects.find((p) => p.id === created.id);
        if (!createdProject) throw new Error("Proje eklendi ancak listelenemedi.");
        return createdProject;
      }
      throw new Error(`Shopable linkler kaydedilemedi: ${shopLinksError.message}`);
    }
  }

  const projects = await listMyDesignerProjects();
  const createdProject = projects.find((p) => p.id === created.id);
  if (!createdProject) throw new Error("Proje eklendi ancak listelenemedi.");
  return createdProject;
}

export async function updateDesignerProject(input: UpdateDesignerProjectInput) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Proje düzenlemek için giriş yapmalısın.");
  }

  const { title, cleanedGallery, cleanedTags, cleanedPalette, cleanedShopLinks } = cleanProjectInput(input);
  const supabase = getSupabaseBrowserClient();

  let { error: updateError } = await supabase
    .from("designer_projects")
    .update({
      title,
      project_type: (input.projectType ?? "").trim() || null,
      location: (input.location ?? "").trim() || null,
      description: (input.description ?? "").trim() || null,
      tags: cleanedTags,
      color_palette: cleanedPalette,
      budget_level: input.budgetLevel || null,
      cover_image_url: (input.coverImageUrl ?? "").trim() || cleanedGallery[0] || null,
      is_published: false,
    })
    .eq("id", input.id)
    .eq("designer_id", userId);

  if (isMissingIsPublishedError(updateError?.message)) {
    const retry = await supabase
      .from("designer_projects")
      .update({
        title,
        project_type: (input.projectType ?? "").trim() || null,
        location: (input.location ?? "").trim() || null,
        description: (input.description ?? "").trim() || null,
        tags: cleanedTags,
        color_palette: cleanedPalette,
        budget_level: input.budgetLevel || null,
        cover_image_url: (input.coverImageUrl ?? "").trim() || cleanedGallery[0] || null,
      })
      .eq("id", input.id)
      .eq("designer_id", userId);

    updateError = retry.error;
  }

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: deleteImagesError } = await supabase
    .from("designer_project_images")
    .delete()
    .eq("project_id", input.id);
  if (deleteImagesError) throw new Error(deleteImagesError.message);

  const { error: deleteShopLinksError } = await supabase
    .from("designer_project_shop_links")
    .delete()
    .eq("project_id", input.id);
  if (deleteShopLinksError && !isMissingShopLinksTableError(deleteShopLinksError.message)) {
    throw new Error(deleteShopLinksError.message);
  }

  if (cleanedGallery.length) {
    const { error: insertImagesError } = await supabase.from("designer_project_images").insert(
      cleanedGallery.map((url, index) => ({
        project_id: input.id,
        image_url: url,
        sort_order: index,
      }))
    );
    if (insertImagesError) {
      throw new Error(`Galeri görselleri güncellenemedi: ${insertImagesError.message}`);
    }
    await verifyProjectImages(input.id, cleanedGallery.length);
  }

  if (cleanedShopLinks.length) {
    const { error: insertShopLinksError } = await supabase.from("designer_project_shop_links").insert(
      cleanedShopLinks.map((item) => ({
        project_id: input.id,
        image_url: item.imageUrl,
        pos_x: item.x,
        pos_y: item.y,
        product_url: item.productUrl,
        product_title: item.productTitle || null,
        product_image_url: item.productImageUrl || null,
        product_price: item.productPrice || null,
      }))
    );
    if (insertShopLinksError) {
      if (isMissingShopLinksTableError(insertShopLinksError.message)) {
        const projects = await listMyDesignerProjects();
        const updatedProject = projects.find((p) => p.id === input.id);
        if (!updatedProject) throw new Error("Proje güncellendi ancak listelenemedi.");
        return updatedProject;
      }
      throw new Error(`Shopable linkler güncellenemedi: ${insertShopLinksError.message}`);
    }
  }

  const projects = await listMyDesignerProjects();
  const updatedProject = projects.find((p) => p.id === input.id);
  if (!updatedProject) throw new Error("Proje güncellendi ancak listelenemedi.");
  return updatedProject;
}

export async function setDesignerProjectPublished(projectId: string, published: boolean) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("İşlem için giriş yapmalısın.");

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("designer_projects")
    .update({ is_published: published })
    .eq("id", projectId)
    .eq("designer_id", userId);

  if (isMissingIsPublishedError(error?.message)) {
    throw new Error("Veritabanında is_published kolonu yok. Önce SQL migration çalıştırılmalı.");
  }
  if (error) throw new Error(error.message);
}

export async function deleteDesignerProject(projectId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("İşlem için giriş yapmalısın.");

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("designer_projects")
    .delete()
    .eq("id", projectId)
    .eq("designer_id", userId);

  if (error) throw new Error(error.message);
}
