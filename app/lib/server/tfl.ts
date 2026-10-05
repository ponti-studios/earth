import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, tflCameras, tflStations } from "~/db";

// Wire shape kept identical to the old public-data service response
// (available as "true"/"false" strings) so UI components are untouched.
export const TflCameraSchema = z.object({
  tflId: z.string(),
  commonName: z.string(),
  lat: z.number(),
  lng: z.number(),
  available: z.string(),
  imageUrl: z.string(),
  videoUrl: z.string(),
  view: z.string(),
});

export type TflCamera = z.infer<typeof TflCameraSchema>;

function toWire(row: typeof tflCameras.$inferSelect): TflCamera {
  return {
    tflId: row.tflId,
    commonName: row.commonName,
    lat: row.lat,
    lng: row.lng,
    available: row.available === true ? "true" : "false",
    imageUrl: row.imageUrl ?? "",
    videoUrl: row.videoUrl ?? "",
    view: row.view ?? "",
  };
}

export async function listTflCameras(): Promise<TflCamera[]> {
  const rows = await db.select().from(tflCameras);
  return rows.map(toWire);
}

export async function getTflCamera(tflId: string): Promise<TflCamera | null> {
  const rows = await db.select().from(tflCameras).where(eq(tflCameras.tflId, tflId)).limit(1);
  return rows[0] ? toWire(rows[0]) : null;
}

export const StationLineSchema = z.object({ id: z.string(), name: z.string() });

export const TflStationSchema = z.object({
  tflId: z.string(),
  commonName: z.string(),
  lat: z.number(),
  lng: z.number(),
  modes: z.array(z.string()),
  lines: StationLineSchema.array(),
});

export type TflStation = z.infer<typeof TflStationSchema>;

function parseLines(raw: string): { id: string; name: string }[] {
  try {
    return StationLineSchema.array().parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

function stationToWire(row: typeof tflStations.$inferSelect): TflStation {
  return {
    tflId: row.tflId,
    commonName: row.commonName,
    lat: row.lat,
    lng: row.lng,
    modes: row.modes ? row.modes.split(",").filter(Boolean) : [],
    lines: parseLines(row.lines),
  };
}

export async function listTflStations(): Promise<TflStation[]> {
  const rows = await db.select().from(tflStations);
  return rows.map(stationToWire);
}

export async function getTflStation(tflId: string): Promise<TflStation | null> {
  const rows = await db.select().from(tflStations).where(eq(tflStations.tflId, tflId)).limit(1);
  return rows[0] ? stationToWire(rows[0]) : null;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

export type NearbyStation = {
  tflId: string;
  commonName: string;
  lines: { id: string; name: string }[];
  distanceKm: number;
};

export type NearbyCamera = {
  tflId: string;
  commonName: string;
  distanceKm: number;
};

// Nearest rail stations and traffic cameras to a point. Datasets are tiny
// (hundreds of rows), so this scans in memory instead of PostGIS.
export async function nearbyTflPoints(
  lat: number,
  lng: number,
  limit = 3,
): Promise<{ stations: NearbyStation[]; cameras: NearbyCamera[] }> {
  const [stations, cameras] = await Promise.all([listTflStations(), listTflCameras()]);
  const stationResults = stations
    .map((s) => ({
      tflId: s.tflId,
      commonName: s.commonName,
      lines: s.lines,
      distanceKm: haversineKm(lat, lng, s.lat, s.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
  const cameraResults = cameras
    .map((c) => ({
      tflId: c.tflId,
      commonName: c.commonName,
      distanceKm: haversineKm(lat, lng, c.lat, c.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
  return { stations: stationResults, cameras: cameraResults };
}
