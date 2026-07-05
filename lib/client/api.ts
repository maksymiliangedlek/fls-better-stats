import type { Meta } from "../cache/read";
import type { SortKey } from "../stats/leaderboards";
import type { TeamOverview, RosterBoard, PlayerDetail } from "../data/queries";
import type { CompareResult } from "../types/compare";

export type { SortKey };

export interface ApiEnvelope<T> {
  data: T;
  meta: Meta;
}

async function getJson<T>(url: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as ApiEnvelope<T>;
}

export function fetchTeamOverview(): Promise<ApiEnvelope<TeamOverview>> {
  return getJson<TeamOverview>("/api/team");
}

export function fetchRoster(
  scope: "all" | "current" = "all",
  sort: SortKey = "goals",
): Promise<ApiEnvelope<RosterBoard>> {
  const qs = new URLSearchParams({ scope, sort });
  return getJson<RosterBoard>(`/api/players?${qs.toString()}`);
}

export function fetchPlayer(slug: string): Promise<ApiEnvelope<PlayerDetail>> {
  return getJson<PlayerDetail>(`/api/players/${encodeURIComponent(slug)}`);
}

export function fetchCompare(a: string, b: string): Promise<ApiEnvelope<CompareResult>> {
  const qs = new URLSearchParams({ a, b });
  return getJson<CompareResult>(`/api/compare?${qs.toString()}`);
}
