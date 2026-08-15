import { FLS_API_URL, FLS_DOMAIN, GAME_EVENTS_BATCH } from "./config";
import { parseGameDateTime } from "./datetime";

const FETCH_TIMEOUT_MS = 55_000;

export interface GameDetailsEvent {
  id: string;
  time: number | null;
  in_additional_time: boolean | null;
  for_opposite_team: boolean | null;
  event_type: { id: string; name: string | null } | null;
  game_player: {
    game_team_id: string | null;
    competition_player: {
      player: { slug: string | null } | null;
    } | null;
  } | null;
}

export interface GameDetails {
  id: string;
  result: string | null;
  score_home: number | null;
  score_away: number | null;
  game_date: string | null;
  home_team: GameDetailsTeam | null;
  away_team: GameDetailsTeam | null;
  events: GameDetailsEvent[] | null;
}

interface GameDetailsTeam {
  id: string | null;
  competition_team: { team: { name: string | null } | null } | null;
}

const GAME_DETAILS_FIELDS = `{
  id
  result
  score_home
  score_away
  game_date
  home_team { id competition_team { team { name } } }
  away_team { id competition_team { team { name } } }
  events {
    id
    time
    in_additional_time
    for_opposite_team
    event_type { id name }
    game_player {
      game_team_id
      competition_player { player { slug } }
    }
  }
}`;

function gqlId(id: string): string {
  return /^\d+$/.test(id) ? id : JSON.stringify(id);
}

async function graphql<T>(query: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<T> {
  const res = await fetch(FLS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Language": "pl",
      Origin: `https://${FLS_DOMAIN}`,
    },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`FLS GraphQL failed (${res.status})`);
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!body.data) {
    const message = body.errors?.map((e) => e.message).join("; ") || "empty GraphQL response";
    throw new Error(`FLS GraphQL: ${message}`);
  }
  return body.data;
}

/** Fetch full timelines for up to GAME_EVENTS_BATCH matches in one request. */
export async function fetchGameDetailsBatch(
  ids: string[],
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<(GameDetails | null)[]> {
  if (ids.length === 0) return [];
  if (ids.length > GAME_EVENTS_BATCH) {
    throw new Error(`fetchGameDetailsBatch accepts at most ${GAME_EVENTS_BATCH} ids`);
  }

  const aliases = ids
    .map((id, i) => `g${i}: gameDetails(id: ${gqlId(id)}, domain: "${FLS_DOMAIN}") ${GAME_DETAILS_FIELDS}`)
    .join("\n");
  const data = await graphql<Record<string, GameDetails | null>>(`query { ${aliases} }`, timeoutMs);
  return ids.map((_, i) => data[`g${i}`] ?? null);
}

export function gameDateFromDetails(game: GameDetails): string {
  return parseGameDateTime(game.game_date).date;
}
