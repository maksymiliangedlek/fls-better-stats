"use client";
import dynamic from "next/dynamic";
import { ChartCard } from "./ChartCard";
import type { PlayerStats } from "@/lib/stats/form";
import styles from "./PlayerCharts.module.css";

const chartFallback = <div className={styles.loading}>Ładowanie wykresu…</div>;

const SeasonBars = dynamic(() => import("./SeasonBars").then((m) => m.SeasonBars), {
  ssr: false,
  loading: () => chartFallback,
});
const FormLineChart = dynamic(() => import("./FormLineChart").then((m) => m.FormLineChart), {
  ssr: false,
  loading: () => chartFallback,
});
const CumulativeGoals = dynamic(() => import("./CumulativeGoals").then((m) => m.CumulativeGoals), {
  ssr: false,
  loading: () => chartFallback,
});

export function PlayerCharts({ stats }: { stats: PlayerStats }) {
  const hasForm = stats.form.length > 1;

  return (
    <div className={styles.grid}>
      {stats.seasonSplits.length > 0 && (
        <ChartCard title="Bramki i asysty" subtitle="wg sezonu">
          <SeasonBars data={stats.seasonSplits} />
        </ChartCard>
      )}
      {hasForm && (
        <ChartCard title="Forma" subtitle="średnia G+A z 10 meczów">
          <FormLineChart data={stats.rollingForm10} />
        </ChartCard>
      )}
      {hasForm && (
        <ChartCard title="Skumulowany dorobek" subtitle="bramki i asysty w czasie">
          <CumulativeGoals data={stats.cumulativeGoals} />
        </ChartCard>
      )}
    </div>
  );
}
