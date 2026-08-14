/** EventType ID -> name (observed on FLS; mirrors main.py). */
export const EVENT_TYPE_NAMES: Record<string, string> = {
  "1": "Gol",
  "2": "Asysta",
  "3": "Żółta kartka",
  "4": "Czerwona kartka",
  "7": "Puszczona bramka",
};

export function eventName(id: string, fallbackName?: string): string {
  if (EVENT_TYPE_NAMES[id]) return EVENT_TYPE_NAMES[id];
  if (fallbackName) return fallbackName;
  return `Event#${id}`;
}

/** Map stored labels such as Event#7 from older cache entries. */
export function displayEventName(label: string): string {
  const hashed = /^Event#(\d+)$/i.exec(label.trim());
  if (hashed && EVENT_TYPE_NAMES[hashed[1]]) return EVENT_TYPE_NAMES[hashed[1]];
  return EVENT_TYPE_NAMES[label] ?? label;
}
