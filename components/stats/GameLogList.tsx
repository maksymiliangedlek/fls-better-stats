import { TEAM_NAME } from "@/lib/fls/config";
import type { GameLog } from "@/lib/types/player";
import { formatDate } from "@/lib/client/format";
import styles from "./GameLogList.module.css";

function eventClass(ev: string): string {
  if (ev === "Gol") return styles.goal;
  if (ev === "Asysta") return styles.assist;
  if (ev.toLowerCase().includes("czerw")) return styles.red;
  if (ev.toLowerCase().includes("żółt") || ev.toLowerCase().includes("zolt")) return styles.yellow;
  if (ev.toLowerCase().includes("mvp")) return styles.mvp;
  return styles.other;
}

function opponentOf(g: GameLog): string {
  return g.home === TEAM_NAME ? g.away : g.home;
}

export function GameLogList({ games }: { games: GameLog[] }) {
  const sorted = [...games].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ul className={styles.list}>
      {sorted.map((g, i) => (
        <li key={`${g.date}-${i}`} className={styles.row}>
          <span className={styles.date}>{formatDate(g.date)}</span>
          <span className={styles.match}>
            <span className={styles.opp}>
              {g.home === TEAM_NAME ? "vs" : "@"} {opponentOf(g)}
            </span>
            <span className={styles.result}>{g.result}</span>
          </span>
          <span className={styles.events}>
            {g.events.length === 0 ? (
              <span className={styles.none}>—</span>
            ) : (
              g.events.map((ev, j) => (
                <span key={j} className={`${styles.badge} ${eventClass(ev)}`}>
                  {ev}
                </span>
              ))
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
