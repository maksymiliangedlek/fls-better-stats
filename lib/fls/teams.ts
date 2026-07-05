/* eslint-disable @typescript-eslint/no-explicit-any */
import { CURRENT_LEAGUE, CURRENT_SEASON, TEAM_NAME, TEAM_SLUG } from "./config";
import { resolve, type NextDataResponse } from "./resolver";
import type { TeamData, TeamMatch } from "../types/team";

/** Parse the team page: team info + all Game:* entries in the Apollo cache. */
export function parseTeamData(data: NextDataResponse): TeamData {
  const apollo = data.pageProps.__APOLLO_STATE__;

  let name = TEAM_NAME;
  let crest: string | null = null;
  let image: string | null = null;
  // The Apollo cache may hold several partial Team entries; merge fields across them.
  for (const [key, value] of Object.entries(apollo)) {
    if (key.startsWith("Team:") && (value as any).slug === TEAM_SLUG) {
      const t: any = value;
      if (t.name) name = t.name;
      if (t.crest?.url) crest = t.crest.url;
      if (t.image?.url) image = t.image.url;
    }
  }

  const matches: TeamMatch[] = [];
  for (const [key, value] of Object.entries(apollo)) {
    if (!key.startsWith("Game:")) continue;
    const game: any = value;
    const home = resolve(apollo, resolve(apollo, game.home_team?.competition_team)?.team);
    const away = resolve(apollo, resolve(apollo, game.away_team?.competition_team)?.team);
    const pitch = resolve(apollo, game.pitch);
    matches.push({
      date: (game.game_date ?? "?").slice(0, 10),
      result: game.result ?? "?",
      scoreHome: game.score_home ?? null,
      scoreAway: game.score_away ?? null,
      home: home.name ?? "?",
      away: away.name ?? "?",
      pitch: pitch.name ?? "?",
      status: game.status ?? "?",
    });
  }
  matches.sort((a, b) => b.date.localeCompare(a.date));

  return {
    team: {
      name,
      slug: TEAM_SLUG,
      crest,
      image,
      league: CURRENT_LEAGUE,
      season: CURRENT_SEASON,
    },
    matches,
  };
}
