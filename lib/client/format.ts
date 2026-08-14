const MONTHS_PL = [
  "sty",
  "lut",
  "mar",
  "kwi",
  "maj",
  "cze",
  "lip",
  "sie",
  "wrz",
  "paź",
  "lis",
  "gru",
];

/** "2026-06-19" -> "19 cze 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_PL[m - 1]} ${y}`;
}

/** "2026-06-19" -> "19.06" */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${d}.${m}`;
}

/** Compute age in years from an ISO birth date. */
export function ageFrom(iso: string | null): number | null {
  if (!iso) return null;
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function ratio(value: number, games: number): string {
  return games > 0 ? (value / games).toFixed(2) : "0.00";
}

/** "wiosna-2026" -> "Wiosna 2026" */
export function formatSeasonSlug(slug: string): string {
  if (!slug || slug === "inne") return "Inne";
  return slug
    .split("-")
    .map((part) => (part.length === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join(" ");
}

/** Season label "Liga C - Wiosna 2026" -> "Liga C · Wiosna 2026" (compact). */
export function seasonLabel(season: string): string {
  return season.replace(" - ", " · ");
}

function seasonYear(name: string): number {
  const tail = name.trim().slice(-4);
  const year = Number(tail);
  return Number.isFinite(year) ? year : 0;
}

function seasonPhase(name: string): number {
  const lower = name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (lower.includes("jesien")) return 0;
  if (lower.includes("zima")) return 1;
  if (lower.includes("wiosna")) return 2;
  return 3;
}

/** Oldest → newest: year (last 4 chars), then jesień, zima, wiosna. */
export function compareSeasons(a: string, b: string): number {
  return seasonYear(a) - seasonYear(b) || seasonPhase(a) - seasonPhase(b) || a.localeCompare(b);
}
