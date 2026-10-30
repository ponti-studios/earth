import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import ClientOnly from "~/components/ClientOnly";
import FlightLegList from "~/components/FlightLegList";
import FlightMap from "~/components/FlightMap";
import FlightStats from "~/components/FlightStats";
import FlightYearFilter from "~/components/FlightYearFilter";
import {
  buildLegs,
  flightYears,
  formatDate,
  formatMiles,
  parseYears,
  serializeYears,
  visibleLegs,
  type FlightLeg,
} from "~/lib/flights";
import { flightsData } from "~/lib/flights-data";

const legs = buildLegs(flightsData);
const years = flightYears(legs);

export function meta() {
  return [{ title: "Flight map — Ponti Studios Earth" }];
}

function LegDetail({ leg, closeHref }: { leg: FlightLeg; closeHref: string }) {
  const from = flightsData.airports[leg.from];
  const to = flightsData.airports[leg.to];

  return (
    <section aria-label="Selected leg" className="border-border bg-card mt-4 rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="ui-eyebrow">
          {leg.mode === "rail" ? "Rail" : "Flight"} · {leg.carrier} {leg.number}
        </p>
        <Link
          to={closeHref}
          aria-label="Clear selected leg"
          className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 flex size-6 items-center justify-center rounded-full text-lg leading-none no-underline"
        >
          ×
        </Link>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-foreground font-mono text-xl font-semibold tracking-tight">
            {leg.from}
          </div>
          <div className="text-muted-foreground text-[11px]">{from.city}</div>
        </div>
        <span aria-hidden="true" className="text-muted-foreground text-sm">
          →
        </span>
        <div className="text-right">
          <div className="text-foreground font-mono text-xl font-semibold tracking-tight">
            {leg.to}
          </div>
          <div className="text-muted-foreground text-[11px]">{to.city}</div>
        </div>
      </div>

      <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
        {from.name} → {to.name}
      </p>

      <dl className="border-border mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-[11px]">
        <div>
          <dt className="text-muted-foreground font-mono text-[9px] tracking-[0.12em] uppercase">
            Date
          </dt>
          <dd className="text-foreground mt-0.5">{formatDate(leg.date)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-mono text-[9px] tracking-[0.12em] uppercase">
            Distance
          </dt>
          <dd className="text-foreground mt-0.5">{formatMiles(leg.km)} mi</dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-mono text-[9px] tracking-[0.12em] uppercase">
            Journey
          </dt>
          <dd className="text-foreground mt-0.5">{leg.journey_name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-mono text-[9px] tracking-[0.12em] uppercase">
            Mode
          </dt>
          <dd className="text-foreground mt-0.5 capitalize">{leg.mode}</dd>
        </div>
      </dl>

      {leg.notes ? (
        <p className="text-muted-foreground mt-2 text-[11px] italic">{leg.notes}</p>
      ) : null}
    </section>
  );
}

export default function Flights() {
  const [params, setParams] = useSearchParams();
  const yearsParam = params.get("years");
  const selectedLegId = params.get("leg");

  const selectedYears = useMemo(() => parseYears(yearsParam, years), [yearsParam]);
  const shown = useMemo(() => visibleLegs(legs, selectedYears), [selectedYears]);
  const selectedLeg = shown.find((leg) => leg.id === selectedLegId) ?? null;

  const selectLeg = useCallback(
    (legId: string | null) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (legId) next.set("leg", legId);
          else next.delete("leg");
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setParams],
  );

  const yearsQuery = serializeYears(selectedYears, years);
  const closeHref = yearsQuery ? `/flights?years=${yearsQuery}` : "/flights";

  return (
    <div className="bg-background absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 md:left-[380px]">
        <ClientOnly>
          <FlightMap
            legs={shown}
            airports={flightsData.airports}
            selectedLeg={selectedLeg}
            onSelectLeg={selectLeg}
          />
        </ClientOnly>
      </div>

      <aside
        aria-label="Travel log"
        className="bg-background border-border absolute inset-x-0 bottom-0 z-10 flex max-h-[64dvh] flex-col rounded-t-2xl border-t shadow-2xl md:inset-y-0 md:right-auto md:max-h-none md:w-[380px] md:rounded-none md:border-t-0 md:border-r"
      >
        <div className="bottom-sheet-scroll flex-1 overflow-y-auto p-4 pb-6 md:p-5">
          <header className="mb-4">
            <div className="flex items-center justify-between gap-3">
              <p className="ui-eyebrow">Travel log</p>
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground text-[11px] font-semibold tracking-wide uppercase no-underline transition-colors"
              >
                ← Earth
              </Link>
            </div>
            <h1 className="text-foreground mt-1 text-xl font-semibold tracking-tight">
              Flight map
            </h1>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Every recorded air and rail leg, traced across the world. Pick a year, then tap a
              route for the trip underneath.
            </p>
          </header>

          <FlightStats stats={flightsData.stats} />

          <div className="mt-4">
            <FlightYearFilter years={years} selectedYears={selectedYears} />
          </div>

          {selectedLeg ? <LegDetail leg={selectedLeg} closeHref={closeHref} /> : null}

          <section aria-label="Legs" className="mt-5">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className="ui-eyebrow">Legs</h2>
              <span className="text-muted-foreground font-mono text-[10px]">
                {shown.length} / {flightsData.stats.legs} visible
              </span>
            </div>
            <FlightLegList
              legs={shown}
              selectedYears={selectedYears}
              allYears={years}
              selectedLegId={selectedLegId}
            />
          </section>

          <footer className="text-muted-foreground border-border mt-4 flex gap-4 border-t pt-3 font-mono text-[9px] tracking-[0.12em] uppercase">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="bg-foreground inline-block h-px w-5" />
              flight
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="border-foreground inline-block w-5 border-t border-dashed"
              />
              rail
            </span>
          </footer>
        </div>
      </aside>
    </div>
  );
}
