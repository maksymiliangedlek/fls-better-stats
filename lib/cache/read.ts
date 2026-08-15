import { STALE_AFTER_MS } from "../fls/config";
import { displayEventName } from "../fls/events";
import { allGoals, EMPTY_GOALS_CACHE, type GoalRecord, type GoalsCache } from "../stats/goals";
import type { PlayerProfile } from "../types/player";
import type { TeamData } from "../types/team";
import { getStore } from "./kv";
import { INITIAL_META, KEY_GOALS, KEY_META, KEY_ROSTER, KEY_TEAM, playerKey, type SyncMeta } from "./keys";

function hydratePlayer(profile: PlayerProfile): PlayerProfile {
  return {
    ...profile,
    summary: {
      ...profile.summary,
      achievements: profile.summary.achievements ?? [],
    },
    games: (profile.games ?? []).map((g) => ({
      ...g,
      events: (g.events ?? []).map(displayEventName),
    })),
  };
}

export async function getMeta(): Promise<SyncMeta> {
  const meta = await getStore().get<SyncMeta>(KEY_META);
  return meta ? { ...INITIAL_META, ...meta } : { ...INITIAL_META };
}

export async function getRoster(): Promise<string[]> {
  return (await getStore().get<string[]>(KEY_ROSTER)) ?? [];
}

export async function getTeamData(): Promise<TeamData | null> {
  return getStore().get<TeamData>(KEY_TEAM);
}

export async function getPlayer(slug: string): Promise<PlayerProfile | null> {
  const profile = await getStore().get<PlayerProfile>(playerKey(slug));
  return profile ? hydratePlayer(profile) : null;
}

export async function getAllPlayers(): Promise<PlayerProfile[]> {
  const roster = await getRoster();
  if (roster.length === 0) return [];
  const profiles = await getStore().getMany<PlayerProfile>(roster.map(playerKey));
  return profiles.filter((p): p is PlayerProfile => p !== null).map(hydratePlayer);
}

export async function getGoalsCache(): Promise<GoalsCache> {
  return (await getStore().get<GoalsCache>(KEY_GOALS)) ?? { ...EMPTY_GOALS_CACHE, matches: {} };
}

export async function getGoalRecords(): Promise<GoalRecord[]> {
  return allGoals(await getGoalsCache());
}

export function isStale(lastSyncAt: number | null): boolean {
  if (!lastSyncAt) return true;
  return Date.now() - lastSyncAt > STALE_AFTER_MS;
}

export interface Meta {
  fetchedAt: number | null;
  stale: boolean;
}

export async function buildMetaEnvelope(): Promise<Meta> {
  const meta = await getMeta();
  return { fetchedAt: meta.lastSyncAt, stale: isStale(meta.lastSyncAt) };
}
