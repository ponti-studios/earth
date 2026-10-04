import { useEffect, useState } from "react";
import { Link, useFetcher, useRevalidator } from "react-router";
import type { Place, PlaceGeocodeAttempt } from "~/db";
import type { GeocodePreview } from "~/lib/server/geocode";

type MutationResponse = { ok: true } | { error: string };

export default function PlaceDetail({
  place,
  attempts,
  layersParam,
}: {
  place: Place;
  attempts: PlaceGeocodeAttempt[];
  layersParam: string;
}) {
  const previewFetcher = useFetcher<GeocodePreview>();
  const mutateFetcher = useFetcher<MutationResponse>();
  const revalidator = useRevalidator();
  const [query, setQuery] = useState(place.reviewQuery?.trim() || place.name);

  useEffect(() => {
    setQuery(place.reviewQuery?.trim() || place.name);
  }, [place.id, place.reviewQuery, place.name]);

  useEffect(() => {
    if (mutateFetcher.data && "ok" in mutateFetcher.data) {
      window.dispatchEvent(new CustomEvent("places:changed"));
      revalidator.revalidate();
    }
  }, [mutateFetcher.data, revalidator]);

  const preview =
    previewFetcher.data && "results" in previewFetcher.data ? previewFetcher.data : null;
  const isGeocoding = previewFetcher.state !== "idle";
  const isSaving = mutateFetcher.state !== "idle";
  const mutationError =
    mutateFetcher.data && "error" in mutateFetcher.data ? mutateFetcher.data.error : null;

  const submit = (intent: string, extra: Record<string, string> = {}) => {
    mutateFetcher.submit(
      { intent, query, ...extra },
      { method: "post", action: `/api/places/${place.id}` },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/?layers=${layersParam}`}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          ← Map
        </Link>
        <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
          place #{place.id}
        </span>
      </div>

      <div>
        <h2 className="text-foreground leading-tight font-semibold">{place.name}</h2>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {[place.city, place.state, place.country].filter(Boolean).join(", ") ||
            place.formattedAddress ||
            "No location yet"}
        </p>
        <div className="text-muted-foreground mt-2 space-y-1 font-mono text-[10px] tracking-widest uppercase">
          <div className="flex justify-between">
            <span>Status</span>
            <span>{place.reviewStatus?.replace(/_/g, " ") ?? "unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span>Coordinates</span>
            <span>
              {place.latitude != null && place.longitude != null
                ? `${place.latitude.toFixed(4)}°, ${place.longitude.toFixed(4)}°`
                : "—"}
            </span>
          </div>
          {place.reviewReason && (
            <div className="flex justify-between gap-4">
              <span>Reason</span>
              <span className="truncate normal-case">{place.reviewReason}</span>
            </div>
          )}
        </div>
      </div>

      {mutationError && <p className="text-sm text-red-500">{mutationError}</p>}

      <div className="space-y-2">
        <p className="ui-eyebrow">Review query</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-card border-border text-foreground focus:border-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          <previewFetcher.Form method="get" action="/api/geocode">
            <input type="hidden" name="q" value={query} />
            <input type="hidden" name="limit" value="5" />
            <button
              type="submit"
              disabled={isGeocoding || !query.trim()}
              className="bg-foreground text-background rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase disabled:opacity-50"
            >
              {isGeocoding ? "Geocoding…" : "Retry geocode"}
            </button>
          </previewFetcher.Form>
          <button
            type="button"
            onClick={() => submit("save-query")}
            disabled={isSaving}
            className="bg-card border-border text-foreground rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase disabled:opacity-50"
          >
            Save query
          </button>
          <button
            type="button"
            onClick={() => submit("not-a-place")}
            disabled={isSaving}
            className="bg-card border-border text-muted-foreground rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase disabled:opacity-50"
          >
            Not a place
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="ui-eyebrow">Candidate matches</p>
        {preview ? (
          preview.results.length === 0 ? (
            <p className="text-muted-foreground text-xs">No matches for “{preview.query}”.</p>
          ) : (
            <ul className="space-y-1.5">
              {preview.results.map((r) => (
                <li key={`${r.latitude},${r.longitude}`} className="bg-card border-border rounded-md border p-3">
                  <p className="text-foreground text-sm font-medium">{r.displayTitle}</p>
                  <p className="text-muted-foreground font-mono text-[10px]">
                    {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                  </p>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      submit("accept", {
                        displayTitle: r.displayTitle,
                        latitude: String(r.latitude),
                        longitude: String(r.longitude),
                        city: r.city ?? "",
                        state: r.state ?? "",
                        postalCode: r.postalCode ?? "",
                        country: r.country ?? "",
                        countryCode: r.countryCode ?? "",
                      })
                    }
                    className="bg-foreground text-background mt-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase disabled:opacity-50"
                  >
                    Use this match
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="text-muted-foreground text-xs">
            {place.lastGeocodeResultSummary ?? "Run Retry geocode to preview matches."}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="ui-eyebrow">Review history · {attempts.length}</p>
        {attempts.length === 0 ? (
          <p className="text-muted-foreground text-xs">No attempts recorded yet.</p>
        ) : (
          <ul className="space-y-1">
            {attempts.slice(0, 8).map((a) => (
              <li
                key={a.id}
                className="bg-card border-border flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <span className="text-foreground truncate text-xs">{a.query}</span>
                <span className="text-muted-foreground flex-shrink-0 font-mono text-[10px] uppercase">
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
