import { BASE_URL } from "./config";
import type { NextDataResponse } from "./resolver";

const BUILD_ID_RE = /"buildId":"([^"]+)"/;

/** FLS endpoints are slow; the player list can take ~30s per page. */
const FETCH_TIMEOUT_MS = 55_000;

export async function getBuildId(timeoutMs = FETCH_TIMEOUT_MS): Promise<string> {
  const res = await fetch(BASE_URL, {
    headers: { "Accept-Language": "pl" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const html = await res.text();
  const match = html.match(BUILD_ID_RE);
  if (!match) {
    throw new Error("buildId not found — the FLS site may have changed");
  }
  return match[1];
}

export class FlsNotFoundError extends Error {
  constructor(url: string) {
    super(`FLS returned 404 for ${url} (buildId may be stale)`);
    this.name = "FlsNotFoundError";
  }
}

/**
 * Fetch a Next.js data JSON from FLS.
 * `path` is everything after `/_next/data/{buildId}/`, e.g.
 * `pl/menu-ligowe/tabela-wszech-czasow/zawodnicy/foo.json?playerSlug=foo`
 */
export async function fetchJson(
  buildId: string,
  path: string,
  referer?: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<NextDataResponse> {
  const url = `${BASE_URL}/_next/data/${buildId}/${path}`;
  const res = await fetch(url, {
    headers: {
      Accept: "*/*",
      Referer: referer ?? BASE_URL,
      "Accept-Language": "pl",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (res.status === 404) throw new FlsNotFoundError(url);
  if (!res.ok) throw new Error(`FLS request failed (${res.status}) for ${url}`);
  return (await res.json()) as NextDataResponse;
}

export async function fetchPlayerData(buildId: string, slug: string): Promise<NextDataResponse> {
  return fetchJson(
    buildId,
    `en/menu-ligowe/tabela-wszech-czasow/zawodnicy/${slug}.json?playerSlug=${slug}`,
  );
}

/**
 * All-time player list, one page (20 rows).
 * Requires the `pl` locale and a matching Referer — the `en` locale returns empty data.
 */
export async function fetchPlayerListPage(buildId: string, page: number): Promise<NextDataResponse> {
  return fetchJson(
    buildId,
    `pl/menu-ligowe/tabela-wszech-czasow/lista-zawodnikow.json?page=${page}`,
    `${BASE_URL}/menu-ligowe/tabela-wszech-czasow/lista-zawodnikow`,
  );
}

export async function fetchTeamData(
  buildId: string,
  leagueSlug: string,
  seasonSlug: string,
  teamSlug: string,
  timeoutMs?: number,
): Promise<NextDataResponse> {
  return fetchJson(
    buildId,
    `en/menu-ligowe/${leagueSlug}/${seasonSlug}/zespoly/${teamSlug}.json` +
      `?leagueSlug=${leagueSlug}&seasonSlug=${seasonSlug}&teamSlug=${teamSlug}`,
    undefined,
    timeoutMs,
  );
}
