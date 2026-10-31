import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ParcelMap, { type ParcelMapRoute } from "~/components/ParcelMap";
import {
  PARCEL_TYPES,
  TYPE_EMOJI,
  addParcel,
  cityCoord,
  detectCarrier,
  emojiForType,
  greatCircle,
  isDelivered,
  loadParcels,
  markerPosition,
  removeParcel,
  saveParcels,
  shouldFetchStatus,
  type ParcelStatusResult,
  type ParcelType,
  type SavedParcel,
} from "~/lib/parcels";

export function meta() {
  return [{ title: "Parcels · Ponti Studios Earth" }];
}

type StatusEntry =
  | { kind: "loading" }
  | { kind: "loaded"; data: ParcelStatusResult }
  | { kind: "error" };

const REASON_COPY: Record<string, string> = {
  "unknown-carrier":
    "No carrier matched this number's format, so no status request was made. It is still saved.",
  blocked: "The carrier blocked the status request (bot protection).",
  unreachable: "The carrier could not be reached from this app.",
  unparseable: "The carrier returned a page this app cannot read.",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildMapRoute(parcel: SavedParcel, status: ParcelStatusResult): ParcelMapRoute | null {
  if (status.state !== "ok") return null;

  // Both endpoints must resolve to real coordinates. Never substitute a scan
  // for an unmapped destination: that would label one place as another.
  const origin = cityCoord(status.origin);
  const destination = cityCoord(status.destination);
  if (!origin || !destination) return null;

  const coords = greatCircle(origin, destination);
  const marker =
    markerPosition(coords, status.events, {
      collectedAt: status.collectedAt,
      estimatedAt: status.estimatedDeliveryAt,
      delivered: isDelivered(status.status),
    }) ?? coords[0];

  return {
    id: `${parcel.id}:${status.fetchedAt}`,
    originName: status.origin ?? "Origin",
    destinationName: status.destination ?? "Destination",
    origin,
    destination,
    coords,
    marker,
  };
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export default function Parcels() {
  const [parcels, setParcels] = useState<SavedParcel[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [numberInput, setNumberInput] = useState("");
  const [typeInput, setTypeInput] = useState<ParcelType>("parcel");
  const [statuses, setStatuses] = useState<Record<string, StatusEntry>>({});
  const statusesRef = useRef(statuses);
  const mounted = useMounted();

  useEffect(() => {
    statusesRef.current = statuses;
  }, [statuses]);

  useEffect(() => {
    const saved = loadParcels();
    setParcels(saved);
    setSelectedId(saved[0]?.id ?? null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveParcels(parcels);
  }, [parcels, hydrated]);

  const selected = parcels.find((parcel) => parcel.id === selectedId) ?? null;
  const selectedEntry = selected ? statuses[selected.id] : undefined;
  const selectedStatus = selectedEntry?.kind === "loaded" ? selectedEntry.data : null;

  const mapRoute = useMemo(
    () => (selected && selectedStatus ? buildMapRoute(selected, selectedStatus) : null),
    [selected, selectedStatus],
  );

  const loadStatus = useCallback((parcel: SavedParcel) => {
    // Unknown formats are saved but never fetched.
    const detection = detectCarrier(parcel.number);
    if (!detection.carrier) return;
    setStatuses((prev) => ({ ...prev, [parcel.id]: { kind: "loading" } }));
    fetch(
      `/api/parcel-status?number=${encodeURIComponent(parcel.number)}&carrier=${encodeURIComponent(detection.carrier)}`,
    )
      .then(async (response) => {
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return (await response.json()) as ParcelStatusResult;
      })
      .then((data) => {
        setStatuses((prev) => ({ ...prev, [parcel.id]: { kind: "loaded", data } }));
      })
      .catch(() => {
        setStatuses((prev) => ({ ...prev, [parcel.id]: { kind: "error" } }));
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    if (!shouldFetchStatus(selected.number)) return;
    if (statusesRef.current[selected.id]) return;
    loadStatus(selected);
  }, [selected, loadStatus]);

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!numberInput.trim()) return;
    const detection = detectCarrier(numberInput);
    if (!detection.number) return;

    const existing = parcels.find((parcel) => parcel.number === detection.number);
    if (existing) {
      setSelectedId(existing.id);
      setNumberInput("");
      return;
    }

    const next = addParcel(parcels, detection.number, typeInput);
    const added = next[next.length - 1];
    setParcels(next);
    setSelectedId(added.id);
    setNumberInput("");
    setTypeInput("parcel");
  }

  function handleRemove(id: string) {
    const next = removeParcel(parcels, id);
    setParcels(next);
    setStatuses((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  }

  function handleTypeChange(id: string, type: ParcelType) {
    setParcels((prev) => prev.map((parcel) => (parcel.id === id ? { ...parcel, type } : parcel)));
  }

  function handleRefresh() {
    if (!selected) return;
    loadStatus(selected);
  }

  const detection = selected ? detectCarrier(selected.number) : null;
  const emoji = selected ? emojiForType(selected.type) : "📍";

  return (
    <div className="bg-background absolute inset-0 overflow-y-auto">
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <header className="mb-6">
          <p className="ui-eyebrow">Earth · Parcels</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Parcel tracker</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
            Save a tracking number; the carrier is detected from its format. Numbers live in this
            browser only — no account, no sync. Status is read from the carrier, never invented.
          </p>
        </header>

        <form
          onSubmit={handleAdd}
          className="border-border bg-card mb-6 flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="tracking-number" className="ui-eyebrow mb-1 block">
              Tracking number
            </label>
            <input
              id="tracking-number"
              value={numberInput}
              onChange={(event) => setNumberInput(event.target.value)}
              placeholder="e.g. 1291215726 or 1Z…"
              autoComplete="off"
              spellCheck={false}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring w-full rounded-md border px-3 py-2 font-mono text-sm transition-colors focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="parcel-type" className="ui-eyebrow mb-1 block">
              Marker
            </label>
            <select
              id="parcel-type"
              value={typeInput}
              onChange={(event) => setTypeInput(event.target.value as ParcelType)}
              className="bg-background border-border text-foreground focus:border-ring w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none sm:w-36"
            >
              {PARCEL_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {TYPE_EMOJI[type.id]} {type.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-foreground text-background inline-flex min-h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Add
          </button>
        </form>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)] lg:items-start">
          <section
            aria-label="Shipment route map"
            className="border-border relative h-[320px] overflow-hidden rounded-xl border sm:h-[420px] lg:sticky lg:top-6 lg:h-[560px]"
          >
            {mounted ? (
              <ParcelMap
                route={mapRoute}
                emoji={emoji}
                emptyLabel={
                  selected
                    ? detection?.carrier
                      ? "No readable route yet. Check the status panel below."
                      : "Carrier unknown — no route to draw for this number."
                    : "Save a tracking number to draw its route."
                }
              />
            ) : (
              <div className="bg-muted h-full w-full" />
            )}
          </section>

          <div className="space-y-4">
            <StatusPanel parcel={selected} entry={selectedEntry} onRefresh={handleRefresh} />
            <SavedList
              parcels={parcels}
              selectedId={selectedId}
              hydrated={hydrated}
              onSelect={setSelectedId}
              onRemove={handleRemove}
              onTypeChange={handleTypeChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusPanel({
  parcel,
  entry,
  onRefresh,
}: {
  parcel: SavedParcel | null;
  entry: StatusEntry | undefined;
  onRefresh: () => void;
}) {
  if (!parcel) {
    return (
      <section aria-label="Shipment status" className="border-border bg-card rounded-xl border p-4">
        <p className="ui-eyebrow">Shipment status</p>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Add a tracking number to see the carrier, latest scan and estimated delivery.
        </p>
      </section>
    );
  }

  const detection = detectCarrier(parcel.number);
  const loaded = entry?.kind === "loaded" ? entry.data : null;
  const unavailable = loaded?.state === "unavailable";
  const ok = loaded?.state === "ok";
  const unknown = !detection.carrier;
  const reason = loaded?.reason ?? null;

  return (
    <section aria-label="Shipment status" className="border-border bg-card rounded-xl border">
      <div className="border-border border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="ui-eyebrow flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className={`size-1.5 shrink-0 rounded-full ${
                ok
                  ? "bg-green-500"
                  : unavailable || entry?.kind === "error"
                    ? "bg-amber-500"
                    : "bg-muted-foreground"
              }`}
            />
            <span className="truncate">{detection.carrierName ?? "Carrier unknown"}</span>
          </p>
          <span aria-hidden="true" className="text-lg leading-none">
            {emojiForType(parcel.type)}
          </span>
        </div>

        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          {entry?.kind === "loading"
            ? "Checking status…"
            : entry?.kind === "error"
              ? "Status check failed"
              : ok
                ? loaded.status
                : unavailable
                  ? "Live status unavailable"
                  : unknown
                    ? "Carrier unknown"
                    : "No status yet"}
        </h2>
        <p className="text-muted-foreground mt-1 font-mono text-xs break-all">{parcel.number}</p>

        {ok && (loaded.origin || loaded.destination) && (
          <p className="mt-2 text-sm leading-snug">
            {loaded.origin ?? "Origin unknown"}{" "}
            <span aria-hidden="true" className="text-muted-foreground">
              →
            </span>{" "}
            {loaded.destination ?? "Destination unknown"}
          </p>
        )}
      </div>

      <div className="space-y-4 p-4">
        {unknown && !entry && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {REASON_COPY["unknown-carrier"]}
          </p>
        )}

        {entry?.kind === "loading" && (
          <p className="text-muted-foreground text-sm">Asking {detection.carrierName}…</p>
        )}

        {entry?.kind === "error" && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            This app could not reach its status service. No status is shown.
          </p>
        )}

        {unavailable && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {REASON_COPY[reason ?? ""] ?? "No readable status was returned."}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              No status was invented — open the carrier&apos;s own page to check.
            </p>
          </div>
        )}

        {ok && (
          <>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="ui-eyebrow">Estimated delivery</dt>
                <dd className="mt-1 text-sm">
                  {loaded.estimatedDelivery
                    ? loaded.estimatedDelivery
                    : loaded.estimatedDeliveryAt
                      ? formatDateTime(loaded.estimatedDeliveryAt)
                      : "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="ui-eyebrow">Collected</dt>
                <dd className="mt-1 text-sm">{formatDateTime(loaded.collectedAt)}</dd>
              </div>
              <div>
                <dt className="ui-eyebrow">Carrier</dt>
                <dd className="mt-1 text-sm">{loaded.carrierName}</dd>
              </div>
              <div>
                <dt className="ui-eyebrow">Marker</dt>
                <dd className="mt-1 text-sm">
                  {emojiForType(parcel.type)}{" "}
                  {PARCEL_TYPES.find((type) => type.id === parcel.type)?.label}
                </dd>
              </div>
            </dl>

            <div>
              <p className="ui-eyebrow mb-2">
                {loaded.events.length === 0 ? "Latest scan" : `Scans · ${loaded.events.length}`}
              </p>
              {loaded.events.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  The carrier returned a status but no scan history.
                </p>
              ) : (
                <ol className="space-y-2.5">
                  {loaded.events.slice(0, 8).map((event, index) => (
                    <li key={`${event.at ?? "scan"}-${index}`} className="text-sm leading-snug">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0">{event.text}</span>
                        <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                          {formatDateTime(event.at)}
                        </span>
                      </div>
                      {event.place && (
                        <p className="text-muted-foreground mt-0.5 text-[11px]">{event.place}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {detection.trackingUrl && (
            <a
              href={detection.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground text-sm font-medium underline decoration-1 underline-offset-4 hover:opacity-80"
            >
              Track on {detection.carrierName} ↗
            </a>
          )}
          {detection.carrier && (
            <button
              type="button"
              onClick={onRefresh}
              className="border-border text-muted-foreground hover:text-foreground rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              Refresh status
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function SavedList({
  parcels,
  selectedId,
  hydrated,
  onSelect,
  onRemove,
  onTypeChange,
}: {
  parcels: SavedParcel[];
  selectedId: string | null;
  hydrated: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onTypeChange: (id: string, type: ParcelType) => void;
}) {
  return (
    <section
      aria-label="Saved tracking numbers"
      className="border-border bg-card rounded-xl border"
    >
      <div className="border-border flex items-baseline justify-between border-b px-4 py-3">
        <h2 className="ui-eyebrow">Saved · {parcels.length}</h2>
        <span className="text-muted-foreground font-mono text-[10px]">localStorage</span>
      </div>

      {!hydrated ? (
        <p className="text-muted-foreground p-4 text-sm">Loading saved numbers…</p>
      ) : parcels.length === 0 ? (
        <p className="text-muted-foreground p-4 text-sm leading-relaxed">
          Nothing saved yet. Add a tracking number above.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {parcels.map((parcel) => {
            const detection = detectCarrier(parcel.number);
            const active = parcel.id === selectedId;
            return (
              <li
                key={parcel.id}
                className={`flex items-center gap-2 px-2 py-2 ${active ? "bg-muted/60" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(parcel.id)}
                  aria-pressed={active}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-1 text-left"
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    {emojiForType(parcel.type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs">{parcel.number}</span>
                    <span className="text-muted-foreground block truncate text-[11px]">
                      {detection.carrierName ?? "Carrier unknown"}
                    </span>
                  </span>
                </button>

                <select
                  value={parcel.type}
                  onChange={(event) => onTypeChange(parcel.id, event.target.value as ParcelType)}
                  aria-label={`Marker type for ${parcel.number}`}
                  className="bg-background border-border text-muted-foreground focus:border-ring max-w-32 rounded-md border px-1.5 py-1 text-[11px] focus:outline-none"
                >
                  {PARCEL_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {TYPE_EMOJI[type.id]} {type.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => onRemove(parcel.id)}
                  aria-label={`Remove ${parcel.number}`}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted grid size-7 shrink-0 place-items-center rounded-md transition-colors"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
