import { TEAM_NAME } from "../fls/config";
import { displayEventName } from "../fls/events";
import { compareSeasons } from "../client/format";
import type { GameLog, PlayerProfile } from "../types/player";
import type {
  CompareRadar,
  CompareResult,
  CompareTotals,
  SeasonOverlap,
  SharedMatch,
} from "../types/compare";
import { buildWinRates } from "./winrate";

function headerOf(p: PlayerProfile) {
  return { slug: p.slug, name: p.summary.name, avatar: p.summary.avatar };
}

function gpa(p: PlayerProfile): number {
  return p.summary.games > 0
    ? Math.round((p.summary.goalContributions / p.summary.games) * 100) / 100
    : 0;
}

function opponentOf(game: GameLog): string {
  return game.home === TEAM_NAME ? game.away : game.home;
}

function matchKey(game: GameLog): string {
  return `${game.date}|${opponentOf(game)}`;
}

function buildTotals(profiles: PlayerProfile[]): CompareTotals {
  return {
    games: profiles.map((p) => p.summary.games),
    goals: profiles.map((p) => p.summary.goals),
    assists: profiles.map((p) => p.summary.assists),
    goalContributions: profiles.map((p) => p.summary.goalContributions),
    mvp: profiles.map((p) => p.summary.mvp),
    yellowCards: profiles.map((p) => p.summary.yellowCards),
    redCards: profiles.map((p) => p.summary.redCards),
    goalsPerGame: profiles.map((p) => p.summary.goalsPerGame),
    assistsPerGame: profiles.map((p) => p.summary.assistsPerGame),
    goalContributionsPerGame: profiles.map(gpa),
  };
}

/** Normalize each axis to 0-100 relative to the highest value among the players. */
function buildRadar(profiles: PlayerProfile[]): CompareRadar {
  const mvpRate = (p: PlayerProfile) =>
    p.summary.games > 0 ? p.summary.mvp / p.summary.games : 0;
  const discipline = (p: PlayerProfile) =>
    p.summary.games > 0
      ? 1 - (p.summary.yellowCards + p.summary.redCards * 2) / p.summary.games
      : 1;

  const rawAxes: { label: string; values: number[] }[] = [
    { label: "Gole/mecz", values: profiles.map((p) => p.summary.goalsPerGame) },
    { label: "Asysty/mecz", values: profiles.map((p) => p.summary.assistsPerGame) },
    {
      label: "G+A/mecz",
      values: profiles.map((p) =>
        p.summary.games > 0 ? p.summary.goalContributions / p.summary.games : 0,
      ),
    },
    { label: "MVP rate", values: profiles.map(mvpRate) },
    { label: "Dyscyplina", values: profiles.map(discipline) },
    { label: "Mecze", values: profiles.map((p) => p.summary.games) },
  ];

  return {
    axes: rawAxes.map((ax) => ax.label),
    values: rawAxes.map((ax) => {
      const max = Math.max(...ax.values, 0.0001);
      return ax.values.map((v) => Math.round((v / max) * 100));
    }),
  };
}

function buildSeasonOverlap(profiles: PlayerProfile[]): SeasonOverlap[] {
  const bySeason = profiles.map((p) => new Map(p.seasons.map((s) => [s.season, s])));
  const overlap: SeasonOverlap[] = [];
  for (const season of profiles[0].seasons) {
    const stats = bySeason.map((map) => map.get(season.season));
    if (stats.every(Boolean)) {
      overlap.push({ season: season.season, stats: stats.filter((s) => s !== undefined) });
    }
  }
  return overlap.sort((x, y) => compareSeasons(x.season, y.season));
}

function buildSharedMatches(profiles: PlayerProfile[]): SharedMatch[] {
  const maps = profiles.slice(1).map((p) => new Map(p.games.map((g) => [matchKey(g), g])));
  const shared: SharedMatch[] = [];
  for (const game of profiles[0].games) {
    const others = maps.map((map) => map.get(matchKey(game)));
    if (!others.every(Boolean)) continue;
    const games = [game, ...others.filter((g) => g !== undefined)];
    shared.push({
      date: game.date,
      opponent: opponentOf(game),
      result: game.result,
      events: games.map((g) => g.events.map(displayEventName)),
    });
  }
  return shared.sort((x, y) => y.date.localeCompare(x.date));
}

export function comparePlayers(
  a: PlayerProfile,
  b: PlayerProfile,
  c?: PlayerProfile,
): CompareResult {
  const profiles = c ? [a, b, c] : [a, b];
  return {
    players: profiles.map(headerOf),
    totals: buildTotals(profiles),
    radar: buildRadar(profiles),
    winRates: profiles.map(buildWinRates),
    seasonOverlap: buildSeasonOverlap(profiles),
    sharedMatches: buildSharedMatches(profiles),
  };
}
