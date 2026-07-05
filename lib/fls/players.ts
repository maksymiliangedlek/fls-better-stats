/* eslint-disable @typescript-eslint/no-explicit-any */
import { eventName } from "./events";
import { TEAM_NAME } from "./config";
import { resolve, type NextDataResponse } from "./resolver";
import type { GameLog, PlayerProfile, PlayerSummary, SeasonStats } from "../types/player";

export interface RawPlayerProfile extends PlayerProfile {}

function perGame(value: number, games: number): number {
  return games > 0 ? Math.round((value / games) * 100) / 100 : 0;
}

/** Port of parse_player() in main.py — parses the full (unfiltered) player profile. */
export function parsePlayer(data: NextDataResponse): RawPlayerProfile {
  const apollo = data.pageProps.__APOLLO_STATE__;

  const playerKey = Object.keys(apollo).find((k) => k.startsWith("Player:"));
  if (!playerKey) throw new Error("No Player entry in Apollo state");
  const p: any = apollo[playerKey];

  const summary: PlayerSummary = {
    name: `${p.first_name} ${p.last_name}`,
    dateOfBirth: p.date_of_birth ?? null,
    games: p.gamesPlayed ?? 0,
    goals: p.goalsScored ?? 0,
    assists: p.assists ?? 0,
    mvp: p.mvp ?? 0,
    yellowCards: p.yellowCards ?? 0,
    redCards: p.redCards ?? 0,
    avatar: p.avatar?.url ?? null,
    goalsPerGame: perGame(p.goalsScored ?? 0, p.gamesPlayed ?? 0),
    assistsPerGame: perGame(p.assists ?? 0, p.gamesPlayed ?? 0),
    goalContributions: (p.goalsScored ?? 0) + (p.assists ?? 0),
  };

  const seasons: SeasonStats[] = (p.all_competition_players ?? []).map((cpRef: any) => {
    const cp = resolve(apollo, cpRef);
    const comp = resolve(apollo, cp.competition);
    return {
      season: comp.name ?? "?",
      team: cp.teamName ?? "?",
      games: cp.gamesPlayed ?? 0,
      goals: cp.goalsScored ?? 0,
      assists: cp.assists ?? 0,
      mvp: cp.mvp ?? 0,
      yellowCards: cp.yellowCards ?? 0,
      redCards: cp.redCards ?? 0,
    };
  });

  const games: GameLog[] = (p.all_player_games ?? []).map((gp: any) => {
    const game = resolve(apollo, gp.game);
    const events: string[] = (gp.events ?? []).map((eRef: any) => {
      const ev = resolve(apollo, eRef);
      const et = resolve(apollo, ev.event_type);
      return eventName(et.id ?? "?");
    });

    const home = resolve(apollo, resolve(apollo, game.home_team?.competition_team)?.team);
    const away = resolve(apollo, resolve(apollo, game.away_team?.competition_team)?.team);
    const round = resolve(apollo, game.round);
    const competition = resolve(apollo, round.competition);
    const league = resolve(apollo, competition.league);
    const season = resolve(apollo, competition.season);
    const pitch = resolve(apollo, game.pitch);

    return {
      date: (game.game_date ?? "?").slice(0, 10),
      league: league.slug ?? "?",
      season: season.slug ?? "?",
      result: game.result ?? "?",
      home: home.name ?? "?",
      away: away.name ?? "?",
      pitch: pitch.name ?? "?",
      events,
    };
  });

  games.sort((a, b) => b.date.localeCompare(a.date));

  const slugFromData = p.slug ?? playerKey.slice("Player:".length);
  return { slug: slugFromData, summary, seasons, games };
}

/**
 * Restrict a profile to Ogniwo Bielany: keep only Ogniwo seasons and games
 * where Ogniwo played, and recompute career totals from the filtered rows.
 */
export function filterOgniwo(profile: RawPlayerProfile): PlayerProfile {
  const seasons = profile.seasons.filter((s) => s.team === TEAM_NAME);
  const games = profile.games.filter((g) => g.home === TEAM_NAME || g.away === TEAM_NAME);

  const totals = seasons.reduce(
    (acc, s) => {
      acc.games += s.games;
      acc.goals += s.goals;
      acc.assists += s.assists;
      acc.mvp += s.mvp;
      acc.yellowCards += s.yellowCards;
      acc.redCards += s.redCards;
      return acc;
    },
    { games: 0, goals: 0, assists: 0, mvp: 0, yellowCards: 0, redCards: 0 },
  );

  const summary: PlayerSummary = {
    ...profile.summary,
    ...totals,
    goalsPerGame: perGame(totals.goals, totals.games),
    assistsPerGame: perGame(totals.assists, totals.games),
    goalContributions: totals.goals + totals.assists,
  };

  return { slug: profile.slug, summary, seasons, games };
}
