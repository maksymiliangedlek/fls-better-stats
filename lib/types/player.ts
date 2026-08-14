export interface PlayerSummary {
  name: string;
  dateOfBirth: string | null;
  games: number;
  goals: number;
  assists: number;
  mvp: number;
  yellowCards: number;
  redCards: number;
  avatar: string | null;
  goalsPerGame: number;
  assistsPerGame: number;
  goalContributions: number;
  achievements?: string[];
}

export interface SeasonStats {
  season: string;
  team: string;
  games: number;
  goals: number;
  assists: number;
  mvp: number;
  yellowCards: number;
  redCards: number;
}

export interface GameLog {
  date: string;
  time?: string | null;
  league: string;
  season: string;
  result: string;
  home: string;
  away: string;
  pitch: string;
  events: string[];
}

export interface PlayerProfile {
  slug: string;
  summary: PlayerSummary;
  seasons: SeasonStats[];
  games: GameLog[];
}

/** Row from the all-time player list (lista-zawodnikow). */
export interface AllTimePlayerRow {
  slug: string;
  fullName: string;
  teamName: string;
  gamesPlayed: number;
  goalsScored: number;
  assists: number;
  mvp: number;
  yellowCards: number;
  redCards: number;
  avatar: string | null;
}
