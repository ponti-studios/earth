import type { FeatureCollection, LineString, Point } from "geojson";

export type Airport = {
  lat: number;
  lon: number;
  name: string;
  city: string;
  country: string;
};

export type LegMode = "air" | "rail";

export type RawLeg = {
  id: string;
  date: string;
  mode: LegMode;
  from: string;
  to: string;
  carrier: string;
  number: string;
  journey: string;
  notes: string;
  km: number;
  journey_name: string;
};

export type Journey = {
  name: string;
  start: string;
  end: string;
};

export type FlightStats = {
  legs: number;
  total_km: number;
  total_miles: number;
  airports: number;
  countries: string[];
  span: [string, string];
};

export type FlightsData = {
  airports: Record<string, Airport>;
  legs: RawLeg[];
  journeys: Record<string, Journey>;
  stats: FlightStats;
};

export type FlightLeg = RawLeg & {
  index: number;
  year: number;
  color: string;
  /** Great-circle path, longitudes unwrapped so Pacific routes stay continuous. */
  coords: [number, number][];
};

export type LegProperties = {
  id: string;
  idx: number;
  color: string;
  mode: LegMode;
};

export type HubProperties = {
  code: string;
  count: number;
};

/**
 * Year palette carried over from the original travel map. These are data, not
 * theme tokens: a leg's colour encodes its year everywhere it appears.
 */
export const YEAR_COLORS: Record<number, string> = {
  2016: "#54778a",
  2017: "#4b8b91",
  2018: "#49a09a",
  2019: "#4ab69a",
  2020: "#70c58e",
  2021: "#8cc983",
  2022: "#a8cb78",
  2023: "#d8ca67",
  2024: "#efad5e",
  2025: "#f89a58",
  2026: "#ff7652",
};

const FALLBACK_YEAR_COLOR = "#9fb3aa";
const GREAT_CIRCLE_STEPS = 96;

export function yearColor(year: number): string {
  return YEAR_COLORS[year] ?? FALLBACK_YEAR_COLOR;
}

function toCartesian(lat: number, lon: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
}

/**
 * Great-circle interpolation between two airports. Each successive longitude
 * is unwrapped to the nearest equivalent, so a route like LAX → SYD is one
 * continuous line over the Pacific instead of a segment chopped at the
 * antimeridian.
 */
export function greatCircle(
  from: Airport,
  to: Airport,
  steps = GREAT_CIRCLE_STEPS,
): [number, number][] {
  const a = toCartesian(from.lat, from.lon);
  const b = toCartesian(to.lat, to.lon);
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);
  const out: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wa = sinOmega < 1e-8 ? 1 - t : Math.sin((1 - t) * omega) / sinOmega;
    const wb = sinOmega < 1e-8 ? t : Math.sin(t * omega) / sinOmega;
    const x = wa * a[0] + wb * b[0];
    const y = wa * a[1] + wb * b[1];
    const z = wa * a[2] + wb * b[2];
    let lon = (Math.atan2(y, x) * 180) / Math.PI;
    const lat = (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI;
    const previous = out[i - 1]?.[0];
    if (previous != null) {
      while (lon - previous > 180) lon -= 360;
      while (lon - previous < -180) lon += 360;
    }
    out.push([lon, lat]);
  }

  return out;
}

export function buildLegs(data: FlightsData): FlightLeg[] {
  return data.legs.map((leg, index) => {
    const year = Number(leg.date.slice(0, 4));
    const from = data.airports[leg.from];
    const to = data.airports[leg.to];
    if (!from || !to) {
      throw new Error(`Leg ${leg.id} references an unknown airport`);
    }
    return {
      ...leg,
      index,
      year,
      color: yearColor(year),
      coords: greatCircle(from, to),
    };
  });
}

export function flightYears(legs: readonly FlightLeg[]): number[] {
  return [...new Set(legs.map((leg) => leg.year))].sort((a, b) => a - b);
}

/**
 * Parse the `years` search param. An absent or unusable value means "all
 * years"; a comma list is accepted so shared URLs can carry a subset.
 */
export function parseYears(param: string | null | undefined, years: readonly number[]): number[] {
  if (!param) return [...years];
  const allowed = new Set(years);
  const picked = param
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((year) => Number.isInteger(year) && allowed.has(year));
  return picked.length > 0 ? [...new Set(picked)].sort((a, b) => a - b) : [...years];
}

export function serializeYears(
  years: readonly number[],
  allYears: readonly number[],
): string | null {
  if (years.length === allYears.length) return null;
  return years.join(",");
}

export function visibleLegs(legs: readonly FlightLeg[], years: readonly number[]): FlightLeg[] {
  const selected = new Set(years);
  return legs.filter((leg) => selected.has(leg.year));
}

export function miles(km: number): number {
  return Math.round(km * 0.621371);
}

export function formatMiles(km: number): string {
  return miles(km).toLocaleString("en-GB");
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatSpan(span: [string, string]): string {
  return `${span[0].slice(0, 4)}—${span[1].slice(0, 4)}`;
}

export function legsToGeoJSON(
  legs: readonly FlightLeg[],
): FeatureCollection<LineString, LegProperties> {
  return {
    type: "FeatureCollection",
    features: legs.map((leg) => ({
      type: "Feature",
      geometry: { type: "LineString", coordinates: leg.coords },
      properties: { id: leg.id, idx: leg.index, color: leg.color, mode: leg.mode },
    })),
  };
}

/**
 * Hubs are airports touched by the current legs; radius and label are driven
 * by how many legs pass through, matching the original map.
 */
export function hubsToGeoJSON(
  legs: readonly FlightLeg[],
  airports: Record<string, Airport>,
): FeatureCollection<Point, HubProperties> {
  const counts = new Map<string, number>();
  for (const leg of legs) {
    counts.set(leg.from, (counts.get(leg.from) ?? 0) + 1);
    counts.set(leg.to, (counts.get(leg.to) ?? 0) + 1);
  }

  return {
    type: "FeatureCollection",
    features: [...counts.entries()]
      .filter(([code]) => airports[code] != null)
      .map(([code, count]) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [airports[code].lon, airports[code].lat],
        },
        properties: { code, count },
      })),
  };
}
