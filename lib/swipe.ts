import { getSession, setSession } from "@/lib/storage";

export type SwipeMode = "random" | "category";
export type SwipeLength = 8 | 20;

export type SwipeCard = {
  id: string;
  title: string;
  imageUrl: string;
  tags: string[]; // ✅ always array
  room?: string;
  city?: string;
};

const GOLDEN_KEY = "evlumba_golden_v1";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pick<T>(arr: T[], n: number) {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < n) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function topTags(counts: Record<string, number>, k = 6) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([t]) => t);
}

/** ✅ StyleSwipeClient'in beklediği: golden like harcama */
export function consumeGoldenLike(limitPerDay = 3): { ok: boolean; left: number } {
  if (typeof window === "undefined") return { ok: false, left: limitPerDay };

  const today = todayKey();
  let raw: any = null;

  try {
    raw = JSON.parse(localStorage.getItem(GOLDEN_KEY) || "null");
  } catch {
    raw = null;
  }

  if (!raw || raw.date !== today) raw = { date: today, used: 0 };

  if (raw.used >= limitPerDay) {
    return { ok: false, left: 0 };
  }

  raw.used += 1;
  localStorage.setItem(GOLDEN_KEY, JSON.stringify(raw));

  return { ok: true, left: Math.max(0, limitPerDay - raw.used) };
}

/** ✅ StyleSwipeClient'in beklediği: deck üret */
export function buildSwipeDeck(args: {
  items: SwipeCard[];
  mode: SwipeMode;
  category?: string;
  tourLen: SwipeLength;
}) {
  const base = Array.isArray(args.items) ? args.items : [];

  const filtered =
    args.mode === "category" && args.category
      ? base.filter((x) =>
          String(x.room || "")
            .toLowerCase()
            .includes(String(args.category).toLowerCase())
        )
      : base;

  const source = filtered.length >= args.tourLen ? filtered : base;
  return pick(source, args.tourLen);
}

/** ✅ StyleSwipeClient'in beklediği: like'lara göre vektör çıkar + session'a yaz */
export function saveStyleVectorFromLikes(args: {
  likedIds: string[];
  allCards: SwipeCard[];
}) {
  const { likedIds, allCards } = args;

  const byId = new Map(allCards.map((c) => [String(c.id), c]));
  const counts: Record<string, number> = {};

  for (const id of likedIds) {
    const card = byId.get(String(id));
    if (!card) continue;
    for (const t of card.tags || []) {
      const key = String(t);
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  const styleVector = topTags(counts, 6);

  // session'a yaz
  const s = getSession() || {};
  setSession({
    ...s,
    style_swipe_completed: true,
    styleVector,
  });

  return { counts, styleVector };
}
