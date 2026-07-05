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

/** Season label "Liga C - Wiosna 2026" -> "Liga C · Wiosna 2026" (compact). */
export function seasonLabel(season: string): string {
  return season.replace(" - ", " · ");
}
