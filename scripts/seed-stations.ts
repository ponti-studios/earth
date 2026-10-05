import "dotenv/config";
import { closeDb, db, sql, tflStations } from "~/db";

// Rail modes shown as the trains layer. Station-level stop types only —
// platforms, entrances and access areas are skipped.
const MODES = "tube,elizabeth-line,overground,dlr";
const TFL_API_URL = `https://api.tfl.gov.uk/StopPoint/Mode/${MODES}`;
const STATION_TYPES = new Set(["NaptanMetroStation", "NaptanRailStation"]);

interface TflLineRef {
  id: string;
  name: string;
}

interface TflStopPoint {
  id: string;
  commonName: string;
  stopType: string;
  lat: number;
  lon: number;
  modes: string[];
  lines: TflLineRef[];
}

function tflParams(): string {
  const params = new URLSearchParams();
  const appId = process.env.TFL_APP_ID;
  const appKey = process.env.TFL_APP_KEY;
  if (appId) params.set("app_id", appId);
  if (appKey) params.set("app_key", appKey);
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function main() {
  if ("loadEnvFile" in process) {
    process.loadEnvFile();
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  console.log(`Fetching stations from TfL API (${MODES})...`);
  const response = await fetch(`${TFL_API_URL}${tflParams()}`);

  if (!response.ok) {
    throw new Error(`TfL API returned ${response.status}: ${response.statusText}`);
  }

  const payload = (await response.json()) as { stopPoints: TflStopPoint[] };
  const stations = (payload.stopPoints ?? []).filter((s) => STATION_TYPES.has(s.stopType));

  console.log(`Fetched ${stations.length} stations`);

  for (const station of stations) {
    const modes = [...new Set(station.modes ?? [])].sort().join(",");
    const lines = (station.lines ?? []).map((l) => ({ id: l.id, name: l.name }));
    await db
      .insert(tflStations)
      .values({
        tflId: station.id,
        commonName: station.commonName,
        lat: station.lat,
        lng: station.lon,
        modes,
        lines: JSON.stringify(lines),
      })
      .onConflictDoUpdate({
        target: tflStations.tflId,
        set: {
          commonName: sql`EXCLUDED.common_name`,
          lat: sql`EXCLUDED.lat`,
          lng: sql`EXCLUDED.lng`,
          modes: sql`EXCLUDED.modes`,
          lines: sql`EXCLUDED.lines`,
          updatedAt: sql`NOW()`,
        },
      });
  }

  console.log(`Done: upserted ${stations.length} stations`);

  closeDb();
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});
