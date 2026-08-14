import { TEAM_NAME } from "../fls/config";
import type { PlayerProfile } from "../types/player";
import type { TeamMatch } from "../types/team";

function matchKey(m: Pick<TeamMatch, "date" | "home" | "away" | "season">): string {
  return `${m.date}|${m.home}|${m.away}|${m.season ?? ""}`;
}

function parseScore(result: string): [number | null, number | null] {
  const parts = result.split("-").map((s) => Number(s.trim()));
  if (parts.length === 2 && parts.every(Number.isFinite)) return [parts[0], parts[1]];
  return [null, null];
}

/** Unique Ogniwo matches reconstructed from cached player game logs. */
export function teamMatchesFromPlayers(players: PlayerProfile[]): TeamMatch[] {
  const byKey = new Map<string, TeamMatch>();
  for (const player of players) {
    for (const game of player.games) {
      if (game.home !== TEAM_NAME && game.away !== TEAM_NAME) continue;
      const key = matchKey(game);
      if (byKey.has(key)) continue;
      const [scoreHome, scoreAway] = parseScore(game.result);
      byKey.set(key, {
        date: game.date,
        time: game.time ?? null,
        result: game.result,
        scoreHome,
        scoreAway,
        home: game.home,
        away: game.away,
        pitch: game.pitch,
        status: "played",
        league: game.league,
        season: game.season,
      });
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? ""),
  );
}

/** Historical matches plus the live current-season page; live wins on duplicates. */
export function mergeTeamMatches(live: TeamMatch[], historical: TeamMatch[]): TeamMatch[] {
  const byKey = new Map<string, TeamMatch>();
  for (const match of historical) byKey.set(matchKey(match), match);
  for (const match of live) {
    const prev = byKey.get(matchKey(match));
    byKey.set(matchKey(match), prev ? { ...prev, ...match, time: match.time ?? prev.time } : match);
  }
  return Array.from(byKey.values()).sort(
    (a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? ""),
  );
}

export interface SeasonMatchGroup {
  season: string;
  matches: TeamMatch[];
}

export function groupMatchesBySeason(matches: TeamMatch[]): SeasonMatchGroup[] {
  const groups = new Map<string, TeamMatch[]>();
  for (const match of matches) {
    const season = match.season && match.season !== "?" ? match.season : "inne";
    const list = groups.get(season);
    if (list) list.push(match);
    else groups.set(season, [match]);
  }
  return Array.from(groups.entries())
    .map(([season, list]) => ({
      season,
      matches: [...list].sort(
        (a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? ""),
      ),
    }))
    .sort((a, b) => (b.matches[0]?.date ?? "").localeCompare(a.matches[0]?.date ?? ""));
}
