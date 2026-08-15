import "server-only";
import {
  buildMetaEnvelope,
  getAllPlayers,
  getGoalsCache,
  getPlayer,
  type Meta,
} from "../cache/read";
import { getTeamDataFresh } from "../cache/sync";
import {
  buildGoalsTimeline,
  buildTeamRecord,
  type GoalsTimelinePoint,
  type TeamRecord,
} from "../stats/aggregates";
import {
  buildCurrentSeasonLeaderboard,
  buildLeaderboard,
  type LeaderboardEntry,
  type SortKey,
} from "../stats/leaderboards";
import { buildPlayerStats, type PlayerStats } from "../stats/form";
import {
  buildBuddies,
  buildDuos,
  buildWinningGoals,
  lookupFromPlayers,
  type Duo,
  type PlayerBuddies,
} from "../stats/chemistry";
import { allGoals } from "../stats/goals";
import { comparePlayers } from "../stats/compare";
import { mergeTeamMatches, teamMatchesFromPlayers } from "../stats/matches";
import type { PlayerProfile } from "../types/player";
import type { TeamInfo, TeamMatch } from "../types/team";
import type { CompareResult } from "../types/compare";

export interface TeamOverview {
  team: TeamInfo | null;
  record: TeamRecord | null;
  rosterSize: number;
  topScorers: LeaderboardEntry[];
  recentMatches: TeamMatch[];
  goalsTimeline: GoalsTimelinePoint[];
}

export async function getTeamOverview(): Promise<{ data: TeamOverview; meta: Meta }> {
  const [team, players, meta] = await Promise.all([
    getTeamDataFresh(),
    getAllPlayers(),
    buildMetaEnvelope(),
  ]);
  const matches = mergeTeamMatches(team?.matches ?? [], teamMatchesFromPlayers(players));
  return {
    data: {
      team: team?.team ?? null,
      record: matches.length > 0 ? buildTeamRecord(matches) : null,
      rosterSize: players.length,
      topScorers: buildLeaderboard(players, "goals").slice(0, 8),
      recentMatches: matches.slice(0, 5),
      goalsTimeline: buildGoalsTimeline(matches),
    },
    meta,
  };
}

export async function getTeamMatches(): Promise<{ data: { matches: TeamMatch[] }; meta: Meta }> {
  const [team, players, meta] = await Promise.all([
    getTeamDataFresh(),
    getAllPlayers(),
    buildMetaEnvelope(),
  ]);
  const matches = mergeTeamMatches(team?.matches ?? [], teamMatchesFromPlayers(players));
  return { data: { matches }, meta };
}

export interface RosterBoard {
  scope: "all" | "current";
  sort: SortKey;
  players: LeaderboardEntry[];
}

export async function getRosterBoard(
  scope: "all" | "current" = "all",
  sort: SortKey = "goals",
): Promise<{ data: RosterBoard; meta: Meta }> {
  const [players, meta] = await Promise.all([getAllPlayers(), buildMetaEnvelope()]);
  const board =
    scope === "current"
      ? buildCurrentSeasonLeaderboard(players, sort)
      : buildLeaderboard(players, sort);
  return { data: { scope, sort, players: board }, meta };
}

export interface PlayerDetail {
  profile: PlayerProfile;
  stats: PlayerStats;
  winningGoals: number | null;
  buddies: PlayerBuddies;
}

function emptyBuddies(): PlayerBuddies {
  return { to: [], from: [] };
}

export async function getPlayerDetail(
  slug: string,
): Promise<{ data: PlayerDetail; meta: Meta } | null> {
  const [profile, players, goalsCache, meta] = await Promise.all([
    getPlayer(slug),
    getAllPlayers(),
    getGoalsCache(),
    buildMetaEnvelope(),
  ]);
  if (!profile) return null;

  const ready = Object.keys(goalsCache.matches).length > 0;
  const goals = ready ? allGoals(goalsCache) : [];
  const lookup = lookupFromPlayers(players);

  return {
    data: {
      profile,
      stats: buildPlayerStats(profile),
      winningGoals: ready ? buildWinningGoals(goals, slug) : null,
      buddies: ready ? buildBuddies(goals, slug, lookup) : emptyBuddies(),
    },
    meta,
  };
}

export async function getBestDuos(): Promise<{ data: Duo[]; meta: Meta }> {
  const [players, goalsCache, meta] = await Promise.all([
    getAllPlayers(),
    getGoalsCache(),
    buildMetaEnvelope(),
  ]);
  const ready = Object.keys(goalsCache.matches).length > 0;
  const duos = ready ? buildDuos(allGoals(goalsCache), lookupFromPlayers(players)) : [];
  return { data: duos, meta };
}

export type CompareOutcome =
  | { ok: true; data: CompareResult; meta: Meta }
  | { ok: false; error: string };

export async function getCompare(
  a: string,
  b: string,
  c?: string | null,
): Promise<CompareOutcome> {
  if (!a || !b) return { ok: false, error: "Both 'a' and 'b' player slugs are required." };

  const third = c?.trim() || null;
  const slugs = third ? [a, b, third] : [a, b];
  if (new Set(slugs).size !== slugs.length) {
    return { ok: false, error: "Choose different players." };
  }

  const [profileA, profileB, profileC, meta] = await Promise.all([
    getPlayer(a),
    getPlayer(b),
    third ? getPlayer(third) : Promise.resolve(null),
    buildMetaEnvelope(),
  ]);
  if (!profileA) return { ok: false, error: `Player '${a}' not found in cache.` };
  if (!profileB) return { ok: false, error: `Player '${b}' not found in cache.` };
  if (third && !profileC) return { ok: false, error: `Player '${third}' not found in cache.` };

  return {
    ok: true,
    data: comparePlayers(profileA, profileB, profileC ?? undefined),
    meta,
  };
}
