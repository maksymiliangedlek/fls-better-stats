import { buildMetaEnvelope, getAllPlayers, getTeamData } from "@/lib/cache/read";
import { buildTeamRecord } from "@/lib/stats/aggregates";
import { buildLeaderboard } from "@/lib/stats/leaderboards";
import { ok, serverError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [team, players, meta] = await Promise.all([
      getTeamData(),
      getAllPlayers(),
      buildMetaEnvelope(),
    ]);

    const record = team ? buildTeamRecord(team.matches) : null;
    const topScorers = buildLeaderboard(players, "goals").slice(0, 5);

    return ok(
      {
        team: team?.team ?? null,
        record,
        rosterSize: players.length,
        topScorers,
        recentMatches: team?.matches.slice(0, 5) ?? [],
      },
      meta,
    );
  } catch (err) {
    return serverError((err as Error).message);
  }
}
