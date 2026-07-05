import {
  FlsNotFoundError,
  fetchPlayerData,
  fetchTeamData,
  getBuildId,
} from "../fls/client";
import {
  CURRENT_LEAGUE,
  CURRENT_SEASON,
  PLAYERS_PER_SYNC,
  TEAM_SLUG,
} from "../fls/config";
import { discoverRoster } from "../fls/discovery";
import { filterOgniwo, parsePlayer } from "../fls/players";
import { parseTeamData } from "../fls/teams";
import type { PlayerProfile } from "../types/player";
import { getStore } from "./kv";
import { getMeta, getRoster } from "./read";
import { KEY_META, KEY_ROSTER, KEY_TEAM, playerKey, type SyncMeta } from "./keys";

async function saveMeta(meta: SyncMeta): Promise<void> {
  await getStore().set(KEY_META, meta);
}

/** Resolve a usable buildId, refreshing and persisting it when missing. */
export async function ensureBuildId(meta: SyncMeta): Promise<string> {
  if (meta.buildId) return meta.buildId;
  const buildId = await getBuildId();
  meta.buildId = buildId;
  await saveMeta(meta);
  return buildId;
}

/** Fetch and cache the current-season team page (fast, one request). */
export async function syncTeam(buildId: string): Promise<void> {
  const raw = await fetchTeamData(buildId, CURRENT_LEAGUE, CURRENT_SEASON, TEAM_SLUG);
  const team = parseTeamData(raw);
  await getStore().set(KEY_TEAM, team);
}

export async function fetchAndParsePlayer(buildId: string, slug: string): Promise<PlayerProfile> {
  const data = await fetchPlayerData(buildId, slug);
  return filterOgniwo(parsePlayer(data));
}

export interface DiscoverySummary {
  rosterSize: number;
  combos: number;
  profilesCached: number;
}

/**
 * Discover the Ogniwo roster (BFS over season rosters + player games) and cache
 * every player profile it fetches along the way. This is the full sync used by
 * the local script and the manual /api/sync trigger.
 */
export async function runDiscovery(
  buildId: string,
  meta: SyncMeta,
  onProgress?: (msg: string) => void,
): Promise<DiscoverySummary> {
  const store = getStore();
  let cached = 0;

  const result = await discoverRoster(buildId, {
    onProfile: async (profile) => {
      await store.set(playerKey(profile.slug), profile);
      cached += 1;
    },
    onProgress,
  });

  await store.set(KEY_ROSTER, result.slugs);
  meta.combos = result.combos;
  meta.discovered = true;
  meta.lastDiscoveryAt = Date.now();
  meta.lastSyncAt = Date.now();
  meta.playerSyncIndex = 0;
  await saveMeta(meta);

  return { rosterSize: result.slugs.length, combos: result.combos.length, profilesCached: cached };
}

/** Refresh a chunk of player profiles from the roster (Ogniwo-filtered). */
export async function syncPlayerChunk(buildId: string, meta: SyncMeta): Promise<number> {
  const roster = await getRoster();
  if (roster.length === 0) return 0;

  const store = getStore();
  const start = meta.playerSyncIndex % roster.length;
  const slice: string[] = [];
  for (let i = 0; i < PLAYERS_PER_SYNC && i < roster.length; i++) {
    slice.push(roster[(start + i) % roster.length]);
  }

  let refreshed = 0;
  for (const slug of slice) {
    try {
      const profile = await fetchAndParsePlayer(buildId, slug);
      await store.set(playerKey(slug), profile);
      refreshed += 1;
    } catch (err) {
      if (err instanceof FlsNotFoundError) throw err;
      console.error(`Failed to sync player ${slug}:`, err);
    }
  }

  meta.playerSyncIndex = (start + slice.length) % roster.length;
  meta.lastSyncAt = Date.now();
  await saveMeta(meta);
  return refreshed;
}

export interface CronSyncResult {
  buildId: string;
  phase: "discovery" | "players";
  rosterSize: number;
  combos: number;
  refreshed?: number;
  discovery?: DiscoverySummary;
}

/**
 * One cron step:
 *  - refresh the team page (cheap)
 *  - if the roster has never been discovered, run discovery
 *  - otherwise refresh the next chunk of player profiles
 * Refreshes the buildId once on a 404 and retries.
 */
export async function runCronSync(): Promise<CronSyncResult> {
  const meta = await getMeta();

  const step = async (): Promise<CronSyncResult> => {
    const buildId = await ensureBuildId(meta);
    await syncTeam(buildId);

    if (!meta.discovered) {
      const discovery = await runDiscovery(buildId, meta);
      return {
        buildId,
        phase: "discovery",
        rosterSize: discovery.rosterSize,
        combos: discovery.combos,
        discovery,
      };
    }

    const refreshed = await syncPlayerChunk(buildId, meta);
    const rosterSize = (await getRoster()).length;
    return { buildId, phase: "players", rosterSize, combos: meta.combos.length, refreshed };
  };

  try {
    return await step();
  } catch (err) {
    if (err instanceof FlsNotFoundError) {
      meta.buildId = null;
      await saveMeta(meta);
      return await step();
    }
    throw err;
  }
}

/** Full sync: build id + team + discovery (used by /api/sync and sync-local). */
export async function runFullSync(
  onProgress?: (msg: string) => void,
): Promise<{ buildId: string; discovery: DiscoverySummary }> {
  const meta = await getMeta();

  const step = async () => {
    const buildId = await ensureBuildId(meta);
    await syncTeam(buildId);
    const discovery = await runDiscovery(buildId, meta, onProgress);
    return { buildId, discovery };
  };

  try {
    return await step();
  } catch (err) {
    if (err instanceof FlsNotFoundError) {
      meta.buildId = null;
      await saveMeta(meta);
      return await step();
    }
    throw err;
  }
}
