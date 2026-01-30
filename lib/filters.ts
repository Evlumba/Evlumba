export type DesignFilters = {
  room?: string;
  city?: string;
  budgetMax?: number;
  vibe?: "Sıcak Ton" | "Soğuk Ton" | "Açık Ton" | "Koyu Ton" | "";
  onlyPopular?: boolean;
};

export type FilterChip = { key: string; label: string };

export const DEFAULT_FILTERS: DesignFilters = {
  room: "",
  city: "",
  budgetMax: 0,
  vibe: "",
  onlyPopular: false,
};

export function toChips(f: DesignFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.room) chips.push({ key: "room", label: `Oda: ${f.room}` });
  if (f.city) chips.push({ key: "city", label: `Şehir: ${f.city}` });
  if (f.vibe) chips.push({ key: "vibe", label: `Renk Hissi: ${f.vibe}` });
  if (f.budgetMax && f.budgetMax > 0) chips.push({ key: "budgetMax", label: `Bütçe: ≤ ${f.budgetMax}K` });
  if (f.onlyPopular) chips.push({ key: "onlyPopular", label: "Popüler" });
  return chips;
}
