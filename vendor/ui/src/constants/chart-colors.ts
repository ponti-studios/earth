/**
 * Chart colors are CSS-variable-backed so they stay in sync with the active
 * color system and mode at runtime.
 */

export const CHART_COLORS = {
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",

  positive: "var(--chart-positive)",
  negative: "var(--chart-negative)",
  neutral: "var(--chart-neutral)",

  background: "var(--color-background)",
  grid: "var(--color-border)",

  axis: "var(--color-muted-foreground)",
  label: "var(--color-muted-foreground)",

  tooltip: {
    background: "var(--color-card)",
    text: "var(--color-foreground)",
    border: "var(--color-border)",
  },
} as const;

export const CHART_CSS_VARS = {
  positive: "var(--chart-positive)",
  negative: "var(--chart-negative)",
  neutral: "var(--chart-neutral)",
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
} as const;
