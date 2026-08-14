"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RollingPoint } from "@/lib/stats/form";
import { shortDate } from "@/lib/client/format";
import { CHART, tooltipStyle } from "./chartTheme";

export function FormLineChart({ data }: { data: RollingPoint[] }) {
  const rows = data.map((p) => ({ ...p, label: shortDate(p.date) }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART.axis }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: CHART.axis }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="avgGa"
          name="Śr. G+A (10 meczów)"
          stroke={CHART.gold}
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, fill: CHART.navy }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
