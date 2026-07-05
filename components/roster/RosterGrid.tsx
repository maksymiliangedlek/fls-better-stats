import { PlayerProfileCard } from "../cards/PlayerProfileCard";
import type { LeaderboardEntry } from "@/lib/stats/leaderboards";
import styles from "./RosterGrid.module.css";

export function RosterGrid({
  players,
  enableTilt = true,
}: {
  players: LeaderboardEntry[];
  enableTilt?: boolean;
}) {
  return (
    <div className={styles.grid}>
      {players.map((p) => (
        <PlayerProfileCard key={p.slug} player={p} enableTilt={enableTilt} />
      ))}
    </div>
  );
}
