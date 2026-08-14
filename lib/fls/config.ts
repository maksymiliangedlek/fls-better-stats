export const BASE_URL = "https://rozgrywki.krakow.liga-fls.pl";

export const TEAM_NAME = "Ogniwo Bielany";
export const TEAM_SLUG = "ogniwo-bielany";
/** Seed + preferred current competition (Liga B, jesień 2026). */
export const CURRENT_LEAGUE = "liga-b";
export const CURRENT_SEASON = "jesien-2026";

export const LEAGUES_TO_PROBE = ["liga-a", "liga-b", "liga-c", "liga-d"] as const;
export const SEASON_PREFIXES = ["wiosna", "jesien"] as const;

/** Total pages of lista-zawodnikow is ~726; how many to scan per cron run. */
export const ROSTER_PAGES_PER_SYNC = 5;
/** Daily cron refreshes the whole roster; cap is a safety valve. */
export const PLAYERS_PER_SYNC = 50;
/** Skip a live FLS team fetch when the cached team page is newer than this. */
export const TEAM_LIVE_MAX_AGE_MS = 60 * 1000;
/** Timeout for on-demand team-page fetches so the homepage does not wait 55s. */
export const LIVE_TEAM_TIMEOUT_MS = 12_000;
/** Data older than this is flagged stale in API responses. */
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export interface Competition {
  league: string;
  season: string;
}

export function competitionKey(c: Competition): string {
  return `${c.league}/${c.season}`;
}

/** Seed + known combos + nearby seasons/leagues, so a new FLS season is picked up without a code change. */
export function competitionsToProbe(known: Competition[] = []): Competition[] {
  const year = new Date().getFullYear();
  const out: Competition[] = [
    { league: CURRENT_LEAGUE, season: CURRENT_SEASON },
    ...known,
  ];
  for (const y of [year - 1, year, year + 1]) {
    for (const prefix of SEASON_PREFIXES) {
      for (const league of LEAGUES_TO_PROBE) {
        out.push({ league, season: `${prefix}-${y}` });
      }
    }
  }
  const seen = new Set<string>();
  return out.filter((c) => {
    const key = competitionKey(c);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
