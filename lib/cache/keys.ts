export const KEY_META = "fls:meta";
export const KEY_ROSTER = "fls:roster";
export const KEY_TEAM = "fls:team";
export const KEY_GOALS = "fls:goals";

export function playerKey(slug: string): string {
  return `fls:player:${slug}`;
}

export interface StoredCombo {
  league: string;
  season: string;
}

export interface SyncMeta {
  buildId: string | null;
  /** True once the Ogniwo roster has been discovered at least once. */
  discovered: boolean;
  /** (league, season) competitions Ogniwo played in. */
  combos: StoredCombo[];
  /** Next index into the roster array to refresh player profiles from. */
  playerSyncIndex: number;
  lastSyncAt: number | null;
  /** When the current-season team page was last fetched from FLS. */
  lastTeamSyncAt: number | null;
  /** When the roster was last (re)discovered. */
  lastDiscoveryAt: number | null;
}

export const INITIAL_META: SyncMeta = {
  buildId: null,
  discovered: false,
  combos: [],
  playerSyncIndex: 0,
  lastSyncAt: null,
  lastTeamSyncAt: null,
  lastDiscoveryAt: null,
};
