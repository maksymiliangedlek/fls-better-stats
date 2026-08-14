import { TEAM_NAME } from "../fls/config";
import { buildWinRates, type PlayerWinRates } from "./winrate";
import type { GameLog, PlayerProfile } from "../types/player";

export interface FormPoint {
  date: string;
  opponent: string;
  goals: number;
  assists: number;
  ga: number;
  isHome: boolean;
  result: string;
}

export interface RollingPoint {
  date: string;
  /** Average G+A over the trailing window ending at this match. */
  avgGa: number;
}

export interface CumulativePoint {
  date: string;
  goals: number;
  assists: number;
}

export interface SeasonSplit {
  season: string;
  goals: number;
  assists: number;
  games: number;
}

export interface PlayerStats {
  form: FormPoint[];
  rollingForm5: RollingPoint[];
  rollingForm10: RollingPoint[];
  cumulativeGoals: CumulativePoint[];
  seasonSplits: SeasonSplit[];
  winRates: PlayerWinRates;
}

function countEvent(events: string[], name: string): number {
  return events.filter((e) => e === name).length;
}

function opponentOf(game: GameLog): string {
  return game.home === TEAM_NAME ? game.away : game.home;
}

/** Build the per-match form series (oldest -> newest for charting). */
export function buildForm(profile: PlayerProfile): FormPoint[] {
  const chronological = [...profile.games].sort((a, b) => a.date.localeCompare(b.date));
  return chronological.map((g) => {
    const goals = countEvent(g.events, "Gol");
    const assists = countEvent(g.events, "Asysta");
    return {
      date: g.date,
      opponent: opponentOf(g),
      goals,
      assists,
      ga: goals + assists,
      isHome: g.home === TEAM_NAME,
      result: g.result,
    };
  });
}

function rolling(form: FormPoint[], window: number): RollingPoint[] {
  return form.map((point, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = form.slice(start, i + 1);
    const sum = slice.reduce((acc, p) => acc + p.ga, 0);
    return { date: point.date, avgGa: Math.round((sum / slice.length) * 100) / 100 };
  });
}

export function buildCumulativeGoals(form: FormPoint[]): CumulativePoint[] {
  let goals = 0;
  let assists = 0;
  return form.map((p) => {
    goals += p.goals;
    assists += p.assists;
    return { date: p.date, goals, assists };
  });
}

export function buildSeasonSplits(profile: PlayerProfile): SeasonSplit[] {
  return profile.seasons.map((s) => ({
    season: s.season,
    goals: s.goals,
    assists: s.assists,
    games: s.games,
  }));
}

export function buildPlayerStats(profile: PlayerProfile): PlayerStats {
  const form = buildForm(profile);
  return {
    form,
    rollingForm5: rolling(form, 5),
    rollingForm10: rolling(form, 10),
    cumulativeGoals: buildCumulativeGoals(form),
    seasonSplits: buildSeasonSplits(profile),
    winRates: buildWinRates(profile),
  };
}
