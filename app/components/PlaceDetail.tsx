import { useEffect, useState } from "react";
import { Link, useFetcher, useNavigate, useRevalidator } from "react-router";
import type { Place, PlaceGeocodeAttempt } from "~/db";
import type { GeocodePreview } from "~/lib/server/geocode";
import type { NearbyCamera, NearbyStation } from "~/lib/server/tfl";

type MutationResponse = { ok: true } | { error: string };

function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`;
  return `${km.toFixed(1)} km`;
}

function selLink(layersParam: string, sel: string): string {
  return layersParam ? `/?layers=${layersParam}&sel=${sel}` : `/?sel=${sel}`;
}

export default function PlaceDetail({
  place,
  attempts,
  nearby,
  layersParam,
}: {
  place: Place;
  attempts: PlaceGeocodeAttempt[];
  nearby: { stations: NearbyStation[]; cameras: NearbyCamera[] };
  layersParam: string;
}) {
  const previewFetcher = useFetcher<GeocodePreview>();
  const mutateFetcher = useFetcher<MutationResponse>();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [query, setQuery] = useState(place.reviewQuery?.trim() || place.name);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(place.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastIntent, setLastIntent] = useState("");

  useEffect(() => {
    setQuery(place.reviewQuery?.trim() || place.name);
    setDraftName(place.name);
    setEditing(false);
    setConfirmingDelete(false);
  }, [place.id, place.reviewQuery, place.name]);

  useEffect(() => {
    if (mutateFetcher.data && "ok" in mutateFetcher.data) {
      window.dispatchEvent(new CustomEvent("places:changed"));
      if (lastIntent === "delete") {
        navigate(layersParam ? `/?layers=${layersParam}` : "/");
      } else {
        setEditing(false);
        setConfirmingDelete(false);
        revalidator.revalidate();
      }
    }
  }, [mutateFetcher.data, lastIntent, navigate, layersParam, revalidator]);

  const preview =
    previewFetcher.data && "results" in previewFetcher.data ? previewFetcher.data : null;
  const isGeocoding = previewFetcher.state !== "idle";
  const isSaving = mutateFetcher.state !== "idle";
  const mutationError =
    mutateFetcher.data && "error" in mutateFetcher.data ? mutateFetcher.data.error : null;

  const submit = (intent: string, extra: Record<string, string> = {}) => {
    setLastIntent(intent);
    mutateFetcher.submit(
      { intent, query, ...extra },
      { method: "post", action: `/api/places/${place.id}` },
    );
  };

  const share = async () => {
    const url = `${window.location.origin}${selLink(layersParam, `place:${place.id}`)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — no-op.
    }
  };

  const locationLine =
    [place.city, place.state, place.country].filter(Boolean).join(", ") ||
    place.formattedAddress ||
    "No address yet";
  const chips = [place.placeType, place.city, place.countryCode].filter(Boolean);
  const hasCoords = place.latitude != null && place.longitude != null;
  // The review workbench only surfaces for unresolved places. Resolved
  // ones get a one-line verified note instead.
  const showReview = place.reviewStatus !== "ok";
  const savedOn = new Date(place.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={layersParam ? `/?layers=${layersParam}` : "/"}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          ← Map
        </Link>
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {place.reviewStatus === "ok" ? `Saved · ${savedOn}` : "Needs review"}
        </span>
      </div>

      <div>
        {editing ? (
          <div className="flex gap-2">
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              autoFocus
              maxLength={200}
              className="bg-card border-border text-foreground focus:border-ring min-w-0 flex-1 rounded-md border px-3 py-1.5 text-sm font-semibold focus:outline-none"
            />
            <button
              type="button"
              disabled={isSaving || !draftName.trim()}
              onClick={() => submit("rename", { name: draftName.trim() })}
              className="bg-foreground text-background shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraftName(place.name);
              }}
              className="text-muted-foreground shrink-0 rounded-md px-2 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-foreground leading-tight font-semibold">{place.name}</h2>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Rename place"
              className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 text-xs transition-colors"
            >
              Rename
            </button>
          </div>
        )}
        <p className="text-muted-foreground mt-0.5 text-xs">{locationLine}</p>
        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {hasCoords && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="bg-foreground text-background rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase"
          >
            Directions
          </a>
        )}
        <button
          type="button"
          onClick={share}
          className="bg-card border-border text-foreground rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase"
        >
          {copied ? "Link copied" : "Share"}
        </button>
        {confirmingDelete ? (
          <>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => submit("delete")}
              className="rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white uppercase disabled:opacity-50"
            >
              {isSaving ? "Deleting…" : "Confirm delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-muted-foreground rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase"
            >
              Keep
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="bg-card border-border text-muted-foreground rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase"
          >
            Delete
          </button>
        )}
      </div>

      {mutationError && <p className="text-sm text-red-500">{mutationError}</p>}

      {(nearby.stations.length > 0 || nearby.cameras.length > 0) && (
        <section aria-label="Nearby" className="space-y-3">
          {nearby.stations.length > 0 && (
            <div>
              <h3 className="ui-eyebrow mb-2">Nearby stations</h3>
              <ul className="divide-y divide-border rounded-md border border-border">
                {nearby.stations.map((station) => (
                  <li key={station.tflId}>
                    <Link
                      to={selLink(layersParam, `station:${station.tflId}`)}
                      className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <span className="flex size-3 shrink-0 items-center justify-center rounded-full bg-[#e32017]">
                        <span className="size-1.5 rounded-full bg-white" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {station.commonName}
                        </span>
                        {station.lines.length > 0 && (
                          <span className="block truncate font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                            {station.lines.map((l) => l.name).join(" · ")}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {formatDistance(station.distanceKm)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {nearby.cameras.length > 0 && (
            <div>
              <h3 className="ui-eyebrow mb-2">Nearby cameras</h3>
              <ul className="divide-y divide-border rounded-md border border-border">
                {nearby.cameras.map((camera) => (
                  <li key={camera.tflId}>
                    <Link
                      to={selLink(layersParam, `cam:${camera.tflId}`)}
                      className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">{camera.commonName}</span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {formatDistance(camera.distanceKm)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {showReview ? (
        <section aria-label="Resolve location" className="space-y-2">
          <p className="ui-eyebrow">Resolve location</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            This place isn’t pinned to a verified spot yet. Tweak the query, preview matches, and
            pick the right one.
          </p>
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
                {isGeocoding ? "Geocoding…" : "Preview matches"}
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

          {preview ? (
            preview.results.length === 0 ? (
              <p className="text-muted-foreground text-xs">No matches for “{preview.query}”.</p>
            ) : (
              <ul className="space-y-1.5">
                {preview.results.map((r) => (
                  <li
                    key={`${r.latitude},${r.longitude}`}
                    className="bg-card border-border rounded-md border p-3"
                  >
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
              {place.lastGeocodeResultSummary ?? "Preview matches to resolve this place."}
            </p>
          )}

          {attempts.length > 0 && (
            <details>
              <summary className="text-muted-foreground cursor-pointer text-xs">
                History · {attempts.length}
              </summary>
              <ul className="mt-2 space-y-1">
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
            </details>
          )}
        </section>
      ) : (
        <p className="text-muted-foreground text-xs">
          Pinned via {place.reviewDecisionSource === "web-search" ? "search" : "geocoder"} ·{" "}
          {place.lastGeocodeResultSummary ?? place.formattedAddress}
        </p>
      )}

      <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {hasCoords
          ? `${place.latitude!.toFixed(4)}°, ${place.longitude!.toFixed(4)}° · place #${place.id}`
          : `place #${place.id}`}
      </p>
    </div>
  );
}
