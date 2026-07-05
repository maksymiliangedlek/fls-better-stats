"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { PlayerPicker } from "./PlayerPicker";
import { ChartCard } from "../charts/ChartCard";
import { fetchCompare } from "@/lib/client/api";
import { formatDate } from "@/lib/client/format";
import type { LeaderboardEntry } from "@/lib/stats/leaderboards";
import type { CompareResult } from "@/lib/types/compare";
import styles from "./CompareView.module.css";

const CompareRadar = dynamic(() => import("../charts/CompareRadar").then((m) => m.CompareRadar), {
  ssr: false,
  loading: () => <div className={styles.chartLoading}>Ładowanie…</div>,
});
const CompareBars = dynamic(() => import("../charts/CompareBars").then((m) => m.CompareBars), {
  ssr: false,
  loading: () => <div className={styles.chartLoading}>Ładowanie…</div>,
});

export function CompareView({ roster }: { roster: LeaderboardEntry[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [a, setA] = useState<string | null>(searchParams.get("a"));
  const [b, setB] = useState<string | null>(searchParams.get("b"));
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep URL in sync (shareable comparisons).
  useEffect(() => {
    const qs = new URLSearchParams();
    if (a) qs.set("a", a);
    if (b) qs.set("b", b);
    const suffix = qs.toString();
    router.replace(suffix ? `/compare?${suffix}` : "/compare", { scroll: false });
  }, [a, b, router]);

  useEffect(() => {
    if (!a || !b || a === b) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCompare(a, b)
      .then((res) => {
        if (!cancelled) setResult(res.data);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [a, b]);

  const swap = useCallback(() => {
    setA(b);
    setB(a);
  }, [a, b]);

  const nameA = result?.players[0].name ?? "Zawodnik A";
  const nameB = result?.players[1].name ?? "Zawodnik B";

  return (
    <div>
      <div className={styles.pickers}>
        <PlayerPicker
          players={roster}
          value={a}
          onChange={setA}
          label="Zawodnik A"
          accent="gold"
          excludeSlug={b}
        />
        <button type="button" className={styles.swap} onClick={swap} aria-label="Zamień">
          ⇄
        </button>
        <PlayerPicker
          players={roster}
          value={b}
          onChange={setB}
          label="Zawodnik B"
          accent="navy"
          excludeSlug={a}
        />
      </div>

      {a && b && a === b && <p className={styles.hint}>Wybierz dwóch różnych zawodników.</p>}
      {(!a || !b) && <p className={styles.hint}>Wybierz dwóch zawodników, aby zobaczyć porównanie.</p>}
      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.hint}>Ładowanie porównania…</p>}

      {result && (
        <>
          <div className={styles.chartGrid}>
            <ChartCard title="Profil" subtitle="znormalizowane 0–100">
              <CompareRadar radar={result.radar} nameA={nameA} nameB={nameB} />
            </ChartCard>
            <ChartCard title="Statystyki ogółem">
              <CompareBars totals={result.totals} nameA={nameA} nameB={nameB} />
            </ChartCard>
          </div>

          <TotalsTable result={result} nameA={nameA} nameB={nameB} />

          {result.seasonOverlap.length > 0 && (
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>Wspólne sezony</h3>
              <div className={styles.scroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.left}>Sezon</th>
                      <th>{nameA} (G/A/M)</th>
                      <th>{nameB} (G/A/M)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.seasonOverlap.map((o) => (
                      <tr key={o.season}>
                        <td className={styles.left}>{o.season}</td>
                        <td>
                          {o.a.goals}/{o.a.assists}/{o.a.games}
                        </td>
                        <td>
                          {o.b.goals}/{o.b.assists}/{o.b.games}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.sharedMatches.length > 0 && (
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>Wspólne mecze ({result.sharedMatches.length})</h3>
              <div className={styles.scroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.left}>Data</th>
                      <th className={styles.left}>Przeciwnik</th>
                      <th>Wynik</th>
                      <th>{nameA}</th>
                      <th>{nameB}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.sharedMatches.map((m, i) => (
                      <tr key={`${m.date}-${i}`}>
                        <td className={styles.left}>{formatDate(m.date)}</td>
                        <td className={styles.left}>{m.opponent}</td>
                        <td>{m.result}</td>
                        <td>{m.aEvents.join(", ") || "—"}</td>
                        <td>{m.bEvents.join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TotalsTable({
  result,
  nameA,
  nameB,
}: {
  result: CompareResult;
  nameA: string;
  nameB: string;
}) {
  const rows: { label: string; a: number; b: number; better: "high" }[] = [
    { label: "Mecze", a: result.totals.games[0], b: result.totals.games[1], better: "high" },
    { label: "Bramki", a: result.totals.goals[0], b: result.totals.goals[1], better: "high" },
    { label: "Asysty", a: result.totals.assists[0], b: result.totals.assists[1], better: "high" },
    {
      label: "G+A",
      a: result.totals.goalContributions[0],
      b: result.totals.goalContributions[1],
      better: "high",
    },
    { label: "MVP", a: result.totals.mvp[0], b: result.totals.mvp[1], better: "high" },
    {
      label: "Gole/mecz",
      a: result.totals.goalsPerGame[0],
      b: result.totals.goalsPerGame[1],
      better: "high",
    },
    {
      label: "G+A/mecz",
      a: result.totals.goalContributionsPerGame[0],
      b: result.totals.goalContributionsPerGame[1],
      better: "high",
    },
  ];

  return (
    <div className={styles.block}>
      <h3 className={styles.blockTitle}>Bezpośrednie porównanie</h3>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.left} ${styles.gold}`}>{nameA}</th>
              <th>Statystyka</th>
              <th className={`${styles.right} ${styles.navy}`}>{nameB}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const aWins = r.a > r.b;
              const bWins = r.b > r.a;
              return (
                <tr key={r.label}>
                  <td className={`${styles.left} ${aWins ? styles.win : ""}`}>{r.a}</td>
                  <td className={styles.metric}>{r.label}</td>
                  <td className={`${styles.right} ${bWins ? styles.win : ""}`}>{r.b}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
