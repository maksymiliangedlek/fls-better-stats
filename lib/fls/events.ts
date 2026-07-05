/** EventType ID -> name (observed on FLS; mirrors main.py). */
export const EVENT_TYPE_NAMES: Record<string, string> = {
  "1": "Gol",
  "2": "Asysta",
  "3": "Żółta kartka",
  "4": "Czerwona kartka",
};

export function eventName(id: string): string {
  return EVENT_TYPE_NAMES[id] ?? `Event#${id}`;
}
