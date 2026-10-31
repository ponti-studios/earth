import { Link } from "react-router";
import { formatDate, formatMiles, serializeYears, type FlightLeg } from "~/lib/flights";

type Props = {
  legs: readonly FlightLeg[];
  selectedYears: readonly number[];
  allYears: readonly number[];
  selectedLegId?: string | null;
};

export function legHref(
  leg: FlightLeg,
  selectedYears: readonly number[],
  allYears: readonly number[],
): string {
  const params = new URLSearchParams();
  const years = serializeYears(selectedYears, allYears);
  if (years) params.set("years", years);
  params.set("leg", leg.id);
  return `/flights?${params.toString()}`;
}

/**
 * The readable side of the map. One row per leg that is currently visible, in
 * reverse chronological order, with the same year-colour dot as the route.
 */
export default function FlightLegList({ legs, selectedYears, allYears, selectedLegId }: Props) {
  if (legs.length === 0) {
    return (
      <p className="text-muted-foreground py-3 text-xs">
        No legs in the selected years. Pick another year or show all.
      </p>
    );
  }

  const ordered = [...legs].sort((a, b) => b.date.localeCompare(a.date) || a.index - b.index);

  return (
    <ul className="space-y-1">
      {ordered.map((leg) => {
        const selected = leg.id === selectedLegId;
        return (
          <li key={leg.id}>
            <Link
              to={legHref(leg, selectedYears, allYears)}
              data-leg-id={leg.id}
              aria-current={selected ? "true" : undefined}
              className={`flex items-start gap-2.5 rounded-md border p-2.5 no-underline transition-colors ${
                selected ? "border-foreground bg-muted" : "border-border bg-card hover:border-ring"
              }`}
            >
              <span
                aria-hidden="true"
                className="mt-1.5 size-2 shrink-0 rounded-full"
                style={{ backgroundColor: leg.color }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-foreground font-mono text-sm font-semibold tracking-tight">
                    {leg.from} → {leg.to}
                  </span>
                  <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                    {formatDate(leg.date)}
                  </span>
                </span>
                <span className="text-muted-foreground mt-0.5 flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="truncate">
                    {leg.carrier} {leg.number}
                    {leg.mode === "rail" ? " · rail" : ""}
                  </span>
                  <span className="shrink-0 font-mono">{formatMiles(leg.km)} mi</span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
