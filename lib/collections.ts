"use client";

import { getSupabaseBrowserClient } from "./supabase/client";
import { getSession } from "./storage";

export type Collection = {
  id: string;
  name: string;
  itemIds: string[];
  shareId?: string;
  isShareable?: boolean;
  createdAt: number;
};

export type CollectionsState = {
  collections: Collection[];
};

function toMillis(input: string | null | undefined) {
  if (!input) return Date.now();
  const ms = Date.parse(input);
  return Number.isNaN(ms) ? Date.now() : ms;
}

async function getCurrentUserId() {
  const cached = getSession();
  if (cached?.id) return cached.id;

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function mapCollectionRow(row: {
  id: string;
  title: string;
  is_public: boolean;
  created_at: string;
  collection_items?: Array<{ design_id: string }>;
}): Collection {
  return {
    id: row.id,
    shareId: row.id,
    name: row.title,
    isShareable: row.is_public,
    createdAt: toMillis(row.created_at),
    itemIds: Array.isArray(row.collection_items) ? row.collection_items.map((x) => x.design_id) : [],
  };
}

export async function loadCollections(): Promise<CollectionsState> {
  const userId = await getCurrentUserId();
  if (!userId) return { collections: [] };

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, title, is_public, created_at, collection_items(design_id)")
    .order("created_at", { ascending: false });

  if (error || !data) return { collections: [] };
  return {
    collections: data.map(mapCollectionRow),
  };
}

export async function ensureAuthOrNull() {
  const userId = await getCurrentUserId();
  return userId ? { id: userId } : null;
}

export async function createCollection(name: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Giriş gerekli");

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("collections")
    .insert({ user_id: userId, title: name, is_public: false })
    .select("id, title, is_public, created_at")
    .single();

  if (error || !data) throw new Error(error?.message || "Koleksiyon oluşturulamadı");
  return mapCollectionRow({ ...data, collection_items: [] });
}

export async function createCollectionWithItems(name: string, itemIds: string[]) {
  const c = await createCollection(name);
  const uniqueItems = Array.from(new Set(itemIds));
  if (!uniqueItems.length) return c;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("collection_items")
    .insert(uniqueItems.map((designId) => ({ collection_id: c.id, design_id: designId })));
  if (error) throw new Error(error.message);

  return { ...c, itemIds: uniqueItems };
}

export async function renameCollection(collectionId: string, name: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("collections").update({ title: name }).eq("id", collectionId);
  if (error) throw new Error(error.message);
  return loadCollections();
}

export async function deleteCollection(collectionId: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("collections").delete().eq("id", collectionId);
  if (error) throw new Error(error.message);
  return loadCollections();
}

export async function setCollectionShareable(collectionId: string, shareable: boolean) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("collections")
    .update({ is_public: shareable })
    .eq("id", collectionId);
  if (error) throw new Error(error.message);
  return loadCollections();
}

export async function toggleSaveToCollection(collectionId: string, designId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data: existing, error: findError } = await supabase
    .from("collection_items")
    .select("id")
    .eq("collection_id", collectionId)
    .eq("design_id", designId)
    .maybeSingle();

  if (findError) throw new Error(findError.message);

  if (existing?.id) {
    const { error } = await supabase.from("collection_items").delete().eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("collection_items")
      .insert({ collection_id: collectionId, design_id: designId });
    if (error) throw new Error(error.message);
  }

  return loadCollections();
}

export async function getSavedCollectionsForDesign(designId: string) {
  const state = await loadCollections();
  return state.collections.filter((c) => c.itemIds.includes(designId)).map((c) => c.id);
}

export async function getCollectionByShareId(shareId: string): Promise<Collection | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, title, is_public, created_at, collection_items(design_id)")
    .eq("id", shareId)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapCollectionRow(data);
}

export type ProjectCard = {
  id: string;
  title: string;
  coverImageUrl: string | null;
  designerId: string;
};

export async function fetchProjectCardsByIds(ids: string[]): Promise<Map<string, ProjectCard>> {
  if (ids.length === 0) return new Map();
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase
    .from("designer_projects")
    .select("id, title, cover_image_url, designer_id")
    .in("id", ids);
  const map = new Map<string, ProjectCard>();
  for (const row of data ?? []) {
    map.set(row.id, {
      id: row.id,
      title: row.title,
      coverImageUrl: row.cover_image_url,
      designerId: row.designer_id,
    });
  }
  return map;
}
