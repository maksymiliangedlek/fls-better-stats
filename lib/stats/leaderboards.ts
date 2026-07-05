import { CURRENT_SEASON } from "../fls/config";
import type { PlayerProfile } from "../types/player";

export interface LeaderboardEntry {
  slug: string;
  name: string;
  avatar: string | null;
  games: number;
  goals: number;
  assists: number;
  goalContributions: number;
  mvp: number;
  yellowCards: number;
  redCards: number;
  goalsPerGame: number;
  assistsPerGame: number;
}

export type SortKey =
  | "goals"
  | "assists"
  | "goalContributions"
  | "mvp"
  | "games"
  | "goalsPerGame"
  | "assistsPerGame";

export const SORT_KEYS: SortKey[] = [
  "goals",
  "assists",
  "goalContributions",
  "mvp",
  "games",
  "goalsPerGame",
  "assistsPerGame",
];

function toEntry(profile: PlayerProfile): LeaderboardEntry {
  const s = profile.summary;
  return {
    slug: profile.slug,
    name: s.name,
    avatar: s.avatar,
    games: s.games,
    goals: s.goals,
    assists: s.assists,
    goalContributions: s.goalContributions,
    mvp: s.mvp,
    yellowCards: s.yellowCards,
    redCards: s.redCards,
    goalsPerGame: s.goalsPerGame,
    assistsPerGame: s.assistsPerGame,
  };
}

/** All-time Ogniwo leaderboard, sorted by the given key (desc). */
export function buildLeaderboard(profiles: PlayerProfile[], sort: SortKey = "goals"): LeaderboardEntry[] {
  return profiles
    .map(toEntry)
    .sort((a, b) => b[sort] - a[sort] || b.goalContributions - a.goalContributions);
}

/** Current-season Ogniwo leaderboard, derived from each player's current-season row. */
export function buildCurrentSeasonLeaderboard(
  profiles: PlayerProfile[],
  sort: SortKey = "goals",
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  for (const profile of profiles) {
    const season = profile.seasons.find((s) => s.season.toLowerCase().includes(CURRENT_SEASON.replace("-", " ")));
    if (!season) continue;
    const goalContributions = season.goals + season.assists;
    entries.push({
      slug: profile.slug,
      name: profile.summary.name,
      avatar: profile.summary.avatar,
      games: season.games,
      goals: season.goals,
      assists: season.assists,
      goalContributions,
      mvp: season.mvp,
      yellowCards: season.yellowCards,
      redCards: season.redCards,
      goalsPerGame: season.games > 0 ? Math.round((season.goals / season.games) * 100) / 100 : 0,
      assistsPerGame: season.games > 0 ? Math.round((season.assists / season.games) * 100) / 100 : 0,
    });
  }
  return entries.sort((a, b) => b[sort] - a[sort] || b.goalContributions - a.goalContributions);
}
