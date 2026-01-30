import { getSession } from "./storage";

export type Collection = {
  id: string;
  name: string;
  itemIds: string[]; // design ids
  shareId?: string; // public share id
  isShareable?: boolean;
  createdAt: number;
};

export type CollectionsState = {
  collections: Collection[];
};

const KEY = "evlumba_collections_v1";

function uid(prefix = "col") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function genShareId() {
  return Math.random().toString(36).slice(2, 10);
}

function seedCollections(): CollectionsState {
  const now = Date.now();
  return {
    collections: [
      {
        id: uid("col"),
        name: "Salon İlhamları",
        itemIds: [],
        createdAt: now - 86400000 * 3,
        isShareable: true,
        shareId: "salon-demo",
      },
      {
        id: uid("col"),
        name: "Mutfak Fikirleri",
        itemIds: [],
        createdAt: now - 86400000 * 2,
        isShareable: false,
      },
      {
        id: uid("col"),
        name: "Japandi Mood",
        itemIds: [],
        createdAt: now - 86400000,
        isShareable: true,
        shareId: "japandi-demo",
      },
    ],
  };
}

function normalizeState(input: any): CollectionsState {
  const arr = Array.isArray(input?.collections) ? input.collections : [];
  const collections: Collection[] = arr.map((c: any) => ({
    id: String(c?.id || uid("col")),
    name: String(c?.name || "Koleksiyon"),
    itemIds: Array.isArray(c?.itemIds) ? c.itemIds.map(String) : [],
    shareId: c?.shareId ? String(c.shareId) : undefined,
    isShareable: typeof c?.isShareable === "boolean" ? c.isShareable : false,
    createdAt: typeof c?.createdAt === "number" ? c.createdAt : Date.now(),
  }));
  return { collections };
}

export function loadCollections(): CollectionsState {
  if (typeof window === "undefined") return { collections: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedCollections();

    const parsed = JSON.parse(raw);
    const normalized = normalizeState(parsed);

    if (!normalized.collections.length) return seedCollections();
    return normalized;
  } catch {
    return seedCollections();
  }
}

export function saveCollections(state: CollectionsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function ensureAuthOrNull() {
  const s = getSession?.();
  return s ? s : null;
}

export function createCollection(name: string) {
  const state = loadCollections();
  const c: Collection = {
    id: uid("col"),
    name,
    itemIds: [],
    createdAt: Date.now(),
    isShareable: false,
  };
  state.collections = [c, ...state.collections];
  saveCollections(state);
  return c;
}

export function createCollectionWithItems(name: string, itemIds: string[]) {
  const state = loadCollections();
  const c: Collection = {
    id: uid("col"),
    name,
    itemIds: Array.from(new Set(itemIds)),
    createdAt: Date.now(),
    isShareable: false,
  };
  state.collections = [c, ...state.collections];
  saveCollections(state);
  return c;
}

export function renameCollection(collectionId: string, name: string) {
  const state = loadCollections();
  const c = state.collections.find((x) => x.id === collectionId);
  if (!c) return state;
  c.name = name;
  saveCollections(state);
  return state;
}

export function deleteCollection(collectionId: string) {
  const state = loadCollections();
  state.collections = state.collections.filter((x) => x.id !== collectionId);
  saveCollections(state);
  return state;
}

export function setCollectionShareable(collectionId: string, shareable: boolean) {
  const state = loadCollections();
  const c = state.collections.find((x) => x.id === collectionId);
  if (!c) return state;

  c.isShareable = shareable;

  if (shareable) {
    if (!c.shareId) c.shareId = genShareId();
  } else {
    // kapatınca public link çalışmasın
    c.shareId = undefined;
  }

  saveCollections(state);
  return state;
}

export function toggleSaveToCollection(collectionId: string, designId: string) {
  const state = loadCollections();
  const c = state.collections.find((x) => x.id === collectionId);
  if (!c) return state;

  const exists = c.itemIds.includes(designId);
  c.itemIds = exists ? c.itemIds.filter((id) => id !== designId) : [designId, ...c.itemIds];

  saveCollections(state);
  return state;
}

export function getSavedCollectionsForDesign(designId: string) {
  const state = loadCollections();
  return state.collections.filter((c) => c.itemIds.includes(designId)).map((c) => c.id);
}

export function getCollectionByShareId(shareId: string): Collection | null {
  const state = loadCollections();
  const c = state.collections.find((x) => x.isShareable && x.shareId === shareId);
  return c || null;
}
