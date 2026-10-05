import { Link, useSearchParams } from "react-router";
import { getLineStatuses } from "~/lib/server/tfl-live";
import { listPlaces } from "~/lib/server/places";
import type { Route } from "./+types/index";

export async function loader() {
  const [lines, saved] = await Promise.all([
    getLineStatuses().catch(() => []),
    listPlaces({ limit: 50 }).catch(() => ({ places: [], total: 0, needReview: 0 })),
  ]);
  return { lines, saved: saved.places, total: saved.total };
}

const STATUS_DOT: Record<string, string> = {
  ok: "bg-green-500",
  needs_review: "bg-amber-500",
  no_match: "bg-red-400",
};

export default function Index({ loaderData }: Route.ComponentProps) {
  const { lines, saved, total } = loaderData;
  const [params] = useSearchParams();
  const layers = params.get("layers");

  const withLayers = (sel: string) =>
    layers ? `/?layers=${layers}&sel=${sel}` : `/?sel=${sel}`;

  const disrupted = lines.filter((line) => line.isDisrupted);
  const goodCount = lines.length - disrupted.length;

  return (
    <div className="space-y-4">
      <div>
        <p className="ui-eyebrow mb-1">Explore</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Search above to find and save places, toggle layers on the right, or tap a marker for
          detail.
        </p>
      </div>

      <section aria-label="Service status">
        <h2 className="ui-eyebrow mb-2">Service status</h2>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Status feed unavailable right now.</p>
        ) : disrupted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Good service on all {lines.length} lines.
          </p>
        ) : (
          <div className="space-y-2">
            <ul className="space-y-2">
              {disrupted.map((line) => (
                <li key={line.lineId} className="rounded-md border border-border px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{line.lineName}</span>
                    <span className="shrink-0 font-mono text-[10px] tracking-widest text-amber-500 uppercase">
                      {line.severity}
                    </span>
                  </div>
                  {line.reason && (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                      {line.reason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {goodCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Good service on {goodCount} other{goodCount === 1 ? "" : "s"}.
              </p>
            )}
          </div>
        )}
      </section>

      <section aria-label="Saved places">
        <h2 className="ui-eyebrow mb-2">Saved · {total}</h2>
        {saved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing saved yet — search for a place and hit save.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {saved.map((place) => (
              <li key={place.id}>
                <Link
                  to={withLayers(`place:${place.id}`)}
                  className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-muted"
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[place.reviewStatus ?? ""] ?? "bg-muted-foreground"}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{place.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
