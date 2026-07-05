import { TEAM_NAME } from "../fls/config";
import type { GameLog, PlayerProfile } from "../types/player";
import type {
  CompareRadar,
  CompareResult,
  CompareTotals,
  SeasonOverlap,
  SharedMatch,
} from "../types/compare";

function pair<T>(a: T, b: T): [T, T] {
  return [a, b];
}

function opponentOf(game: GameLog): string {
  return game.home === TEAM_NAME ? game.away : game.home;
}

function buildTotals(a: PlayerProfile, b: PlayerProfile): CompareTotals {
  const sa = a.summary;
  const sb = b.summary;
  return {
    games: pair(sa.games, sb.games),
    goals: pair(sa.goals, sb.goals),
    assists: pair(sa.assists, sb.assists),
    goalContributions: pair(sa.goalContributions, sb.goalContributions),
    mvp: pair(sa.mvp, sb.mvp),
    yellowCards: pair(sa.yellowCards, sb.yellowCards),
    redCards: pair(sa.redCards, sb.redCards),
    goalsPerGame: pair(sa.goalsPerGame, sb.goalsPerGame),
    assistsPerGame: pair(sa.assistsPerGame, sb.assistsPerGame),
    goalContributionsPerGame: pair(
      sa.games > 0 ? Math.round((sa.goalContributions / sa.games) * 100) / 100 : 0,
      sb.games > 0 ? Math.round((sb.goalContributions / sb.games) * 100) / 100 : 0,
    ),
  };
}

/** Normalize each axis to 0-100 relative to the higher of the two values. */
function buildRadar(a: PlayerProfile, b: PlayerProfile): CompareRadar {
  const mvpRate = (p: PlayerProfile) =>
    p.summary.games > 0 ? p.summary.mvp / p.summary.games : 0;
  const discipline = (p: PlayerProfile) =>
    p.summary.games > 0
      ? 1 - (p.summary.yellowCards + p.summary.redCards * 2) / p.summary.games
      : 1;

  const rawAxes: { label: string; a: number; b: number }[] = [
    { label: "Gole/mecz", a: a.summary.goalsPerGame, b: b.summary.goalsPerGame },
    { label: "Asysty/mecz", a: a.summary.assistsPerGame, b: b.summary.assistsPerGame },
    {
      label: "G+A/mecz",
      a: a.summary.games > 0 ? a.summary.goalContributions / a.summary.games : 0,
      b: b.summary.games > 0 ? b.summary.goalContributions / b.summary.games : 0,
    },
    { label: "MVP rate", a: mvpRate(a), b: mvpRate(b) },
    { label: "Dyscyplina", a: discipline(a), b: discipline(b) },
    { label: "Mecze", a: a.summary.games, b: b.summary.games },
  ];

  const axes = rawAxes.map((ax) => ax.label);
  const values: [number, number][] = rawAxes.map((ax) => {
    const max = Math.max(ax.a, ax.b, 0.0001);
    return [Math.round((ax.a / max) * 100), Math.round((ax.b / max) * 100)];
  });

  return { axes, values };
}

function buildSeasonOverlap(a: PlayerProfile, b: PlayerProfile): SeasonOverlap[] {
  const bBySeason = new Map(b.seasons.map((s) => [s.season, s]));
  const overlap: SeasonOverlap[] = [];
  for (const seasonA of a.seasons) {
    const seasonB = bBySeason.get(seasonA.season);
    if (seasonB) overlap.push({ season: seasonA.season, a: seasonA, b: seasonB });
  }
  return overlap.sort((x, y) => y.season.localeCompare(x.season));
}

function buildSharedMatches(a: PlayerProfile, b: PlayerProfile): SharedMatch[] {
  const key = (g: GameLog) => `${g.date}|${opponentOf(g)}`;
  const bByKey = new Map(b.games.map((g) => [key(g), g]));
  const shared: SharedMatch[] = [];
  for (const gameA of a.games) {
    const gameB = bByKey.get(key(gameA));
    if (gameB) {
      shared.push({
        date: gameA.date,
        opponent: opponentOf(gameA),
        result: gameA.result,
        aEvents: gameA.events,
        bEvents: gameB.events,
      });
    }
  }
  return shared.sort((x, y) => y.date.localeCompare(x.date));
}

export function comparePlayers(a: PlayerProfile, b: PlayerProfile): CompareResult {
  return {
    players: pair(
      { slug: a.slug, name: a.summary.name, avatar: a.summary.avatar },
      { slug: b.slug, name: b.summary.name, avatar: b.summary.avatar },
    ),
    totals: buildTotals(a, b),
    radar: buildRadar(a, b),
    seasonOverlap: buildSeasonOverlap(a, b),
    sharedMatches: buildSharedMatches(a, b),
  };
}
