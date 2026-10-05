import { Link } from "react-router";
import { useArrivals } from "../lib/hooks/use-tfl-live";
import type { TflStation } from "~/lib/server/tfl";

function formatCountdown(seconds: number): string {
  if (seconds < 45) return "due";
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export default function StationDetail({
  station,
  layersParam,
}: {
  station: TflStation;
  layersParam: string;
}) {
  const { data: arrivals, isLoading, isError } = useArrivals(station.tflId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/?layers=${layersParam}`}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          ← Map
        </Link>
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Live departures
        </span>
      </div>

      <div>
        <h2 className="text-foreground leading-tight font-semibold">{station.commonName}</h2>
        <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-widest uppercase">
          {station.tflId}
        </p>
        {station.lines.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {station.lines.map((line) => (
              <span
                key={line.id}
                className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
              >
                {line.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        {isLoading ? (
          <ul className="space-y-2" aria-label="Loading departures">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-9 animate-pulse rounded-md bg-muted" />
            ))}
          </ul>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Departures unavailable right now. TfL feeds drop out sometimes — try again in a bit.
          </p>
        ) : arrivals && arrivals.length > 0 ? (
          <ul className="divide-y divide-border rounded-md border border-border">
            {arrivals.map((arrival, i) => (
              <li
                key={`${arrival.lineId}-${arrival.expectedArrival}-${i}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{arrival.destinationName}</p>
                  <p className="truncate font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                    {arrival.lineName}
                    {arrival.platformName ? ` · ${arrival.platformName}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-mono text-xs font-semibold ${arrival.timeToStation < 45 ? "text-green-500" : "text-foreground"}`}
                >
                  {formatCountdown(arrival.timeToStation)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No departures in the next while — check back shortly.
          </p>
        )}
      </div>
    </div>
  );
}
