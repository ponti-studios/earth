// Parcel tracking domain logic. This module is isomorphic: the detector,
// persistence helpers and map maths run in the browser, while the server
// status route reuses the same carrier table. One number must never resolve
// to two different carriers.

export type ParcelType = "flight" | "moving" | "parcel" | "clothing" | "food" | "car";

export const PARCEL_TYPES: { id: ParcelType; label: string }[] = [
  { id: "parcel", label: "Parcel" },
  { id: "moving", label: "Moving" },
  { id: "flight", label: "Flight" },
  { id: "clothing", label: "Clothing" },
  { id: "food", label: "Food" },
  { id: "car", label: "Car" },
];

// The standalone tracker's type→emoji system, carried over as data.
export const TYPE_EMOJI: Record<ParcelType, string> = {
  flight: "✈️",
  moving: "🚚",
  parcel: "📦",
  clothing: "👕",
  food: "🍔",
  car: "🚗",
};

export const FALLBACK_EMOJI = "📍";

export function emojiForType(type: string | null | undefined): string {
  return TYPE_EMOJI[type as ParcelType] ?? FALLBACK_EMOJI;
}

export type CarrierId = "dhl" | "ups" | "royal-mail" | "fedex" | "usps" | "evri";

export const CARRIER_INFO: Record<
  CarrierId,
  { name: string; trackingUrl: (number: string) => string }
> = {
  dhl: {
    name: "DHL Express",
    trackingUrl: (number) =>
      `https://www.dhl.com/gb-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(number)}`,
  },
  ups: {
    name: "UPS",
    trackingUrl: (number) => `https://www.ups.com/track?tracknum=${encodeURIComponent(number)}`,
  },
  "royal-mail": {
    name: "Royal Mail",
    trackingUrl: (number) =>
      `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(number)}`,
  },
  fedex: {
    name: "FedEx",
    trackingUrl: (number) =>
      `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(number)}`,
  },
  usps: {
    name: "USPS",
    trackingUrl: (number) =>
      `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(number)}`,
  },
  evri: {
    name: "Evri",
    trackingUrl: (number) => `https://www.evri.com/track/parcel/${encodeURIComponent(number)}`,
  },
};

type DetectionRule = {
  carrier: CarrierId;
  format: RegExp;
  formatLabel: string;
};

// Detector precedence, first match wins. Keep this list ordered and explicit:
// formats overlap in the wild (a 16-digit number is Evri here, not USPS; a
// 10-digit number is DHL, not a short FedEx reference), so adding a new rule
// must not silently steal numbers from an existing one.
//
//  1. DHL JJD         JJD + at least 10 digits (e.g. JJD014600012894607109)
//  2. UPS             1Z + 16 alphanumeric
//  3. Royal Mail      2 letters + 9 digits + GB
//  4. USPS            20–22 digits, including the 94-prefixed IMpb range
//  5. Evri            exactly 16 digits
//  6. FedEx           12 or 15 digits
//  7. DHL Express     exactly 10 digits
const DETECTION_RULES: DetectionRule[] = [
  { carrier: "dhl", format: /^JJD\d{10,}$/, formatLabel: "JJD + 10+ digits" },
  { carrier: "ups", format: /^1Z[0-9A-Z]{16}$/, formatLabel: "1Z + 16 alphanumeric" },
  { carrier: "royal-mail", format: /^[A-Z]{2}\d{9}GB$/, formatLabel: "2 letters + 9 digits + GB" },
  { carrier: "usps", format: /^\d{20,22}$/, formatLabel: "20–22 digits" },
  { carrier: "evri", format: /^\d{16}$/, formatLabel: "16 digits" },
  { carrier: "fedex", format: /^\d{12}$|^\d{15}$/, formatLabel: "12 or 15 digits" },
  { carrier: "dhl", format: /^\d{10}$/, formatLabel: "10 digits" },
];

export function normaliseTrackingNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

export type Detection = {
  number: string;
  carrier: CarrierId | null;
  carrierName: string | null;
  trackingUrl: string | null;
  formatLabel: string | null;
};

export function detectCarrier(raw: string): Detection {
  const number = normaliseTrackingNumber(raw);
  for (const rule of DETECTION_RULES) {
    if (!rule.format.test(number)) continue;
    const info = CARRIER_INFO[rule.carrier];
    return {
      number,
      carrier: rule.carrier,
      carrierName: info.name,
      trackingUrl: info.trackingUrl(number),
      formatLabel: rule.formatLabel,
    };
  }
  return { number, carrier: null, carrierName: null, trackingUrl: null, formatLabel: null };
}

export function shouldFetchStatus(raw: string): boolean {
  return detectCarrier(raw).carrier !== null;
}

export type ParcelEvent = {
  text: string;
  at: string | null;
  place: string | null;
};

export type ParcelStatusUnavailableReason =
  | "unknown-carrier"
  | "blocked"
  | "unreachable"
  | "unparseable";

export type ParcelStatusResult = {
  state: "ok" | "unavailable";
  number: string;
  carrier: CarrierId | null;
  carrierName: string | null;
  trackingUrl: string | null;
  reason: ParcelStatusUnavailableReason | null;
  status: string | null;
  events: ParcelEvent[];
  origin: string | null;
  destination: string | null;
  estimatedDelivery: string | null;
  estimatedDeliveryAt: string | null;
  collectedAt: string | null;
  fetchedAt: string;
};

// ---------------------------------------------------------------------------
// localStorage persistence. No backend, no account: the browser owns the list.
// ---------------------------------------------------------------------------

export const PARCELS_STORAGE_KEY = "earth.parcels.v1";

export type SavedParcel = {
  id: string;
  number: string;
  type: ParcelType;
  addedAt: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function isParcelType(value: unknown): value is ParcelType {
  return PARCEL_TYPES.some((type) => type.id === value);
}

function createParcelId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
  return `parcel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createParcel(number: string, type: ParcelType = "parcel"): SavedParcel {
  return {
    id: createParcelId(),
    number: normaliseTrackingNumber(number),
    type,
    addedAt: new Date().toISOString(),
  };
}

export function loadParcels(storage: StorageLike | null = browserStorage()): SavedParcel[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(PARCELS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value) => {
      if (typeof value !== "object" || value === null) return [];
      const record = value as Record<string, unknown>;
      const number =
        typeof record.number === "string" ? normaliseTrackingNumber(record.number) : "";
      if (!number) return [];
      return [
        {
          id: typeof record.id === "string" && record.id ? record.id : createParcelId(),
          number,
          type: isParcelType(record.type) ? record.type : "parcel",
          addedAt: typeof record.addedAt === "string" ? record.addedAt : new Date().toISOString(),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function saveParcels(
  parcels: SavedParcel[],
  storage: StorageLike | null = browserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(PARCELS_STORAGE_KEY, JSON.stringify(parcels));
  } catch {
    // Private mode or a full quota: the list stays in memory for this visit.
  }
}

export function addParcel(
  parcels: SavedParcel[],
  number: string,
  type: ParcelType = "parcel",
): SavedParcel[] {
  const normalised = normaliseTrackingNumber(number);
  if (!normalised) return parcels;
  if (parcels.some((parcel) => parcel.number === normalised)) return parcels;
  return [...parcels, createParcel(normalised, type)];
}

export function removeParcel(parcels: SavedParcel[], id: string): SavedParcel[] {
  return parcels.filter((parcel) => parcel.id !== id);
}

// ---------------------------------------------------------------------------
// Map maths and the standalone tracker's marker behaviour.
// ---------------------------------------------------------------------------

export type Coordinates = { lat: number; lon: number };
/** GeoJSON order: [longitude, latitude]. */
export type GeoPoint = [number, number];

export const CITY_COORDS: Record<string, Coordinates> = {
  "Los Angeles": { lat: 34.0522, lon: -118.2437 },
  Cincinnati: { lat: 39.05699, lon: -84.65962 },
  "East Midlands": { lat: 52.8311, lon: -1.3281 },
  London: { lat: 51.498, lon: -0.0779 },
};

const CITY_ALIASES: Record<string, string> = {
  "LOS ANGELES GATEWAY": "Los Angeles",
  "LOS ANGELES": "Los Angeles",
  CINCINNATI: "Cincinnati",
  "EAST MIDLANDS": "East Midlands",
  LONDON: "London",
  HEATHROW: "London",
};

const CITY_CODE: Record<string, string> = {
  "Los Angeles": "LAX",
  Cincinnati: "CVG",
  "East Midlands": "EMA",
  London: "LHR",
};

export function cityName(place: string | null | undefined): string | null {
  if (!place) return null;
  const bare = String(place).split(/[-,/]/)[0].replace(/\s+/g, " ").trim().toUpperCase();
  if (!bare) return null;
  for (const alias of Object.keys(CITY_ALIASES).sort((a, b) => b.length - a.length)) {
    if (bare.startsWith(alias)) return CITY_ALIASES[alias];
  }
  return String(place).trim();
}

export function cityCoord(place: string | null | undefined): Coordinates | null {
  const name = cityName(place);
  return name ? (CITY_COORDS[name] ?? null) : null;
}

export function cityCode(place: string | null | undefined): string {
  const name = cityName(place);
  return name ? (CITY_CODE[name] ?? "") : "";
}

function toCartesian(point: Coordinates): [number, number, number] {
  const phi = (point.lat * Math.PI) / 180;
  const lambda = (point.lon * Math.PI) / 180;
  return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
}

export function greatCircle(from: Coordinates, to: Coordinates, steps = 96): GeoPoint[] {
  const a = toCartesian(from);
  const b = toCartesian(to);
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const sinO = Math.sin(omega);
  const out: GeoPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wa = sinO < 1e-8 ? 1 - t : Math.sin((1 - t) * omega) / sinO;
    const wb = sinO < 1e-8 ? t : Math.sin(t * omega) / sinO;
    const x = wa * a[0] + wb * b[0];
    const y = wa * a[1] + wb * b[1];
    const z = wa * a[2] + wb * b[2];
    let lon = (Math.atan2(y, x) * 180) / Math.PI;
    const lat = (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI;
    if (i) {
      const previous = out[i - 1][0];
      while (lon - previous > 180) lon -= 360;
      while (lon - previous < -180) lon += 360;
    }
    out.push([lon, lat]);
  }
  return out;
}

export function pointAt(coords: GeoPoint[], fraction: number): GeoPoint {
  const n = coords.length - 1;
  const x = Math.min(Math.max(fraction, 0), 1) * n;
  const i = Math.min(Math.floor(x), Math.max(n - 1, 0));
  const t = x - i;
  const next = coords[Math.min(i + 1, n)];
  const current = coords[i];
  return [current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t];
}

export function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// The clock only fills the gaps: 5% at collection, 97% at the estimate.
export function routeFraction(options: {
  collectedAt?: string | null;
  estimatedAt?: string | null;
  now?: number;
  delivered?: boolean;
}): number {
  if (options.delivered) return 1;
  const start = toTimestamp(options.collectedAt);
  const end = toTimestamp(options.estimatedAt);
  const now = options.now ?? Date.now();
  if (start === null || end === null || end <= start) return 0.05;
  if (now <= start) return 0.05;
  if (now >= end) return 0.97;
  return 0.05 + ((now - start) / (end - start)) * (0.97 - 0.05);
}

export function isDelivered(status: string | null | undefined): boolean {
  return typeof status === "string" && /delivered/i.test(status);
}

// A named-city scan wins over the clock — the marker jumps to the scan.
export function markerPosition(
  route: GeoPoint[],
  events: ParcelEvent[],
  options: {
    collectedAt?: string | null;
    estimatedAt?: string | null;
    now?: number;
    delivered?: boolean;
  } = {},
): GeoPoint | null {
  if (route.length === 0) return null;
  if (options.delivered) return route[route.length - 1];
  for (const event of events) {
    const coord = cityCoord(event.place);
    if (coord) return [coord.lon, coord.lat];
  }
  return pointAt(route, routeFraction(options));
}
