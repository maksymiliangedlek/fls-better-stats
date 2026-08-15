import { TEAM_NAME } from "../fls/config";
import type { GameDetails, GameDetailsEvent } from "../fls/gameEvents";
import { gameDateFromDetails } from "../fls/gameEvents";
import type { PlayerProfile } from "../types/player";

export interface GoalRecord {
  gameId: string;
  date: string;
  opponent: string;
  scorer: string;
  assist: string | null;
  time: number | null;
  winning: boolean;
  ownGoal: boolean;
}

export interface CachedMatchGoals {
  date: string;
  opponent: string;
  goals: GoalRecord[];
}

export interface GoalsCache {
  matches: Record<string, CachedMatchGoals>;
}

export const EMPTY_GOALS_CACHE: GoalsCache = { matches: {} };

const GOAL_TYPE = "1";
const ASSIST_TYPE = "2";

interface TimedEvent {
  id: number;
  time: number;
  extra: boolean;
  forOpposite: boolean;
  typeId: string;
  teamId: string;
  slug: string | null;
}

function typeIdOf(ev: GameDetailsEvent): string {
  return String(ev.event_type?.id ?? "");
}

function teamIdOf(ev: GameDetailsEvent): string | null {
  const id = ev.game_player?.game_team_id;
  return id != null ? String(id) : null;
}

function toTimed(ev: GameDetailsEvent): TimedEvent | null {
  const teamId = teamIdOf(ev);
  if (!teamId) return null;
  const id = Number(ev.id);
  return {
    id: Number.isFinite(id) ? id : 0,
    time: ev.time ?? 0,
    extra: Boolean(ev.in_additional_time),
    forOpposite: Boolean(ev.for_opposite_team),
    typeId: typeIdOf(ev),
    teamId,
    slug: ev.game_player?.competition_player?.player?.slug ?? null,
  };
}

function eventOrder(a: TimedEvent, b: TimedEvent): number {
  return a.time - b.time || Number(a.extra) - Number(b.extra) || a.id - b.id;
}

function pairKey(ev: TimedEvent): string {
  return `${ev.time}|${ev.extra ? 1 : 0}|${ev.teamId}`;
}

function parseScore(game: GameDetails): { home: number | null; away: number | null } {
  if (game.score_home != null && game.score_away != null) {
    return { home: game.score_home, away: game.score_away };
  }
  const parts = (game.result ?? "").split("-").map((s) => Number(s.trim()));
  if (parts.length === 2 && parts.every(Number.isFinite)) return { home: parts[0], away: parts[1] };
  return { home: null, away: null };
}

function scoringTeamId(goal: TimedEvent, homeId: string, awayId: string): string {
  if (!goal.forOpposite) return goal.teamId;
  return goal.teamId === homeId ? awayId : homeId;
}

/**
 * Ogniwo goals from a full FLS match timeline, with assists paired by minute + team
 * and the winning goal marked when reconstruction matches the official score.
 */
export function parseGameGoals(game: GameDetails): GoalRecord[] {
  const homeId = game.home_team?.id != null ? String(game.home_team.id) : "";
  const awayId = game.away_team?.id != null ? String(game.away_team.id) : "";
  const homeName = game.home_team?.competition_team?.team?.name ?? "";
  const awayName = game.away_team?.competition_team?.team?.name ?? "";
  if (!homeId || !awayId) return [];

  const ogniwoHome = homeName === TEAM_NAME;
  const ogniwoAway = awayName === TEAM_NAME;
  if (!ogniwoHome && !ogniwoAway) return [];

  const ogniwoId = ogniwoHome ? homeId : awayId;
  const opponent = ogniwoHome ? awayName : homeName;
  const gameId = String(game.id);
  const date = gameDateFromDetails(game);

  const timed = (game.events ?? []).map(toTimed).filter((e): e is TimedEvent => e !== null);
  const goals = timed.filter((e) => e.typeId === GOAL_TYPE).sort(eventOrder);
  const assists = timed.filter((e) => e.typeId === ASSIST_TYPE).sort(eventOrder);

  const assistQueue = new Map<string, TimedEvent[]>();
  for (const assist of assists) {
    const key = pairKey(assist);
    const list = assistQueue.get(key);
    if (list) list.push(assist);
    else assistQueue.set(key, [assist]);
  }

  const official = parseScore(game);
  const officialOgniwo = ogniwoHome ? official.home : official.away;
  const officialOpp = ogniwoHome ? official.away : official.home;

  let homeScore = 0;
  let awayScore = 0;
  const records: GoalRecord[] = [];

  for (const goal of goals) {
    const team = scoringTeamId(goal, homeId, awayId);
    if (team === homeId) homeScore += 1;
    else if (team === awayId) awayScore += 1;

    if (team !== ogniwoId) continue;

    const queue = assistQueue.get(pairKey(goal));
    const assist = queue?.shift() ?? null;
    records.push({
      gameId,
      date,
      opponent,
      scorer: goal.slug ?? "",
      assist: assist?.slug || null,
      time: goal.time,
      winning: false,
      ownGoal: goal.forOpposite,
    });
  }

  const reconstructedOgniwo = ogniwoHome ? homeScore : awayScore;
  const reconstructedOpp = ogniwoHome ? awayScore : homeScore;
  const scoresMatch =
    officialOgniwo != null &&
    officialOpp != null &&
    reconstructedOgniwo === officialOgniwo &&
    reconstructedOpp === officialOpp;

  if (scoresMatch && officialOgniwo > officialOpp) {
    const threshold = officialOpp + 1;
    let running = 0;
    for (const record of records) {
      running += 1;
      if (running === threshold) {
        record.winning = true;
        break;
      }
    }
  }

  return records;
}

export function matchMetaFromDetails(game: GameDetails): { date: string; opponent: string } {
  const homeName = game.home_team?.competition_team?.team?.name ?? "";
  const awayName = game.away_team?.competition_team?.team?.name ?? "";
  return {
    date: gameDateFromDetails(game),
    opponent: homeName === TEAM_NAME ? awayName : homeName,
  };
}

export function allGoals(cache: GoalsCache): GoalRecord[] {
  return Object.values(cache.matches).flatMap((match) => match.goals);
}

export function collectOgniwoGameIds(
  players: PlayerProfile[],
): Map<string, { date: string }> {
  const known = new Map<string, { date: string }>();
  for (const player of players) {
    for (const game of player.games) {
      if (!game.gameId) continue;
      if (game.home !== TEAM_NAME && game.away !== TEAM_NAME) continue;
      const prev = known.get(game.gameId);
      if (!prev || game.date > prev.date) known.set(game.gameId, { date: game.date });
    }
  }
  return known;
}
