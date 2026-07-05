import { TEAM_NAME } from "../fls/config";
import type { TeamMatch } from "../types/team";

export interface TeamRecord {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** W/D/L per match, oldest -> newest, for a form strip. */
  formGuide: ("W" | "D" | "L")[];
}

interface MatchOutcome {
  ogniwoScore: number;
  opponentScore: number;
  result: "W" | "D" | "L";
}

/** Parse a finished match into Ogniwo's perspective, or null if not playable. */
function outcomeFor(match: TeamMatch): MatchOutcome | null {
  const isHome = match.home === TEAM_NAME;
  const isAway = match.away === TEAM_NAME;
  if (!isHome && !isAway) return null;

  let home = match.scoreHome;
  let away = match.scoreAway;
  if (home == null || away == null) {
    const parsed = match.result.split("-").map((s) => Number(s.trim()));
    if (parsed.length === 2 && parsed.every((n) => Number.isFinite(n))) {
      [home, away] = parsed;
    } else {
      return null;
    }
  }

  const ogniwoScore = isHome ? home : away;
  const opponentScore = isHome ? away : home;
  const result = ogniwoScore > opponentScore ? "W" : ogniwoScore < opponentScore ? "L" : "D";
  return { ogniwoScore, opponentScore, result };
}

export function buildTeamRecord(matches: TeamMatch[]): TeamRecord {
  const chronological = [...matches].sort((a, b) => a.date.localeCompare(b.date));
  const record: TeamRecord = {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    formGuide: [],
  };

  for (const match of chronological) {
    const outcome = outcomeFor(match);
    if (!outcome) continue;
    record.played += 1;
    record.goalsFor += outcome.ogniwoScore;
    record.goalsAgainst += outcome.opponentScore;
    record.formGuide.push(outcome.result);
    if (outcome.result === "W") record.wins += 1;
    else if (outcome.result === "D") record.draws += 1;
    else record.losses += 1;
  }

  record.goalDifference = record.goalsFor - record.goalsAgainst;
  record.points = record.wins * 3 + record.draws;
  return record;
}

export interface GoalsTimelinePoint {
  date: string;
  gf: number;
  ga: number;
}

/** Per-match goals for/against in Ogniwo's perspective, oldest -> newest. */
export function buildGoalsTimeline(matches: TeamMatch[]): GoalsTimelinePoint[] {
  const chronological = [...matches].sort((a, b) => a.date.localeCompare(b.date));
  const out: GoalsTimelinePoint[] = [];
  for (const match of chronological) {
    const outcome = outcomeFor(match);
    if (!outcome) continue;
    out.push({ date: match.date, gf: outcome.ogniwoScore, ga: outcome.opponentScore });
  }
  return out;
}
