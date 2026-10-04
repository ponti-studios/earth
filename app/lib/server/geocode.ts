import { z } from "zod";

// Web-deployable replacement for geo's Apple MKLocalSearch geocoder.
// geo used MKLocalSearch which only runs on Apple platforms — it cannot
// run on Railway/Linux. Default provider is Nominatim (OpenStreetMap,
// no API key). Swap `geocodePreview` internals for Mapbox / Apple Maps
// Server API later without changing callers.

export const GeocodeResultSchema = z.object({
  displayTitle: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  formattedAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  category: z.string().optional(),
});

export type GeocodeResult = z.infer<typeof GeocodeResultSchema>;

export const GeocodePreviewSchema = z.object({
  query: z.string(),
  requestedLimit: z.number(),
  resultCount: z.number(),
  results: z.array(GeocodeResultSchema),
});

export type GeocodePreview = z.infer<typeof GeocodePreviewSchema>;

const NominatimItemSchema = z.object({
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
  type: z.string().optional(),
  class: z.string().optional(),
  address: z
    .object({
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      state: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().optional(),
      country_code: z.string().optional(),
    })
    .optional(),
});

function toResult(item: z.infer<typeof NominatimItemSchema>): GeocodeResult {
  const a = item.address;
  return {
    displayTitle: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    formattedAddress: item.display_name,
    city: a?.city ?? a?.town ?? a?.village,
    state: a?.state,
    postalCode: a?.postcode,
    country: a?.country,
    countryCode: a?.country_code,
    category: item.type ?? item.class,
  };
}

export async function geocodePreview(query: string, limit = 5): Promise<GeocodePreview> {
  const q = query.trim();
  if (!q) throw new Error("query cannot be blank");
  const clamped = Math.min(Math.max(limit, 1), 10);

  // Nominatim often returns zero results for multi-token queries like
  // "The Hoxton Shoreditch" even though "The Hoxton" matches. Fall back
  // by dropping trailing tokens until something matches, then soft-rank:
  // results containing every significant token come first, but nothing is
  // dropped (a hard filter would lose "Tour Eiffel" for "Eiffel Tower").
  let attempt = q;
  let results: GeocodeResult[] = [];
  while (results.length === 0 && attempt.includes(" ")) {
    results = await nominatimSearch(attempt, clamped);
    if (results.length === 0) attempt = attempt.slice(0, attempt.lastIndexOf(" "));
  }
  if (results.length === 0) results = await nominatimSearch(attempt, clamped);

  const significant = q
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 3);
  const matchesAll = (r: GeocodeResult) => {
    const haystack = r.displayTitle.toLowerCase();
    return significant.every((token) => haystack.includes(token));
  };
  const final = [...results.filter(matchesAll), ...results.filter((r) => !matchesAll(r))].slice(
    0,
    clamped,
  );
  return { query: q, requestedLimit: clamped, resultCount: final.length, results: final };
}

async function nominatimSearch(query: string, limit: number): Promise<GeocodeResult[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      limit: String(limit),
    });

  const res = await fetch(url, {
    headers: {
      // Nominatim usage policy requires a referrer / user-agent.
      "User-Agent": "earth-app/1.0 (places geocoder)",
      Referer: "https://earth-app.local/",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`geocoder error: ${res.status}`);
  const raw = NominatimItemSchema.array().parse(await res.json());
  return raw
    .map(toResult)
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
}
