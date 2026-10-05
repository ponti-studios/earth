import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { placeGeocodeAttempts, places } from "~/db";
import { geocodePreview, type GeocodeResult } from "./geocode";

export const ReviewStatusSchema = z.enum(["needs_review", "ok", "no_match", "not_a_place"]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const PlaceFilterSchema = z.enum(["all", "needs_review", "ok", "no_match", "not_a_place", "unknown"]);
export type PlaceFilter = z.infer<typeof PlaceFilterSchema>;

const PLACE_ORDER = sql`
  CASE ${places.reviewStatus}
    WHEN 'needs_review' THEN 0
    WHEN 'no_match' THEN 1
    WHEN 'not_a_place' THEN 2
    WHEN NULL THEN 3
    ELSE 4
  END, ${places.id} ASC`;

function statusPredicate(filter: PlaceFilter) {
  switch (filter) {
    case "all":
      return undefined;
    case "unknown":
      return or(eq(places.reviewStatus, ""), sql`${places.reviewStatus} IS NULL`);
    default:
      return eq(places.reviewStatus, filter);
  }
}

function searchPredicate(search: string) {
  // Tokenized AND: every word must appear *somewhere* across the fields,
  // so "Hoxton Shoreditch" matches "The Hoxton, …, Shoreditch, …".
  const tokens = search.trim().split(/\s+/).filter((t) => t.length > 0).slice(0, 8);
  if (tokens.length === 0) return undefined;
  return and(
    ...tokens.map((token) => {
      const like = `%${escapeLike(token)}%`;
      return or(
        ilike(places.name, like),
        ilike(places.reviewQuery, like),
        ilike(places.formattedAddress, like),
        ilike(places.city, like),
        ilike(places.country, like),
      );
    }),
  );
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export async function listPlaces(options: { filter?: PlaceFilter; search?: string; limit?: number } = {}) {
  const { filter = "all", search = "", limit = 200 } = options;
  const conditions = [statusPredicate(filter), searchPredicate(search)].filter(Boolean);
  const rows = await db
    .select()
    .from(places)
    .where(conditions.length > 0 ? and(...conditions!) : undefined)
    .orderBy(PLACE_ORDER)
    .limit(Math.min(limit, 500));
  const [{ value: total }] = await db.select({ value: count() }).from(places);
  const [{ value: needReview }] = await db
    .select({ value: count() })
    .from(places)
    .where(eq(places.reviewStatus, "needs_review"));
  return { places: rows, total, needReview };
}

export async function getPlace(id: number) {
  const rows = await db.select().from(places).where(eq(places.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getPlaceAttempts(placeId: number, limit = 20) {
  return db
    .select()
    .from(placeGeocodeAttempts)
    .where(eq(placeGeocodeAttempts.placeId, placeId))
    .orderBy(desc(placeGeocodeAttempts.id))
    .limit(limit);
}

export async function saveReviewQuery(placeId: number, reviewQuery: string) {
  const trimmed = reviewQuery.trim();
  if (!trimmed) throw new Error("review query cannot be blank");
  await db
    .update(places)
    .set({ reviewQuery: trimmed, reviewUpdatedAt: new Date(), updatedAt: new Date() })
    .where(eq(places.id, placeId));
}

export async function renamePlace(placeId: number, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("name cannot be blank");
  if (trimmed.length > 200) throw new Error("name is too long");
  await db
    .update(places)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(places.id, placeId));
}

export async function deletePlace(placeId: number) {
  await db.delete(placeGeocodeAttempts).where(eq(placeGeocodeAttempts.placeId, placeId));
  await db.delete(places).where(eq(places.id, placeId));
}

export async function acceptGeocodeResult(placeId: number, query: string, result: GeocodeResult) {
  await db
    .update(places)
    .set({
      latitude: result.latitude,
      longitude: result.longitude,
      formattedAddress: result.formattedAddress ?? result.displayTitle,
      city: result.city ?? null,
      state: result.state ?? null,
      postalCode: result.postalCode ?? null,
      country: result.country ?? null,
      countryCode: result.countryCode ?? null,
      geocodedAt: new Date(),
      reviewStatus: "ok",
      reviewDecisionAt: new Date(),
      reviewDecisionSource: "web-geocoder",
      lastGeocodeStatus: "ok",
      lastGeocodeQuery: query,
      lastGeocodeResultSummary: result.displayTitle,
      updatedAt: new Date(),
    })
    .where(eq(places.id, placeId));
  await db.insert(placeGeocodeAttempts).values({
    placeId,
    query,
    status: "accepted",
    resultSummary: result.displayTitle,
  });
}

export async function markNotAPlace(placeId: number, query: string) {
  await db
    .update(places)
    .set({
      reviewStatus: "not_a_place",
      reviewDecisionAt: new Date(),
      reviewDecisionSource: "web-review",
      lastGeocodeStatus: "not_a_place",
      lastGeocodeQuery: query,
      updatedAt: new Date(),
    })
    .where(eq(places.id, placeId));
  await db.insert(placeGeocodeAttempts).values({ placeId, query, status: "not_a_place" });
}

export async function retryGeocode(placeId: number, query: string, limit = 5) {
  const preview = await geocodePreview(query, limit);
  await db
    .update(places)
    .set({
      lastGeocodeStatus: preview.resultCount > 0 ? "preview" : "no_match",
      lastGeocodeQuery: query,
      lastGeocodeResultSummary:
        preview.results[0]?.displayTitle ?? "No matches found for this query.",
      reviewStatus: sql`COALESCE(${places.reviewStatus}, 'needs_review')`,
      updatedAt: new Date(),
    })
    .where(eq(places.id, placeId));
  await db.insert(placeGeocodeAttempts).values({
    placeId,
    query,
    status: preview.resultCount > 0 ? "preview" : "no_match",
    resultSummary: preview.results[0]?.displayTitle ?? "no results",
  });
  return preview;
}

export type CreatePlaceInput = {
  name: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
};

// Save a place straight from search: coordinates are known, so it lands
// on the map as resolved (decision source "web-search").
export async function createPlace(input: CreatePlaceInput) {
  const name = input.name.trim();
  if (!name) throw new Error("name cannot be blank");
  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    throw new Error("invalid coordinates");
  }

  const existing = await db.select().from(places).where(eq(places.name, name)).limit(1);
  if (existing[0]) return existing[0];

  const rows = await db
    .insert(places)
    .values({
      name,
      latitude: input.latitude,
      longitude: input.longitude,
      formattedAddress: input.formattedAddress ?? name,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      countryCode: input.countryCode,
      geocodedAt: new Date(),
      reviewStatus: "ok",
      reviewDecisionAt: new Date(),
      reviewDecisionSource: "web-search",
      lastGeocodeStatus: "ok",
      lastGeocodeQuery: name,
      lastGeocodeResultSummary: input.formattedAddress ?? name,
    })
    .returning();
  const created = rows[0];
  if (!created) throw new Error("failed to save place");
  return created;
}
