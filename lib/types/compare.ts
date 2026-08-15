import type { PlayerWinRates } from "../stats/winrate";
import type { SeasonStats } from "./player";

export interface ComparePlayerHeader {
  slug: string;
  name: string;
  avatar: string | null;
}

export interface CompareTotals {
  games: number[];
  goals: number[];
  assists: number[];
  goalContributions: number[];
  mvp: number[];
  yellowCards: number[];
  redCards: number[];
  goalsPerGame: number[];
  assistsPerGame: number[];
  goalContributionsPerGame: number[];
}

export interface CompareRadar {
  axes: string[];
  /** Per axis: one normalized 0–100 value per player. */
  values: number[][];
}

export interface SeasonOverlap {
  season: string;
  stats: SeasonStats[];
}

export interface SharedMatch {
  date: string;
  opponent: string;
  result: string;
  events: string[][];
}

export interface CompareResult {
  players: ComparePlayerHeader[];
  totals: CompareTotals;
  radar: CompareRadar;
  winRates: PlayerWinRates[];
  seasonOverlap: SeasonOverlap[];
  sharedMatches: SharedMatch[];
}
