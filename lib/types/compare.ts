import type { SeasonStats } from "./player";

export interface ComparePlayerHeader {
  slug: string;
  name: string;
  avatar: string | null;
}

export interface CompareTotals {
  games: [number, number];
  goals: [number, number];
  assists: [number, number];
  goalContributions: [number, number];
  mvp: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  goalsPerGame: [number, number];
  assistsPerGame: [number, number];
  goalContributionsPerGame: [number, number];
}

export interface CompareRadar {
  axes: string[];
  /** Per axis: [playerA, playerB], normalized 0-100. */
  values: [number, number][];
}

export interface SeasonOverlap {
  season: string;
  a: SeasonStats;
  b: SeasonStats;
}

export interface SharedMatch {
  date: string;
  opponent: string;
  result: string;
  aEvents: string[];
  bEvents: string[];
}

export interface CompareResult {
  players: [ComparePlayerHeader, ComparePlayerHeader];
  totals: CompareTotals;
  radar: CompareRadar;
  seasonOverlap: SeasonOverlap[];
  sharedMatches: SharedMatch[];
}
