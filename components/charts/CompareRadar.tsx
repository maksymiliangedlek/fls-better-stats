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

export function CompareRadar({
  radar,
  nameA,
  nameB,
}: {
  radar: RadarData;
  nameA: string;
  nameB: string;
}) {
  const rows = radar.axes.map((axis, i) => ({
    axis,
    [nameA]: radar.values[i][0],
    [nameB]: radar.values[i][1],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={rows} outerRadius="72%">
        <PolarGrid stroke={CHART.grid} />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: CHART.axis }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: CHART.axis }} angle={90} />
        <Radar name={nameA} dataKey={nameA} stroke={CHART.gold} fill={CHART.gold} fillOpacity={0.35} />
        <Radar name={nameB} dataKey={nameB} stroke={CHART.navy} fill={CHART.navy} fillOpacity={0.25} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
