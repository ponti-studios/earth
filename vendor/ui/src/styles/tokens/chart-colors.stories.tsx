import type { Meta, StoryObj } from "@storybook/react-vite";

import { CHART_CSS_VARS } from "../../constants/chart-colors";

const meta: Meta = { title: "Foundations/Charts", parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj<typeof meta>;

const SERIES = [
  { key: "chart1", label: "chart-1" },
  { key: "chart2", label: "chart-2" },
  { key: "chart3", label: "chart-3" },
  { key: "chart4", label: "chart-4" },
  { key: "chart5", label: "chart-5" },
] as const;

const STATUS = [
  { key: "positive", label: "chart-positive", example: "▲ Up 12%" },
  { key: "negative", label: "chart-negative", example: "▼ Down 4%" },
  { key: "neutral", label: "chart-neutral", example: "— Flat" },
] as const;

// A handful of arbitrary multi-series datasets, purely to show how the
// ordinal chart-1..5 palette reads next to itself in a real chart shape.
const BAR_DATA = [
  [42, 68, 30, 55, 90],
  [70, 25, 60, 40, 35],
  [30, 55, 80, 20, 65],
];

const LINE_POINTS: Record<string, Array<[number, number]>> = {
  chart1: [
    [0, 60],
    [20, 40],
    [40, 50],
    [60, 20],
    [80, 30],
    [100, 10],
  ],
  chart2: [
    [0, 80],
    [20, 70],
    [40, 75],
    [60, 55],
    [80, 60],
    [100, 45],
  ],
  chart3: [
    [0, 30],
    [20, 45],
    [40, 25],
    [60, 50],
    [80, 35],
    [100, 55],
  ],
  chart4: [
    [0, 90],
    [20, 85],
    [40, 65],
    [60, 70],
    [80, 50],
    [100, 60],
  ],
  chart5: [
    [0, 15],
    [20, 30],
    [40, 20],
    [60, 40],
    [80, 25],
    [100, 20],
  ],
};

export const CategoricalPalette: Story = {
  render: () => (
    <main className="bg-background text-foreground grid min-h-screen gap-10 p-6 md:p-10">
      <header className="grid gap-2">
        <p className="text-muted-foreground text-sm">Foundations / charts</p>
        <h1 className="text-4xl font-semibold tracking-tight">Chart colors</h1>
        <p className="text-muted-foreground max-w-2xl text-base">
          <code className="font-mono">chart-1</code> through{" "}
          <code className="font-mono">chart-5</code> are an ordinal palette for arbitrary
          categorical series (e.g. one line per country) — there's no fixed meaning to a given slot,
          so they're assigned by index, not by what the data represents. That's different from{" "}
          <code className="font-mono">chart-positive</code>/
          <code className="font-mono">chart-negative</code>/
          <code className="font-mono">chart-neutral</code> below, which carry real meaning
          (up/down/flat) and should stay semantic in any chart that shows a directional delta.
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Series swatches</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SERIES.map(({ key, label }) => (
            <div
              key={key}
              className="border-border grid min-h-20 content-end rounded-md border p-3"
              style={{ backgroundColor: CHART_CSS_VARS[key] }}
            >
              <span className="bg-background text-foreground w-fit rounded px-1 font-mono text-xs">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-border bg-card grid gap-5 rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">Grouped bar chart (mock)</h2>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Three unrelated categories, five series each — a stress test for how distinguishable the
          palette stays side by side.
        </p>
        <div className="flex items-end gap-8" style={{ height: 220 }}>
          {BAR_DATA.map((group, groupIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static mock dataset
            <div key={groupIndex} className="flex h-full items-end gap-1.5">
              {group.map((value, seriesIndex) => (
                <div
                  key={SERIES[seriesIndex].key}
                  className="w-6 rounded-t-sm"
                  style={{
                    height: `${value}%`,
                    backgroundColor: CHART_CSS_VARS[SERIES[seriesIndex].key],
                  }}
                  title={SERIES[seriesIndex].label}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {SERIES.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: CHART_CSS_VARS[key] }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground font-mono text-xs">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-border bg-card grid gap-5 rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">Multi-line chart (mock)</h2>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-56 w-full">
          <title>Multi-series line chart using the chart-1..5 palette</title>
          {Object.entries(LINE_POINTS).map(([key, points]) => (
            <polyline
              key={key}
              fill="none"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              stroke={CHART_CSS_VARS[key as keyof typeof CHART_CSS_VARS]}
              points={points.map(([x, y]) => `${x},${y}`).join(" ")}
            />
          ))}
        </svg>
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Semantic status colors</h2>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Use these — not a numbered slot — whenever a value has an inherent direction.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STATUS.map(({ key, label, example }) => (
            <div key={key} className="border-border grid gap-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: CHART_CSS_VARS[key] }}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground font-mono text-xs">{label}</span>
              </div>
              <span className="text-lg font-semibold" style={{ color: CHART_CSS_VARS[key] }}>
                {example}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  ),
};
