"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CumulativePoint } from "@/lib/stats/form";
import { shortDate } from "@/lib/client/format";
import { CHART, tooltipStyle } from "./chartTheme";

export function CumulativeGoals({ data }: { data: CumulativePoint[] }) {
  const rows = data.map((p) => ({ ...p, label: shortDate(p.date) }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
        <defs>
          <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.gold} stopOpacity={0.5} />
            <stop offset="100%" stopColor={CHART.gold} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="navyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.navy} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART.navy} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART.axis }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: CHART.axis }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="goals"
          name="Bramki"
          stroke={CHART.gold}
          strokeWidth={2.5}
          fill="url(#goldFill)"
        />
        <Area
          type="monotone"
          dataKey="assists"
          name="Asysty"
          stroke={CHART.navy}
          strokeWidth={2.5}
          fill="url(#navyFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
