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
  const ordered = [...players].sort((a, b) => Number(Boolean(b.avatar)) - Number(Boolean(a.avatar)));

  return (
    <div className={styles.grid}>
      {ordered.map((p) => (
        <PlayerProfileCard key={p.slug} player={p} enableTilt={enableTilt} />
      ))}
    </div>
  );
}
