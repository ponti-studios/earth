import { boolean, integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";

export const tflCameras = pgTable("tfl_cameras", {
  id: serial("id").primaryKey(),
  tflId: text("tfl_id").notNull().unique(),
  commonName: text("common_name").notNull(),
  available: boolean("available"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  view: text("view"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TflCamera = typeof tflCameras.$inferSelect;
export type NewTflCamera = typeof tflCameras.$inferInsert;

// TfL rail stations (tube, Elizabeth line, Overground, DLR) seeded from
// the TfL Unified API (`/StopPoint/Mode/...`, station-level stop types
// only). Markers for the trains layer; live arrivals are fetched on demand
// and never stored.
export const tflStations = pgTable("tfl_stations", {
  id: serial("id").primaryKey(),
  tflId: text("tfl_id").notNull().unique(),
  commonName: text("common_name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  modes: text("modes").notNull().default(""),
  lines: text("lines").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TflStation = typeof tflStations.$inferSelect;
export type NewTflStation = typeof tflStations.$inferInsert;

// Ported from geo (Swift geokit-review): SQLite `places` -> Postgres.
// Review workflow: needs_review | ok | no_match | not_a_place | null (unknown).
export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  placeType: text("place_type"),
  url: text("url"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  formattedAddress: text("formatted_address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  countryCode: text("country_code"),
  geocodedAt: timestamp("geocoded_at"),
  metadata: text("metadata"),
  reviewStatus: text("review_status"),
  reviewReason: text("review_reason"),
  reviewQuery: text("review_query"),
  reviewUpdatedAt: timestamp("review_updated_at"),
  reviewDecisionAt: timestamp("review_decision_at"),
  reviewDecisionSource: text("review_decision_source"),
  lastGeocodeStatus: text("last_geocode_status"),
  lastGeocodeQuery: text("last_geocode_query"),
  lastGeocodeResultSummary: text("last_geocode_result_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;

export const placeGeocodeAttempts = pgTable("place_geocode_attempts", {
  id: serial("id").primaryKey(),
  placeId: integer("place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  status: text("status").notNull(),
  resultSummary: text("result_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PlaceGeocodeAttempt = typeof placeGeocodeAttempts.$inferSelect;
export type NewPlaceGeocodeAttempt = typeof placeGeocodeAttempts.$inferInsert;
