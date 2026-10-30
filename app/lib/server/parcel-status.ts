import {
  CARRIER_INFO,
  detectCarrier,
  type CarrierId,
  type ParcelEvent,
  type ParcelStatusResult,
  type ParcelStatusUnavailableReason,
} from "~/lib/parcels";

type FetchLike = typeof fetch;

type Candidate = {
  status: string | null;
  events: ParcelEvent[];
  origin: string | null;
  destination: string | null;
  estimatedDelivery: string | null;
  collectedAt: string | null;
};

type FetchOutcome =
  | { kind: "candidate"; candidate: Candidate }
  | { kind: "blocked" }
  | { kind: "unparseable" }
  | { kind: "unreachable" };

const REQUEST_TIMEOUT_MS = 8000;
const BLOCK_STATUSES = new Set([401, 403, 429, 503]);
const CHALLENGE_MARKERS = [
  "access denied",
  "tracking attempt has been blocked",
  "request unsuccessful",
  "captcha",
  "incapsula",
  "akamai reference",
];

const REQUEST_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "accept-language": "en-GB,en;q=0.9",
};

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function nested(value: unknown, ...keys: string[]): unknown {
  let current: unknown = value;
  for (const key of keys) {
    const node = record(current);
    if (!node) return null;
    current = node[key];
  }
  return current;
}

function isChallenge(body: string): boolean {
  const sample = body.slice(0, 5000).toLowerCase();
  return CHALLENGE_MARKERS.some((marker) => sample.includes(marker));
}

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

// Display strings like "30 October 2026 / 02 November 2026" are ranges; the
// latest date in the string is the promised delivery.
export function latestDateIso(raw: string | null): string | null {
  if (!raw) return null;
  const dates: [number, number, number][] = [];
  for (const match of raw.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) {
    dates.push([Number(match[1]), Number(match[2]), Number(match[3])]);
  }
  for (const match of raw.matchAll(/(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{4})/g)) {
    const month = MONTHS[match[2].toLowerCase()];
    if (month) dates.push([Number(match[3]), month, Number(match[1])]);
  }
  for (const match of raw.matchAll(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g)) {
    dates.push([Number(match[3]), Number(match[2]), Number(match[1])]);
  }
  const valid = dates.filter(([year, month, day]) => {
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  });
  if (valid.length === 0) return null;
  valid.sort((a, b) => Date.UTC(a[0], a[1] - 1, a[2]) - Date.UTC(b[0], b[1] - 1, b[2]));
  const [year, month, day] = valid[valid.length - 1];
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59)).toISOString();
}

function sortEvents(events: ParcelEvent[]): ParcelEvent[] {
  return [...events].sort((a, b) => {
    const left = a.at ? Date.parse(a.at) : Number.NaN;
    const right = b.at ? Date.parse(b.at) : Number.NaN;
    if (Number.isNaN(left) && Number.isNaN(right)) return 0;
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    return right - left;
  });
}

function normaliseEvent(value: unknown): ParcelEvent | null {
  const event = record(value);
  if (!event) return null;
  const description =
    text(event.description) ?? text(event.status) ?? text(event.statusText) ?? text(event.text);
  const at = text(event.timestamp) ?? text(event.date) ?? text(event.at);
  const location = record(event.location);
  const address = record(location?.address);
  const place =
    text(address?.addressLocality) ??
    text(location?.name) ??
    text(event.place) ??
    text(address?.countryCode);
  if (!description && !at) return null;
  return { text: description ?? "Scan", at, place };
}

function candidateFrom(partial: Partial<Candidate>): Candidate | null {
  const events = sortEvents(partial.events ?? []);
  const status = text(partial.status) ?? events[0]?.text ?? null;
  if (!status && events.length === 0) return null;
  const timestamps = events
    .map((event) => (event.at ? Date.parse(event.at) : Number.NaN))
    .filter((value) => Number.isFinite(value));
  const collectedAt = partial.collectedAt
    ? partial.collectedAt
    : timestamps.length > 0
      ? new Date(Math.min(...timestamps)).toISOString()
      : null;
  return {
    status,
    events,
    origin: text(partial.origin),
    destination: text(partial.destination),
    estimatedDelivery: text(partial.estimatedDelivery),
    collectedAt,
  };
}

// DHL's own tracking JSON. This is the source of truth for DHL shipments —
// never a reseller/broker page, whose status lags the carrier's.
export function parseDhlJson(body: string): Candidate | null {
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return null;
  }
  const root = record(data);
  if (!root) return null;
  const shipments = Array.isArray(root.shipments) ? root.shipments : null;
  const shipment = shipments ? record(shipments[0]) : record(root.shipment);
  if (!shipment) return null;

  const statusNode = record(shipment.status);
  const events = Array.isArray(shipment.events)
    ? shipment.events.flatMap((event) => normaliseEvent(event) ?? [])
    : [];
  const estimatedDelivery =
    text(shipment.estimatedTimeOfDelivery) ??
    text(shipment.estimatedDelivery) ??
    text(nested(shipment, "delivery", "estimatedDelivery")) ??
    text(shipment.estimatedDeliveryDate);
  const origin =
    text(nested(shipment, "origin", "address", "addressLocality")) ??
    text(nested(shipment, "origin", "name"));
  const destination =
    text(nested(shipment, "destination", "address", "addressLocality")) ??
    text(nested(shipment, "destination", "name"));

  return candidateFrom({
    status: text(statusNode?.description) ?? text(statusNode?.status) ?? text(shipment.status),
    events,
    origin,
    destination,
    estimatedDelivery,
  });
}

// schema.org ParcelDelivery — the one structured shape carrier pages tend to
// expose without JavaScript. Anything else is treated as unparseable.
export function parseJsonLd(body: string): Candidate | null {
  const scripts = body.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const script of scripts) {
    let data: unknown;
    try {
      data = JSON.parse(script[1]);
    } catch {
      continue;
    }
    const nodes = Array.isArray(data) ? data : [data];
    for (const node of nodes) {
      const candidate = candidateFromJsonLd(node);
      if (candidate) return candidate;
    }
  }
  return null;
}

function candidateFromJsonLd(value: unknown): Candidate | null {
  const node = record(value);
  if (!node) return null;
  const type = text(node["@type"]);
  if (type !== "ParcelDelivery" && !node.trackingNumber && !node.deliveryStatus) return null;
  const origin = record(node.originAddress);
  const destination = record(node.destinationAddress);
  const statusValue = node.deliveryStatus;
  return candidateFrom({
    status: text(statusValue) ?? text(record(statusValue)?.name),
    events: [],
    origin: text(origin?.addressLocality) ?? text(origin?.name),
    destination: text(destination?.addressLocality) ?? text(destination?.name),
    estimatedDelivery:
      text(node.expectedArrivalUntil) ??
      text(node.expectedArrivalFrom) ??
      text(node.expectedArrival),
  });
}

async function requestCandidate(
  url: string,
  accept: string,
  parse: (body: string) => Candidate | null,
  fetchImpl: FetchLike,
): Promise<FetchOutcome> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { ...REQUEST_HEADERS, accept },
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { kind: "unreachable" };
  }
  let body: string;
  try {
    body = await response.text();
  } catch {
    return { kind: "unreachable" };
  }
  if (BLOCK_STATUSES.has(response.status) || isChallenge(body)) {
    return { kind: "blocked" };
  }
  if (!response.ok) return { kind: "unparseable" };
  const candidate = parse(body);
  return candidate ? { kind: "candidate", candidate } : { kind: "unparseable" };
}

async function fetchDhl(number: string, fetchImpl: FetchLike): Promise<FetchOutcome> {
  const outcomes: FetchOutcome[] = [];
  outcomes.push(
    await requestCandidate(
      `https://www.dhl.com/utapi?trackingNumber=${encodeURIComponent(number)}&language=en&requiresDocumentInput=false&isFromNewSite=true`,
      "application/json, text/plain, */*",
      parseDhlJson,
      fetchImpl,
    ),
  );
  if (outcomes[0].kind === "candidate") return outcomes[0];

  outcomes.push(
    await requestCandidate(
      CARRIER_INFO.dhl.trackingUrl(number),
      "text/html,application/xhtml+xml",
      (body) => parseDhlJson(body) ?? parseJsonLd(body),
      fetchImpl,
    ),
  );
  const found = outcomes.find((outcome) => outcome.kind === "candidate");
  if (found) return found;
  if (outcomes.some((outcome) => outcome.kind === "blocked")) return { kind: "blocked" };
  if (outcomes.every((outcome) => outcome.kind === "unreachable")) return { kind: "unreachable" };
  return { kind: "unparseable" };
}

async function fetchGeneric(
  carrier: CarrierId,
  number: string,
  fetchImpl: FetchLike,
): Promise<FetchOutcome> {
  return requestCandidate(
    CARRIER_INFO[carrier].trackingUrl(number),
    "text/html,application/xhtml+xml",
    parseJsonLd,
    fetchImpl,
  );
}

function unavailable(
  detection: ReturnType<typeof detectCarrier>,
  reason: ParcelStatusUnavailableReason,
  fetchedAt: string,
): ParcelStatusResult {
  return {
    state: "unavailable",
    number: detection.number,
    carrier: detection.carrier,
    carrierName: detection.carrierName,
    trackingUrl: detection.trackingUrl,
    reason,
    status: null,
    events: [],
    origin: null,
    destination: null,
    estimatedDelivery: null,
    estimatedDeliveryAt: null,
    collectedAt: null,
    fetchedAt,
  };
}

// Best-effort only. A carrier that blocks or returns a page we cannot read
// produces `unavailable` plus its tracking link — never an invented status.
export async function fetchParcelStatus(
  rawNumber: string,
  options: { fetchImpl?: FetchLike; now?: () => Date } = {},
): Promise<ParcelStatusResult> {
  const detection = detectCarrier(rawNumber);
  const fetchedAt = (options.now?.() ?? new Date()).toISOString();
  if (!detection.carrier || !detection.trackingUrl) {
    return unavailable(detection, "unknown-carrier", fetchedAt);
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const outcome =
    detection.carrier === "dhl"
      ? await fetchDhl(detection.number, fetchImpl)
      : await fetchGeneric(detection.carrier, detection.number, fetchImpl);

  if (outcome.kind !== "candidate") {
    return unavailable(detection, outcome.kind, fetchedAt);
  }

  const { candidate } = outcome;
  return {
    state: "ok",
    number: detection.number,
    carrier: detection.carrier,
    carrierName: detection.carrierName,
    trackingUrl: detection.trackingUrl,
    reason: null,
    status: candidate.status,
    events: candidate.events,
    origin: candidate.origin,
    destination: candidate.destination,
    estimatedDelivery: candidate.estimatedDelivery,
    estimatedDeliveryAt: latestDateIso(candidate.estimatedDelivery),
    collectedAt: candidate.collectedAt,
    fetchedAt,
  };
}
