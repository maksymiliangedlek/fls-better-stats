const WARSAW = "Europe/Warsaw";

/**
 * FLS stores kickoff as UTC ISO (`2026-08-26T19:00:00.000000Z`).
 * Split into a calendar date + HH:mm in Europe/Warsaw.
 */
export function parseGameDateTime(raw: unknown): { date: string; time: string | null } {
  if (raw == null || raw === "" || raw === "-") return { date: "?", time: null };
  const iso = String(raw).trim();
  if (iso === "?") return { date: "?", time: null };
  if (!iso.includes("T")) return { date: iso.slice(0, 10), time: null };

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { date: iso.slice(0, 10), time: null };

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: WARSAW,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: WARSAW,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
  return { date, time };
}
