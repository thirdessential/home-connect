import type { Tower } from "@/types/society.type";

export type SelectOption = { id: string; name: string };

/**
 * Flats exactly as the backend returned them for a tower: stringified, trimmed,
 * de-duplicated (exact, case-insensitive) and never synthesised from counts or
 * ranges. Identifiers like "0101" or "201A" are preserved verbatim.
 */
export const getTowerFlats = (tower?: Pick<Tower, "flats"> | null): string[] => {
  if (!tower || !Array.isArray(tower.flats)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tower.flats) {
    if (raw === null || raw === undefined) continue;
    const flat = String(raw).trim();
    if (!flat) continue;
    const key = flat.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(flat);
  }
  return out;
};

/** Case-insensitive partial match on the trimmed query; empty query returns all. */
export const filterFlats = (flats: string[], query: string): string[] => {
  const q = query.trim().toLowerCase();
  return q ? flats.filter((f) => f.toLowerCase().includes(q)) : flats;
};

/** Flat count to display: the real list length when present, else the backend total. */
export const getTowerFlatCount = (tower: Tower): number | undefined => {
  const flats = getTowerFlats(tower);
  return flats.length > 0 ? flats.length : tower.totalFlats;
};

export const toTowerOptions = (towers: Tower[]): SelectOption[] =>
  towers.map((t) => {
    const count = getTowerFlatCount(t);
    return {
      id: t._id,
      name: count ? `${t.name} — ${count} ${count === 1 ? "flat" : "flats"}` : t.name,
    };
  });

export const toFlatOptions = (flats: string[]): SelectOption[] =>
  flats.map((f) => ({ id: f, name: f }));

/** Keep the selected flat only if the (new) tower really contains it. */
export const reconcileFlat = (flat: string | null, flats: string[]): string | null =>
  flat !== null && flats.includes(flat) ? flat : null;
