export interface TeamMatch {
  date: string;
  result: string;
  scoreHome: number | null;
  scoreAway: number | null;
  home: string;
  away: string;
  pitch: string;
  status: string;
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
