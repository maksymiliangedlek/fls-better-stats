"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompareTotals } from "@/lib/types/compare";
import { CHART, tooltipStyle } from "./chartTheme";

const METRICS: { key: keyof CompareTotals; label: string }[] = [
  { key: "goals", label: "Bramki" },
  { key: "assists", label: "Asysty" },
  { key: "goalContributions", label: "G+A" },
  { key: "mvp", label: "MVP" },
  { key: "games", label: "Mecze" },
];

export function CompareBars({
  totals,
  nameA,
  nameB,
}: {
  totals: CompareTotals;
  nameA: string;
  nameB: string;
}) {
  const rows = METRICS.map((m) => ({
    metric: m.label,
    [nameA]: totals[m.key][0],
    [nameB]: totals[m.key][1],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="metric" tick={{ fontSize: 11, fill: CHART.axis }} />
        <YAxis tick={{ fontSize: 11, fill: CHART.axis }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(12,69,99,0.05)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey={nameA} fill={CHART.gold} radius={[4, 4, 0, 0]} />
        <Bar dataKey={nameB} fill={CHART.navy} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
