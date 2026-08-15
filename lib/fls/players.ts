/* eslint-disable @typescript-eslint/no-explicit-any */
import { eventName } from "./events";
import { TEAM_NAME } from "./config";
import { parseGameDateTime } from "./datetime";
import { resolve, type NextDataResponse } from "./resolver";
import type { GameLog, PlayerProfile, PlayerSummary, SeasonStats } from "../types/player";

export interface RawPlayerProfile extends PlayerProfile {}

const ACHIEVEMENT_RE =
  /mvp|sz[oó]st[ck]|kr[oó]l strzel|najlepsz|wyr[oó][zź]n|jedenast|team of|zawodnik sezonu|bramkarz sezonu|mistrz|puchar|medal/i;

function capitalizeAchievement(item: string): string {
  return item.charAt(0).toLocaleUpperCase("pl-PL") + item.slice(1);
}

function parseAchievements(about: unknown): string[] {
  if (typeof about !== "string" || !about.trim()) return [];
  const text = about
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/<\/p>/gi, ", ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,\s]+|[,\s]+$/g, "");
  if (!text) return [];
  return text
    .split(/\s*,\s*/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1 && ACHIEVEMENT_RE.test(item))
    .map(capitalizeAchievement);
}

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
    achievements: parseAchievements(p.about),
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
      return eventName(et.id ?? "?", ev.name ?? et.name);
    });

    const home = resolve(apollo, resolve(apollo, game.home_team?.competition_team)?.team);
    const away = resolve(apollo, resolve(apollo, game.away_team?.competition_team)?.team);
    const round = resolve(apollo, game.round);
    const competition = resolve(apollo, round.competition);
    const league = resolve(apollo, competition.league);
    const season = resolve(apollo, competition.season);
    const pitch = resolve(apollo, game.pitch);
    const { date, time } = parseGameDateTime(game.game_date);

    return {
      date,
      time,
      league: league.slug ?? "?",
      season: season.slug ?? "?",
      result: game.result ?? "?",
      home: home.name ?? "?",
      away: away.name ?? "?",
      pitch: pitch.name ?? "?",
      events,
      gameId: game.id != null ? String(game.id) : undefined,
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
    achievements: profile.summary.achievements ?? [],
    goalsPerGame: perGame(totals.goals, totals.games),
    assistsPerGame: perGame(totals.assists, totals.games),
    goalContributions: totals.goals + totals.assists,
  };

  return { slug: profile.slug, summary, seasons, games };
}
