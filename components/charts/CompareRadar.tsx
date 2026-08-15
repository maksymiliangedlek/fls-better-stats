"use client";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { CompareRadar as RadarData } from "@/lib/types/compare";
import { CHART, tooltipStyle } from "./chartTheme";

const SERIES = [
  { stroke: CHART.gold, fill: CHART.gold, fillOpacity: 0.35 },
  { stroke: CHART.navy, fill: CHART.navy, fillOpacity: 0.25 },
  { stroke: CHART.wine, fill: CHART.wine, fillOpacity: 0.22 },
] as const;

export function CompareRadar({
  radar,
  names,
}: {
  radar: RadarData;
  names: string[];
}) {
  const rows = radar.axes.map((axis, i) => {
    const row: Record<string, string | number> = { axis };
    names.forEach((name, j) => {
      row[name] = radar.values[i][j];
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={rows} outerRadius="72%">
        <PolarGrid stroke={CHART.grid} />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: CHART.axis }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: CHART.axis }} angle={90} />
        {names.map((name, i) => (
          <Radar
            key={name}
            name={name}
            dataKey={name}
            stroke={SERIES[i].stroke}
            fill={SERIES[i].fill}
            fillOpacity={SERIES[i].fillOpacity}
            isAnimationActive={false}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
