import { z } from "zod";

// Live TfL data: arrivals per station and line statuses. Nothing here is
// persisted — responses are cached in memory for a few seconds to stay
// well under TfL rate limits. Optional TFL_APP_ID / TFL_APP_KEY env vars
// raise the quota; without them the anonymous limits apply.

const TFL_API_BASE = "https://api.tfl.gov.uk";

export const ArrivalSchema = z.object({
  stationId: z.string(),
  lineId: z.string(),
  lineName: z.string(),
  destinationName: z.string(),
  platformName: z.string(),
  expectedArrival: z.string(),
  timeToStation: z.number(),
  currentLocation: z.string(),
});

export type Arrival = z.infer<typeof ArrivalSchema>;

export const LineStatusSchema = z.object({
  lineId: z.string(),
  lineName: z.string(),
  severity: z.string(),
  severityLevel: z.number(),
  isDisrupted: z.boolean(),
  reason: z.string(),
});

export type LineStatus = z.infer<typeof LineStatusSchema>;

// Severity levels below 10 mean Good Service in the TfL model.
const GOOD_SERVICE_LEVEL = 10;

const ARRIVAL_TTL_MS = 25_000;
const STATUS_TTL_MS = 60_000;
const MAX_ARRIVALS = 12;

type CacheEntry<T> = { expiresAt: number; value: T };

const arrivalsCache = new Map<string, CacheEntry<Arrival[]>>();
let statusCache: CacheEntry<LineStatus[]> | null = null;

function tflParams(): string {
  const params = new URLSearchParams();
  const appId = process.env.TFL_APP_ID;
  const appKey = process.env.TFL_APP_KEY;
  if (appId) params.set("app_id", appId);
  if (appKey) params.set("app_key", appKey);
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function fetchTfl(path: string): Promise<unknown> {
  const response = await fetch(`${TFL_API_BASE}${path}${tflParams()}`, {
    headers: { "User-Agent": "ponti-earth/0.1" },
  });
  if (!response.ok) {
    throw new Error(`TfL API returned ${response.status} for ${path}`);
  }
  return response.json() as Promise<unknown>;
}

const RawArrivalSchema = z.object({
  stationId: z.string().optional().default(""),
  lineId: z.string(),
  lineName: z.string(),
  destinationName: z.string(),
  platformName: z.string().optional().default(""),
  expectedArrival: z.string(),
  timeToStation: z.number(),
  currentLocation: z.string().optional().default(""),
});

export async function getArrivals(stationId: string): Promise<Arrival[]> {
  const id = stationId.trim();
  if (!id) throw new Error("station id is required");
  const cached = arrivalsCache.get(id);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const raw = RawArrivalSchema.array().parse(await fetchTfl(`/StopPoint/${encodeURIComponent(id)}/Arrivals`));
  const arrivals = raw
    .map((a) => ArrivalSchema.parse({ ...a, stationId: a.stationId || id }))
    .sort((a, b) => a.timeToStation - b.timeToStation)
    .slice(0, MAX_ARRIVALS);

  arrivalsCache.set(id, { expiresAt: Date.now() + ARRIVAL_TTL_MS, value: arrivals });
  return arrivals;
}

const RawLineStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  lineStatuses: z
    .array(
      z.object({
        statusSeverity: z.number(),
        statusSeverityDescription: z.string(),
        reason: z.string().optional().default(""),
      }),
    )
    .min(1),
});

export async function getLineStatuses(): Promise<LineStatus[]> {
  if (statusCache && statusCache.expiresAt > Date.now()) return statusCache.value;

  const raw = RawLineStatusSchema.array().parse(
    await fetchTfl("/Line/Mode/tube,elizabeth-line,overground,dlr/Status?detail=true"),
  );
  const statuses = raw.map((line) => {
    const worst = line.lineStatuses.reduce((a, b) => (a.statusSeverity < b.statusSeverity ? a : b));
    return LineStatusSchema.parse({
      lineId: line.id,
      lineName: line.name,
      severity: worst.statusSeverityDescription,
      severityLevel: worst.statusSeverity,
      isDisrupted: worst.statusSeverity < GOOD_SERVICE_LEVEL,
      reason: worst.reason,
    });
  });

  statusCache = { expiresAt: Date.now() + STATUS_TTL_MS, value: statuses };
  return statuses;
}
