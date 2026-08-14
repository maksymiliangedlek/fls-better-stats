import {
  FlsNotFoundError,
  fetchPlayerData,
  fetchTeamData,
  getBuildId,
} from "../fls/client";
import {
  CURRENT_LEAGUE,
  CURRENT_SEASON,
  LIVE_TEAM_TIMEOUT_MS,
  PLAYERS_PER_SYNC,
  TEAM_LIVE_MAX_AGE_MS,
  TEAM_SLUG,
  competitionKey,
  competitionsToProbe,
  type Competition,
} from "../fls/config";
import { discoverRoster, fetchSeasonRoster } from "../fls/discovery";
import { filterOgniwo, parsePlayer } from "../fls/players";
import { parseTeamData } from "../fls/teams";
import type { PlayerProfile } from "../types/player";
import type { TeamData } from "../types/team";
import { mergeTeamMatches } from "../stats/matches";
import { getStore } from "./kv";
import { getMeta, getRoster, getTeamData } from "./read";
import { KEY_META, KEY_ROSTER, KEY_TEAM, playerKey, type SyncMeta } from "./keys";

async function saveMeta(meta: SyncMeta): Promise<void> {
  await getStore().set(KEY_META, meta);
}

/** Resolve a usable buildId, refreshing and persisting it when missing. */
export async function ensureBuildId(meta: SyncMeta, timeoutMs?: number): Promise<string> {
  if (meta.buildId) return meta.buildId;
  const buildId = await getBuildId(timeoutMs);
  meta.buildId = buildId;
  await saveMeta(meta);
  return buildId;
}

/** Fetch one team page; 404 means Ogniwo is not in that competition (not a stale buildId). */
async function fetchTeamCombo(
  buildId: string,
  combo: Competition,
  timeoutMs?: number,
): Promise<TeamData | null> {
  try {
    const raw = await fetchTeamData(buildId, combo.league, combo.season, TEAM_SLUG, timeoutMs);
    return parseTeamData(raw, combo.league, combo.season);
  } catch (err) {
    if (err instanceof FlsNotFoundError) return null;
    throw err;
  }
}

async function saveTeamData(team: TeamData, meta: SyncMeta): Promise<void> {
  await getStore().set(KEY_TEAM, team);
  meta.lastTeamSyncAt = Date.now();
  await saveMeta(meta);
}

function pickCurrentTeam(pages: { combo: Competition; data: TeamData }[]): TeamData {
  const seed = pages.find(
    (p) => p.combo.league === CURRENT_LEAGUE && p.combo.season === CURRENT_SEASON,
  );
  const newest = [...pages].sort((a, b) => {
    const da = a.data.matches[0]?.date ?? "";
    const db = b.data.matches[0]?.date ?? "";
    return db.localeCompare(da);
  })[0];
  const chosen = seed ?? newest;
  const matches = mergeTeamMatches(
    pages.flatMap((p) => p.data.matches),
    [],
  );
  return { team: chosen.data.team, matches };
}

/** Scrape Ogniwo team pages for known + nearby competitions and merge into cache. */
export async function syncTeamPages(
  buildId: string,
  meta: SyncMeta,
  timeoutMs?: number,
): Promise<{ found: number }> {
  const cached = await getTeamData();
  const combos = competitionsToProbe(meta.combos);
  const results = await Promise.allSettled(
    combos.map(async (combo) => {
      const data = await fetchTeamCombo(buildId, combo, timeoutMs);
      return { combo, data };
    }),
  );

  const found: { combo: Competition; data: TeamData }[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value.data) continue;
    found.push({ combo: result.value.combo, data: result.value.data });
  }

  if (found.length === 0) {
    const seed = await fetchTeamCombo(
      buildId,
      { league: CURRENT_LEAGUE, season: CURRENT_SEASON },
      timeoutMs,
    );
    if (!seed) throw new FlsNotFoundError("current team page");
    found.push({
      combo: { league: CURRENT_LEAGUE, season: CURRENT_SEASON },
      data: seed,
    });
  }

  const probed = pickCurrentTeam(found);
  const merged: TeamData = {
    team: probed.team,
    matches: mergeTeamMatches(probed.matches, cached?.matches ?? []),
  };
  await saveTeamData(merged, meta);

  const known = new Set(meta.combos.map(competitionKey));
  for (const { combo } of found) {
    if (!known.has(competitionKey(combo))) {
      meta.combos.push(combo);
      known.add(competitionKey(combo));
    }
  }
  await saveMeta(meta);
  return { found: found.length };
}

/** Fetch and cache the current-season team page (fast, one request), merged into existing matches. */
export async function syncTeam(
  buildId: string,
  meta: SyncMeta,
  timeoutMs?: number,
): Promise<void> {
  const cached = await getTeamData();
  const fresh = await fetchTeamCombo(
    buildId,
    { league: CURRENT_LEAGUE, season: CURRENT_SEASON },
    timeoutMs,
  );
  if (!fresh) throw new FlsNotFoundError("current team page");
  await saveTeamData(
    {
      team: fresh.team,
      matches: mergeTeamMatches(fresh.matches, cached?.matches ?? []),
    },
    meta,
  );
}

/**
 * Team page for UI/API: one FLS request when the cache is older than
 * TEAM_LIVE_MAX_AGE_MS. Falls back to cache if FLS is slow or down.
 */
export async function getTeamDataFresh(): Promise<TeamData | null> {
  const [cached, meta] = await Promise.all([getTeamData(), getMeta()]);
  const last = meta.lastTeamSyncAt ?? null;
  const age = last ? Date.now() - last : Infinity;
  if (cached && age < TEAM_LIVE_MAX_AGE_MS) return cached;

  try {
    const step = async () => {
      const buildId = await ensureBuildId(meta, LIVE_TEAM_TIMEOUT_MS);
      await syncTeam(buildId, meta, LIVE_TEAM_TIMEOUT_MS);
    };
    try {
      await step();
    } catch (err) {
      if (err instanceof FlsNotFoundError) {
        meta.buildId = null;
        await saveMeta(meta);
        await step();
      } else {
        throw err;
      }
    }
    return await getTeamData();
  } catch (err) {
    console.error("Live team refresh failed, using cache:", err);
    return cached;
  }
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

/** Pull current-competition rosters into the cached slug list (picks up new signings). */
async function absorbSeasonRosters(buildId: string, meta: SyncMeta): Promise<string[]> {
  const combos: Competition[] = [
    { league: CURRENT_LEAGUE, season: CURRENT_SEASON },
    ...meta.combos.filter(
      (c) => c.season.includes(String(new Date().getFullYear())) || c.season === CURRENT_SEASON,
    ),
  ];
  const seen = new Set<string>();
  const unique = combos.filter((c) => {
    const key = competitionKey(c);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const lists = await Promise.all(
    unique.map(async (combo) => {
      try {
        return await fetchSeasonRoster(buildId, combo);
      } catch {
        return [] as string[];
      }
    }),
  );

  const store = getStore();
  const roster = new Set(await getRoster());
  for (const slug of lists.flat()) roster.add(slug);
  const next = Array.from(roster);
  await store.set(KEY_ROSTER, next);
  return next;
}

export async function syncPlayerChunk(buildId: string, meta: SyncMeta): Promise<number> {
  const roster = await getRoster();
  if (roster.length === 0) return 0;

  const store = getStore();
  const start = meta.playerSyncIndex % roster.length;
  const slice: string[] = [];
  for (let i = 0; i < PLAYERS_PER_SYNC && i < roster.length; i++) {
    slice.push(roster[(start + i) % roster.length]);
  }

  const results = await Promise.allSettled(
    slice.map(async (slug) => {
      const profile = await fetchAndParsePlayer(buildId, slug);
      await store.set(playerKey(slug), profile);
    }),
  );

  let refreshed = 0;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      refreshed += 1;
      continue;
    }
    if (result.reason instanceof FlsNotFoundError) throw result.reason;
    console.error(`Failed to sync player ${slice[i]}:`, result.reason);
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
 * One daily cron step (Hobby-safe):
 *  - scrape Ogniwo team pages across nearby leagues/seasons (new fixtures)
 *  - if the roster has never been discovered, run discovery
 *  - otherwise refresh the whole roster
 * Refreshes the buildId once on a 404 and retries.
 */
export async function runCronSync(): Promise<CronSyncResult> {
  const meta = await getMeta();

  const step = async (): Promise<CronSyncResult> => {
    const buildId = await ensureBuildId(meta);
    await syncTeamPages(buildId, meta);

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

    await absorbSeasonRosters(buildId, meta);
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
    await syncTeamPages(buildId, meta);
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
