export interface TeamMatch {
  date: string;
  /** Kickoff HH:mm in Europe/Warsaw, when FLS provided a time. */
  time?: string | null;
  result: string;
  scoreHome: number | null;
  scoreAway: number | null;
  home: string;
  away: string;
  pitch: string;
  status: string;
  league?: string;
  season?: string;
}

export interface TeamInfo {
  name: string;
  slug: string;
  crest: string | null;
  image: string | null;
  league: string;
  season: string;
}

export interface TeamData {
  team: TeamInfo;
  matches: TeamMatch[];
}
