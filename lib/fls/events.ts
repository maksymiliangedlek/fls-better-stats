/** EventType ID -> name from FLS (id 3 is MVP, 4 yellow, 5 red). */
export const EVENT_TYPE_NAMES: Record<string, string> = {
  "1": "Gol",
  "2": "Asysta",
  "3": "MVP",
  "4": "Żółta kartka",
  "5": "Czerwona kartka",
  "7": "Puszczona bramka",
};

/**
 * Polish labels written while id 3 was stored as yellow and id 4 as red.
 * New parses store Event#id, so these strings only appear in older cache.
 */
const LEGACY_STORED_NAMES: Record<string, string> = {
  "Żółta kartka": "MVP",
  "Czerwona kartka": "Żółta kartka",
};

/** Stable cache key; human-readable names are applied in displayEventName. */
export function eventName(id: string, fallbackName?: string): string {
  const key = String(id ?? "").trim();
  if (key && key !== "?") return `Event#${key}`;
  if (fallbackName) return fallbackName;
  return "Event#?";
}

/** Map stored labels such as Event#5 or the old swapped card/MVP names. */
export function displayEventName(label: string): string {
  const trimmed = label.trim();
  const hashed = /^Event#(\d+)$/i.exec(trimmed);
  if (hashed && EVENT_TYPE_NAMES[hashed[1]]) return EVENT_TYPE_NAMES[hashed[1]];
  if (LEGACY_STORED_NAMES[trimmed]) return LEGACY_STORED_NAMES[trimmed];
  return EVENT_TYPE_NAMES[trimmed] ?? trimmed;
}
