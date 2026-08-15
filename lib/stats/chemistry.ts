import type { GoalRecord } from "./goals";

export interface PlayerRef {
  slug: string;
  name: string;
  avatar: string | null;
}

export type PlayerLookup = Record<string, PlayerRef>;

export interface Buddy extends PlayerRef {
  count: number;
}

export interface PlayerBuddies {
  to: Buddy[];
  from: Buddy[];
}

export interface Duo {
  a: PlayerRef;
  b: PlayerRef;
  goals: number;
}

const BUDDY_TOP = 3;

function isOgniwoGoal(goal: GoalRecord, lookup: PlayerLookup): boolean {
  return !goal.ownGoal && Boolean(goal.scorer) && goal.scorer in lookup;
}

export function buildWinningGoals(goals: GoalRecord[], slug: string): number {
  return goals.reduce(
    (n, goal) => n + (goal.winning && !goal.ownGoal && goal.scorer === slug ? 1 : 0),
    0,
  );
}

function topCounts(
  counts: Map<string, number>,
  lookup: PlayerLookup,
  limit: number,
): Buddy[] {
  return [...counts.entries()]
    .filter(([slug]) => slug in lookup)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([slug, count]) => ({ ...lookup[slug], count }));
}

/** Top partners this player assisted, and who assisted them. */
export function buildBuddies(
  goals: GoalRecord[],
  slug: string,
  lookup: PlayerLookup,
  limit = BUDDY_TOP,
): PlayerBuddies {
  const to = new Map<string, number>();
  const from = new Map<string, number>();

  for (const goal of goals) {
    if (goal.ownGoal || !goal.assist) continue;
    if (goal.assist === slug && goal.scorer && goal.scorer !== slug) {
      to.set(goal.scorer, (to.get(goal.scorer) ?? 0) + 1);
    }
    if (goal.scorer === slug && goal.assist !== slug) {
      from.set(goal.assist, (from.get(goal.assist) ?? 0) + 1);
    }
  }

  return { to: topCounts(to, lookup, limit), from: topCounts(from, lookup, limit) };
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Club ranking of Ogniwo pairs by linked goal+assist combinations. */
export function buildDuos(goals: GoalRecord[], lookup: PlayerLookup): Duo[] {
  const counts = new Map<string, number>();

  for (const goal of goals) {
    if (!isOgniwoGoal(goal, lookup) || !goal.assist) continue;
    if (!(goal.assist in lookup)) continue;
    if (goal.assist === goal.scorer) continue;
    const key = pairKey(goal.scorer, goal.assist);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => {
      const [slugA, slugB] = key.split("|");
      const a = lookup[slugA];
      const b = lookup[slugB];
      return { a, b, goals: count };
    })
    .filter((duo): duo is Duo => Boolean(duo.a && duo.b))
    .sort((x, y) => y.goals - x.goals || x.a.name.localeCompare(y.a.name, "pl"));
}

export function lookupFromPlayers(
  players: { slug: string; summary: { name: string; avatar: string | null } }[],
): PlayerLookup {
  const lookup: PlayerLookup = {};
  for (const player of players) {
    lookup[player.slug] = {
      slug: player.slug,
      name: player.summary.name,
      avatar: player.summary.avatar,
    };
  }
  return lookup;
}
