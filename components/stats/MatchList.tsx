import { TEAM_NAME } from "@/lib/fls/config";
import type { TeamMatch } from "@/lib/types/team";
import { formatDate } from "@/lib/client/format";
import styles from "./MatchList.module.css";

type Outcome = "W" | "D" | "L" | null;

function outcome(m: TeamMatch): Outcome {
  const isHome = m.home === TEAM_NAME;
  const isAway = m.away === TEAM_NAME;
  if (!isHome && !isAway) return null;
  let h = m.scoreHome;
  let a = m.scoreAway;
  if (h == null || a == null) {
    const parts = m.result.split("-").map((s) => Number(s.trim()));
    if (parts.length === 2 && parts.every(Number.isFinite)) [h, a] = parts;
    else return null;
  }
  const own = isHome ? h : a;
  const opp = isHome ? a : h;
  return own > opp ? "W" : own < opp ? "L" : "D";
}

export function MatchList({ matches }: { matches: TeamMatch[] }) {
  return (
    <ul className={styles.list}>
      {matches.map((m, i) => {
        const res = outcome(m);
        return (
          <li key={`${m.date}-${m.time ?? ""}-${i}`} className={styles.row}>
            <span className={styles.when}>
              <span className={styles.date}>{formatDate(m.date)}</span>
              {m.time && <span className={styles.time}>{m.time}</span>}
            </span>
            <span className={styles.teams}>
              <span className={m.home === TEAM_NAME ? styles.own : ""}>{m.home}</span>
              <span className={styles.score}>{m.result}</span>
              <span className={m.away === TEAM_NAME ? styles.own : ""}>{m.away}</span>
            </span>
            {res && <span className={`${styles.pill} ${styles[res]}`}>{res}</span>}
          </li>
        );
      })}
    </ul>
  );
}
