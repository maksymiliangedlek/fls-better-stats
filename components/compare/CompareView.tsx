"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { PlayerPicker } from "./PlayerPicker";
import { ChartCard } from "../charts/ChartCard";
import { fetchCompare } from "@/lib/client/api";
import { formatDate } from "@/lib/client/format";
import type { LeaderboardEntry } from "@/lib/stats/leaderboards";
import type { CompareResult, CompareTotals } from "@/lib/types/compare";
import type { PlayerWinRates, WinRate } from "@/lib/stats/winrate";
import styles from "./CompareView.module.css";

const CompareRadar = dynamic(() => import("../charts/CompareRadar").then((m) => m.CompareRadar), {
  ssr: false,
  loading: () => <div className={styles.chartLoading}>Ładowanie…</div>,
});
const CompareBars = dynamic(() => import("../charts/CompareBars").then((m) => m.CompareBars), {
  ssr: false,
  loading: () => <div className={styles.chartLoading}>Ładowanie…</div>,
});

const NAME_CLASS = [styles.gold, styles.navy, styles.wine] as const;
const FALLBACK_NAMES = ["Zawodnik A", "Zawodnik B", "Zawodnik C"];

export function CompareView({ roster }: { roster: LeaderboardEntry[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [a, setA] = useState<string | null>(searchParams.get("a"));
  const [b, setB] = useState<string | null>(searchParams.get("b"));
  const [c, setC] = useState<string | null>(searchParams.get("c"));
  const [showThird, setShowThird] = useState(() => Boolean(searchParams.get("c")));
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (a) qs.set("a", a);
    if (b) qs.set("b", b);
    if (c) qs.set("c", c);
    const suffix = qs.toString();
    router.replace(suffix ? `/compare?${suffix}` : "/compare", { scroll: false });
  }, [a, b, c, router]);

  useEffect(() => {
    if (!a || !b || a === b) {
      setResult(null);
      return;
    }
    if (c && (c === a || c === b)) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCompare(a, b, c)
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
  }, [a, b, c]);

  const swap = useCallback(() => {
    setA(b);
    setB(a);
  }, [a, b]);

  const changeA = (slug: string) => {
    setA(slug);
    if (slug === c) setC(null);
  };
  const changeB = (slug: string) => {
    setB(slug);
    if (slug === c) setC(null);
  };
  const removeThird = () => {
    setC(null);
    setShowThird(false);
  };

  const names = result?.players.map((p) => p.name) ?? FALLBACK_NAMES.slice(0, c ? 3 : 2);
  const pairReady = Boolean(a && b && a !== b);
  const thirdConflict = Boolean(c && (c === a || c === b));

  return (
    <div>
      <div className={styles.pickers}>
        <PlayerPicker
          players={roster}
          value={a}
          onChange={changeA}
          label="Zawodnik A"
          accent="gold"
          excludeSlugs={[b, c].filter((s): s is string => Boolean(s))}
        />
        <button type="button" className={styles.swap} onClick={swap} aria-label="Zamień">
          ⇄
        </button>
        <PlayerPicker
          players={roster}
          value={b}
          onChange={changeB}
          label="Zawodnik B"
          accent="navy"
          excludeSlugs={[a, c].filter((s): s is string => Boolean(s))}
        />
        {showThird && (
          <div className={styles.thirdSlot}>
            <PlayerPicker
              players={roster}
              value={c}
              onChange={setC}
              label="Zawodnik C"
              accent="wine"
              excludeSlugs={[a, b].filter((s): s is string => Boolean(s))}
            />
            <button
              type="button"
              className={styles.removeThird}
              onClick={removeThird}
              aria-label="Usuń trzeciego zawodnika"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {pairReady && !showThird && (
        <button type="button" className={styles.addThird} onClick={() => setShowThird(true)}>
          Dodaj kolejnego zawodnika do porównania
        </button>
      )}

      {a && b && a === b && <p className={styles.hint}>Wybierz dwóch różnych zawodników.</p>}
      {thirdConflict && <p className={styles.hint}>Wybierz trzech różnych zawodników.</p>}
      {(!a || !b) && (
        <p className={styles.hint}>Wybierz dwóch zawodników, aby zobaczyć porównanie.</p>
      )}
      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.hint}>Ładowanie porównania…</p>}

      {result && (
        <>
          <div className={styles.chartGrid}>
            <ChartCard title="Profil" subtitle="znormalizowane 0–100">
              <CompareRadar radar={result.radar} names={names} />
            </ChartCard>
            <ChartCard title="Statystyki ogółem">
              <CompareBars totals={result.totals} names={names} />
            </ChartCard>
          </div>

          <TotalsTable result={result} names={names} />
          <WinRatioTable winRates={result.winRates} names={names} />

          {result.seasonOverlap.length > 0 && (
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>Wspólne sezony</h3>
              <div className={styles.scroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.left}>Sezon</th>
                      {names.map((name) => (
                        <th key={name}>{name} (G/A/M)</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.seasonOverlap.map((o) => (
                      <tr key={o.season}>
                        <td className={styles.left}>{o.season}</td>
                        {o.stats.map((s, i) => (
                          <td key={i}>
                            {s.goals}/{s.assists}/{s.games}
                          </td>
                        ))}
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
                      {names.map((name) => (
                        <th key={name}>{name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.sharedMatches.map((m, i) => (
                      <tr key={`${m.date}-${i}`}>
                        <td className={styles.left}>{formatDate(m.date)}</td>
                        <td className={styles.left}>{m.opponent}</td>
                        <td>{m.result}</td>
                        {m.events.map((ev, j) => (
                          <td key={j}>{ev.join(", ") || "—"}</td>
                        ))}
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

const TOTAL_ROWS: { label: string; key: keyof CompareTotals }[] = [
  { label: "Mecze", key: "games" },
  { label: "Bramki", key: "goals" },
  { label: "Asysty", key: "assists" },
  { label: "G+A", key: "goalContributions" },
  { label: "MVP", key: "mvp" },
  { label: "Gole/mecz", key: "goalsPerGame" },
  { label: "G+A/mecz", key: "goalContributionsPerGame" },
];

function TotalsTable({ result, names }: { result: CompareResult; names: string[] }) {
  return (
    <div className={styles.block}>
      <h3 className={styles.blockTitle}>Bezpośrednie porównanie</h3>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.left}>Statystyka</th>
              {names.map((name, i) => (
                <th key={name} className={NAME_CLASS[i]}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOTAL_ROWS.map((r) => {
              const values = result.totals[r.key];
              const max = Math.max(...values);
              const split = values.some((v) => v !== max);
              return (
                <tr key={r.label}>
                  <td className={`${styles.left} ${styles.metric}`}>{r.label}</td>
                  {values.map((v, i) => (
                    <td key={i} className={split && v === max ? styles.win : ""}>
                      {v}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const WIN_ROWS: { label: string; key: keyof PlayerWinRates }[] = [
  { label: "Gdy grał", key: "played" },
  { label: "Gdy strzelał", key: "scored" },
  { label: "Gdy asystował", key: "assisted" },
];

function formatRate(rate: WinRate): string {
  return `${rate.winRate.toFixed(1).replace(".", ",")}%`;
}

function WinRatioTable({
  winRates,
  names,
}: {
  winRates: PlayerWinRates[];
  names: string[];
}) {
  return (
    <div className={styles.block}>
      <h3 className={styles.blockTitle}>Win ratio</h3>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.left}>Statystyka</th>
              {names.map((name, i) => (
                <th key={name} className={NAME_CLASS[i]}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WIN_ROWS.map((r) => {
              const rates = winRates.map((w) => w[r.key]);
              const max = Math.max(...rates.map((rate) => (rate.games > 0 ? rate.winRate : -1)));
              const split = rates.some((rate) => rate.games > 0 && rate.winRate !== max);
              return (
                <tr key={r.label}>
                  <td className={`${styles.left} ${styles.metric}`}>{r.label}</td>
                  {rates.map((rate, i) => (
                    <td key={i} className={styles.rateCell}>
                      {rate.games > 0 ? (
                        <>
                          <span
                            className={`${styles.rateValue} ${split && rate.winRate === max ? styles.win : ""}`}
                          >
                            {formatRate(rate)}
                          </span>
                          <span className={styles.rateBar} role="presentation">
                            <span
                              className={styles.rateWin}
                              style={{ width: `${(rate.wins / rate.games) * 100}%` }}
                            />
                            <span
                              className={styles.rateDraw}
                              style={{ width: `${(rate.draws / rate.games) * 100}%` }}
                            />
                            <span
                              className={styles.rateLoss}
                              style={{ width: `${(rate.losses / rate.games) * 100}%` }}
                            />
                          </span>
                          <span className={styles.rateRecord}>
                            {rate.wins}Z · {rate.draws}R · {rate.losses}P
                          </span>
                        </>
                      ) : (
                        <span className={styles.rateEmpty}>Brak meczów</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
