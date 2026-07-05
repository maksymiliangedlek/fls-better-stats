export const CHART = {
  navy: "#0c4563",
  navyLight: "#3d7ea6",
  gold: "#c9a227",
  goldLight: "#e8c766",
  grid: "rgba(12, 69, 99, 0.12)",
  axis: "#5b6b76",
  tooltipBg: "#ffffff",
  tooltipBorder: "rgba(12, 69, 99, 0.15)",
} as const;

export const tooltipStyle = {
  background: CHART.tooltipBg,
  border: `1px solid ${CHART.tooltipBorder}`,
  borderRadius: 12,
  boxShadow: "0 8px 30px rgba(6, 39, 54, 0.12)",
  fontSize: 13,
} as const;
