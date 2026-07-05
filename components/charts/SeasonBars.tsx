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
import type { SeasonSplit } from "@/lib/stats/form";
import { seasonLabel } from "@/lib/client/format";
import { CHART, tooltipStyle } from "./chartTheme";

export function SeasonBars({ data }: { data: SeasonSplit[] }) {
  const rows = [...data]
    .sort((a, b) => a.season.localeCompare(b.season))
    .map((s) => ({ ...s, label: seasonLabel(s.season) }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: CHART.axis }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 11, fill: CHART.axis }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(12,69,99,0.05)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="goals" name="Bramki" fill={CHART.gold} radius={[4, 4, 0, 0]} />
        <Bar dataKey="assists" name="Asysty" fill={CHART.navy} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
