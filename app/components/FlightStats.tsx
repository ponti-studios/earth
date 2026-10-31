import { formatSpan, type FlightStats as FlightStatsData } from "~/lib/flights";

type Stat = {
  key: string;
  label: string;
  value: string;
  title?: string;
};

/**
 * Lifetime totals come straight from `stats` in flights.json. They are
 * deliberately not recomputed from the legs — the source data owns the
 * numbers, including its historical rounding.
 */
export default function FlightStats({ stats }: { stats: FlightStatsData }) {
  const items: Stat[] = [
    { key: "legs", label: "legs", value: stats.legs.toLocaleString("en-GB") },
    {
      key: "miles",
      label: "miles",
      value: stats.total_miles.toLocaleString("en-GB"),
      title: `${stats.total_km.toLocaleString("en-GB")} km`,
    },
    { key: "hubs", label: "hubs", value: stats.airports.toLocaleString("en-GB") },
    {
      key: "countries",
      label: "countries",
      value: stats.countries.length.toLocaleString("en-GB"),
      title: stats.countries.join(", "),
    },
    { key: "span", label: "recorded span", value: formatSpan(stats.span) },
  ];

  return (
    <dl
      aria-label="Travel statistics"
      className="border-border bg-border grid grid-cols-3 gap-px overflow-hidden rounded-md border sm:grid-cols-5"
    >
      {items.map((item) => (
        <div
          key={item.key}
          data-stat={item.key}
          data-stat-value={item.value}
          title={item.title}
          className="bg-card flex flex-col-reverse gap-0.5 px-2.5 py-2"
        >
          <dt className="text-muted-foreground font-mono text-[9px] tracking-[0.12em] uppercase">
            {item.label}
          </dt>
          <dd className="text-foreground font-mono text-sm font-semibold tabular-nums">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
