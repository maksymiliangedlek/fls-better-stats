export const BASE_URL = "https://rozgrywki.krakow.liga-fls.pl";

export const TEAM_NAME = "Ogniwo Bielany";
export const TEAM_SLUG = "ogniwo-bielany";
export const CURRENT_LEAGUE = "liga-c";
export const CURRENT_SEASON = "wiosna-2026";

/** Total pages of lista-zawodnikow is ~726; how many to scan per cron run. */
export const ROSTER_PAGES_PER_SYNC = 5;
/** How many player profiles to refresh per cron run. */
export const PLAYERS_PER_SYNC = 4;
/** Data older than this is flagged stale in API responses. */
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
