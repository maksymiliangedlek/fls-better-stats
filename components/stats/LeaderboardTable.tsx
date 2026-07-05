"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { fetchRoster, type SortKey } from "@/lib/client/api";
import type { LeaderboardEntry } from "@/lib/stats/leaderboards";
import type { RosterBoard } from "@/lib/data/queries";
import styles from "./LeaderboardTable.module.css";

type Scope = "all" | "current";

interface Column {
  key: SortKey;
  label: string;
  short: string;
}

const COLUMNS: Column[] = [
  { key: "games", label: "Mecze", short: "M" },
  { key: "goals", label: "Bramki", short: "G" },
  { key: "assists", label: "Asysty", short: "A" },
  { key: "goalContributions", label: "G+A", short: "G+A" },
  { key: "mvp", label: "MVP", short: "MVP" },
  { key: "goalsPerGame", label: "Gole/mecz", short: "G/M" },
];

export function LeaderboardTable({ initial }: { initial: RosterBoard }) {
  const [players, setPlayers] = useState<LeaderboardEntry[]>(initial.players);
  const [scope, setScope] = useState<Scope>(initial.scope);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (scope === initial.scope && sort === initial.sort) {
      setPlayers(initial.players);
      return;
    }
    let cancelled = false;
    setError(null);
    fetchRoster(scope, sort)
      .then((res) => {
        if (!cancelled) startTransition(() => setPlayers(res.data.players));
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [scope, sort, initial]);

  const onSort = (key: SortKey) => setSort(key);

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <div className={styles.tabs} role="tablist" aria-label="Zakres">
          <button
            role="tab"
            aria-selected={scope === "all"}
            className={`${styles.tab} ${scope === "all" ? styles.tabActive : ""}`}
            onClick={() => setScope("all")}
          >
            Wszech czasów
          </button>
          <button
            role="tab"
            aria-selected={scope === "current"}
            className={`${styles.tab} ${scope === "current" ? styles.tabActive : ""}`}
            onClick={() => setScope("current")}
          >
            Bieżący sezon
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.scroll}>
        <table className={`${styles.table} ${isPending ? styles.loading : ""}`}>
          <thead>
            <tr>
              <th className={styles.rankCol}>#</th>
              <th className={styles.nameCol}>Zawodnik</th>
              {COLUMNS.map((c) => (
                <th key={c.key}>
                  <button
                    className={`${styles.sortBtn} ${sort === c.key ? styles.sortActive : ""}`}
                    onClick={() => onSort(c.key)}
                    title={`Sortuj: ${c.label}`}
                  >
                    <span className={styles.colFull}>{c.label}</span>
                    <span className={styles.colShort}>{c.short}</span>
                    {sort === c.key && <span className={styles.caret}>▼</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.slug}>
                <td className={styles.rankCol}>{i + 1}</td>
                <td className={styles.nameCol}>
                  <Link href={`/players/${p.slug}`} className={styles.playerLink}>
                    {p.name}
                  </Link>
                </td>
                <td>{p.games}</td>
                <td className={styles.strong}>{p.goals}</td>
                <td>{p.assists}</td>
                <td>{p.goalContributions}</td>
                <td>{p.mvp}</td>
                <td>{p.goalsPerGame.toFixed(2)}</td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Brak zawodników do wyświetlenia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
