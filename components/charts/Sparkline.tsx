"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART, tooltipStyle } from "./chartTheme";

/** Compact goals-trend sparkline (goals for per match, oldest -> newest). */
export function Sparkline({ data }: { data: number[] }) {
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.gold} stopOpacity={0.55} />
            <stop offset="100%" stopColor={CHART.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={() => ""}
          formatter={(value) => [value as number, "Bramki"]}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={CHART.gold}
          strokeWidth={2.5}
          fill="url(#sparkGold)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
