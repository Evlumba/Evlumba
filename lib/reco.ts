import { designers } from "./data";

type FeedItem = {
  id: string;
  designerId: string;
  pid: string;
  title: string;
  room: string;
  imageUrl: string;
  tags: string[];
  score?: number;
};

const TAG_POOL = [
  "Japandi",
  "Modern",
  "Minimal",
  "Bohem",
  "Klasik",
  "Rustik",
  "Scandi",
  "Endüstriyel",
  "Sıcak Ton",
  "Soğuk Ton",
  "Açık Ton",
  "Koyu Ton",
  "Ahşap",
  "Mermer",
];

function pickTags(seed: string, n = 4) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const tags: string[] = [];
  for (let i = 0; i < n; i++) tags.push(TAG_POOL[(hash + i * 97) % TAG_POOL.length]);
  return Array.from(new Set(tags)).slice(0, n);
}

export function buildFeedUniverse(): FeedItem[] {
  return (designers as any[]).flatMap((d: any) =>
    (d.projects ?? []).map((p: any) => {
      const seed = `${d.id}_${p.pid}`;
      return {
        id: seed,
        designerId: d.id,
        pid: p.pid,
        title: p.title,
        room: p.room,
        imageUrl: p.imageUrl,
        tags: pickTags(seed),
      } as FeedItem;
    })
  );
}

export function rankByStyleVector(items: FeedItem[], styleVector: string[] = []): FeedItem[] {
  if (!styleVector.length) return items;

  const set = new Set(styleVector);
  return items
    .map((it) => {
      const overlap = it.tags.reduce((acc, t) => acc + (set.has(t) ? 1 : 0), 0);
      return { ...it, score: overlap };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
