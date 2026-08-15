/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchJson, fetchPlayerData, fetchPlayerListPage } from "./client";
import { CURRENT_LEAGUE, CURRENT_SEASON, TEAM_NAME, TEAM_SLUG } from "./config";
import { filterOgniwo, parsePlayer } from "./players";
import { resolve, type NextDataResponse } from "./resolver";
import type { AllTimePlayerRow, PlayerProfile } from "../types/player";

/** A (league, season) competition Ogniwo played in. */
export interface Combo {
  league: string;
  season: string;
}

export function comboKey(c: Combo): string {
  return `${c.league}/${c.season}`;
}

export const SEED_COMBO: Combo = { league: CURRENT_LEAGUE, season: CURRENT_SEASON };

/**
 * Fetch the Ogniwo roster for one competition via the team's `zawodnicy`
 * endpoint (`competitionPlayersStatistics`), returning player slugs.
 */
export async function fetchSeasonRoster(buildId: string, combo: Combo): Promise<string[]> {
  const { league, season } = combo;
  const path =
    `en/menu-ligowe/${league}/${season}/zespoly/${TEAM_SLUG}/zawodnicy.json` +
    `?leagueSlug=${league}&seasonSlug=${season}&teamSlug=${TEAM_SLUG}`;
  const data = await fetchJson(buildId, path);
  const rootQuery: any = data.pageProps.__APOLLO_STATE__.ROOT_QUERY ?? {};
  const apollo: any = data.pageProps.__APOLLO_STATE__;
  const key = Object.keys(rootQuery).find((k) => k.startsWith("competitionPlayersStatistics("));
  if (!key) return [];

  const rows: any[] = rootQuery[key].data ?? [];
  const slugs: string[] = [];
  for (const row of rows) {
    if (row.teamName && !String(row.teamName).includes(TEAM_NAME)) continue;
    const player = resolve(apollo, row.player);
    if (player?.slug) slugs.push(player.slug);
  }
  return slugs;
}

/** Extract every (league, season) combo where Ogniwo played, from a profile's games. */
export function extractOgniwoCombos(profile: PlayerProfile): Combo[] {
  const seen = new Set<string>();
  const combos: Combo[] = [];
  for (const g of profile.games) {
    if (g.home !== TEAM_NAME && g.away !== TEAM_NAME) continue;
    if (g.league === "?" || g.season === "?") continue;
    const combo = { league: g.league, season: g.season };
    const k = comboKey(combo);
    if (!seen.has(k)) {
      seen.add(k);
      combos.push(combo);
    }
  }
  return combos;
}

export interface DiscoveryResult {
  slugs: string[];
  combos: Combo[];
  profiles: PlayerProfile[];
}

export interface DiscoveryOptions {
  /** Called after each player profile is parsed (e.g. to cache it). */
  onProfile?: (profile: PlayerProfile) => Promise<void> | void;
  /** Called on progress for logging. */
  onProgress?: (msg: string) => void;
  /** Optional safety cap on total profile fetches. */
  maxPlayers?: number;
  /** Extra (league, season) pairs to start BFS from, besides the current seed. */
  seedCombos?: Combo[];
}

/**
 * Discover the full Ogniwo roster by BFS over season rosters and player games:
 *  - a season roster reveals player slugs
 *  - a player's games reveal the seasons Ogniwo played
 * Iterates to a fixpoint. Fetches each player profile once (Ogniwo-filtered),
 * which callers can cache via `onProfile`.
 */
export async function discoverRoster(
  buildId: string,
  opts: DiscoveryOptions = {},
): Promise<DiscoveryResult> {
  const { onProfile, onProgress, maxPlayers = 500, seedCombos = [] } = opts;

  const visitedCombos = new Set<string>();
  const comboQueue: Combo[] = [SEED_COMBO, ...seedCombos];
  const rosterSlugs = new Set<string>();
  const visitedPlayers = new Set<string>();
  const playerQueue: string[] = [];
  const profiles: PlayerProfile[] = [];

  const drainCombos = async () => {
    while (comboQueue.length > 0) {
      const combo = comboQueue.shift()!;
      const k = comboKey(combo);
      if (visitedCombos.has(k)) continue;
      visitedCombos.add(k);
      try {
        const slugs = await fetchSeasonRoster(buildId, combo);
        onProgress?.(`combo ${k}: ${slugs.length} players`);
        for (const slug of slugs) {
          if (!rosterSlugs.has(slug)) {
            rosterSlugs.add(slug);
            playerQueue.push(slug);
          }
        }
      } catch (err) {
        onProgress?.(`combo ${k} failed: ${(err as Error).message}`);
      }
    }
  };

  const drainPlayers = async () => {
    while (playerQueue.length > 0) {
      if (visitedPlayers.size >= maxPlayers) break;
      const slug = playerQueue.shift()!;
      if (visitedPlayers.has(slug)) continue;
      visitedPlayers.add(slug);
      try {
        const profile = filterOgniwo(parsePlayer(await fetchPlayerData(buildId, slug)));
        profiles.push(profile);
        await onProfile?.(profile);
        onProgress?.(`player ${slug}: ${profile.summary.games} games`);
        for (const combo of extractOgniwoCombos(profile)) {
          if (!visitedCombos.has(comboKey(combo))) comboQueue.push(combo);
        }
      } catch (err) {
        onProgress?.(`player ${slug} failed: ${(err as Error).message}`);
      }
    }
  };

  while (comboQueue.length > 0 || playerQueue.length > 0) {
    await drainCombos();
    await drainPlayers();
  }

  return {
    slugs: Array.from(rosterSlugs),
    combos: Array.from(visitedCombos).map((k) => {
      const [league, season] = k.split("/");
      return { league, season };
    }),
    profiles,
  };
}

// ─── Legacy all-time list scan (kept as a fallback; not used by default) ────────

export interface PlayerListPage {
  rows: AllTimePlayerRow[];
  currentPage: number;
  lastPage: number;
  total: number;
}

export function parsePlayerListPage(data: NextDataResponse): PlayerListPage {
  const rootQuery: any = data.pageProps.__APOLLO_STATE__.ROOT_QUERY ?? {};
  const key = Object.keys(rootQuery).find((k) => k.startsWith("allTimePlayersStatistics("));
  if (!key) throw new Error("allTimePlayersStatistics not found in ROOT_QUERY");

  const paginator = rootQuery[key];
  const info = paginator.paginatorInfo ?? {};
  const rows: AllTimePlayerRow[] = (paginator.data ?? []).map((p: any) => ({
    slug: p.slug,
    fullName: p.fullName,
    teamName: p.teamName ?? "",
    gamesPlayed: p.gamesPlayed ?? 0,
    goalsScored: p.goalsScored ?? 0,
    assists: p.assists ?? 0,
    mvp: p.mvp ?? 0,
    yellowCards: p.yellowCards ?? 0,
    redCards: p.redCards ?? 0,
    avatar: p.avatar?.url ?? null,
  }));

  return {
    rows,
    currentPage: info.currentPage ?? 0,
    lastPage: info.lastPage ?? 0,
    total: info.total ?? 0,
  };
}

export function isOgniwoPlayer(row: AllTimePlayerRow): boolean {
  return row.teamName.includes(TEAM_NAME);
}

export async function scanRosterPages(
  buildId: string,
  fromPage: number,
  pageCount: number,
): Promise<{ slugs: string[]; nextPage: number; lastPage: number; done: boolean }> {
  const slugs: string[] = [];
  let lastPage = 0;
  let page = fromPage;

  for (let i = 0; i < pageCount; i++, page++) {
    const data = await fetchPlayerListPage(buildId, page);
    const parsed = parsePlayerListPage(data);
    lastPage = parsed.lastPage;
    for (const row of parsed.rows) {
      if (isOgniwoPlayer(row)) slugs.push(row.slug);
    }
    if (parsed.rows.length === 0 || page >= parsed.lastPage) {
      return { slugs, nextPage: page + 1, lastPage, done: true };
    }
  }

  return { slugs, nextPage: page, lastPage, done: false };
}
