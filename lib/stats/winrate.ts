import { TEAM_NAME } from "../fls/config";
import type { GameLog, PlayerProfile } from "../types/player";

export interface WinRate {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  /** Wins as a share of decided + drawn games, 0-100. */
  winRate: number;
}

export interface PlayerWinRates {
  played: WinRate;
  scored: WinRate;
  assisted: WinRate;
}

function resultFor(game: GameLog): "W" | "D" | "L" | null {
  const isHome = game.home === TEAM_NAME;
  const isAway = game.away === TEAM_NAME;
  if (!isHome && !isAway) return null;

  const parsed = game.result.split("-").map((s) => Number(s.trim()));
  if (parsed.length !== 2 || !parsed.every((n) => Number.isFinite(n))) return null;

  const [home, away] = parsed;
  const own = isHome ? home : away;
  const opponent = isHome ? away : home;
  return own > opponent ? "W" : own < opponent ? "L" : "D";
}

function rateOf(games: GameLog[]): WinRate {
  const rate: WinRate = { games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 };
  for (const game of games) {
    const result = resultFor(game);
    if (!result) continue;
    rate.games += 1;
    if (result === "W") rate.wins += 1;
    else if (result === "D") rate.draws += 1;
    else rate.losses += 1;
  }
  rate.winRate = rate.games > 0 ? Math.round((rate.wins / rate.games) * 1000) / 10 : 0;
  return rate;
}

function hasEvent(game: GameLog, name: string): boolean {
  return game.events.some((e) => e === name);
}

export function buildWinRates(profile: PlayerProfile): PlayerWinRates {
  return {
    played: rateOf(profile.games),
    scored: rateOf(profile.games.filter((g) => hasEvent(g, "Gol"))),
    assisted: rateOf(profile.games.filter((g) => hasEvent(g, "Asysta"))),
  };
}
