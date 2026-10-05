import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";

// Boot seeding for fresh databases (e.g. a new Railway Postgres).
// Skips tables that already have rows, so restarts are cheap and never
// refetch. Raw SQL (not the drizzle schema) keeps this runnable under
// plain `node` (Node 24 type stripping, no tsx, no path aliases). Column
// lists mirror src/db/schema.ts — update both together.

type Db = ReturnType<typeof drizzle>;

const TFL_APP_PARAMS = (() => {
  const params = new URLSearchParams();
  if (process.env.TFL_APP_ID) params.set("app_id", process.env.TFL_APP_ID);
  if (process.env.TFL_APP_KEY) params.set("app_key", process.env.TFL_APP_KEY);
  const query = params.toString();
  return query ? `?${query}` : "";
})();

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { "User-Agent": "ponti-earth/0.1" } });
  if (!response.ok) {
    throw new Error(`TfL API returned ${response.status} for ${url}`);
  }
  return response.json() as Promise<unknown>;
}

async function tableCount(db: Db, table: string): Promise<number> {
  const rows = (await db.execute(
    sql.raw(`SELECT COUNT(*)::int AS count FROM ${table}`),
  )) as unknown as { count: number }[];
  return rows[0]?.count ?? 0;
}

async function seedCameras(db: Db): Promise<void> {
  const existing = await tableCount(db, "tfl_cameras");
  if (existing > 0) {
    console.log(`tfl_cameras already seeded (${existing} rows), skipping`);
    return;
  }
  console.log("Seeding TfL cameras...");
  const places = (await fetchJson(`https://api.tfl.gov.uk/Place/Type/JamCam${TFL_APP_PARAMS}`)) as {
    id: string;
    commonName: string;
    lat: number;
    lon: number;
    additionalProperties?: { key: string; value: string }[];
  }[];
  for (const place of places) {
    const props = Object.fromEntries(
      (place.additionalProperties ?? []).map((p) => [p.key, p.value]),
    );
    await db.execute(sql`
      INSERT INTO tfl_cameras
        (tfl_id, common_name, available, image_url, video_url, view, lat, lng, updated_at)
      VALUES
        (${place.id}, ${place.commonName}, ${props.available === "true"},
         ${props.imageUrl ?? ""}, ${props.videoUrl ?? ""}, ${props.view ?? ""},
         ${place.lat}, ${place.lon}, NOW())
      ON CONFLICT (tfl_id) DO NOTHING
    `);
  }
  console.log(`Seeded ${places.length} cameras`);
}

const STATION_TYPES = new Set(["NaptanMetroStation", "NaptanRailStation"]);

async function seedStations(db: Db): Promise<void> {
  const existing = await tableCount(db, "tfl_stations");
  if (existing > 0) {
    console.log(`tfl_stations already seeded (${existing} rows), skipping`);
    return;
  }
  console.log("Seeding TfL stations...");
  const payload = (await fetchJson(
    `https://api.tfl.gov.uk/StopPoint/Mode/tube,elizabeth-line,overground,dlr${TFL_APP_PARAMS}`,
  )) as {
    stopPoints: {
      id: string;
      commonName: string;
      stopType: string;
      lat: number;
      lon: number;
      modes: string[];
      lines: { id: string; name: string }[];
    }[];
  };
  const stations = (payload.stopPoints ?? []).filter((s) => STATION_TYPES.has(s.stopType));
  for (const station of stations) {
    const modes = [...new Set(station.modes ?? [])].sort().join(",");
    const lines = JSON.stringify((station.lines ?? []).map((l) => ({ id: l.id, name: l.name })));
    await db.execute(sql`
      INSERT INTO tfl_stations
        (tfl_id, common_name, lat, lng, modes, lines, updated_at)
      VALUES
        (${station.id}, ${station.commonName}, ${station.lat}, ${station.lon},
         ${modes}, ${lines}, NOW())
      ON CONFLICT (tfl_id) DO NOTHING
    `);
  }
  console.log(`Seeded ${stations.length} stations`);
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL must be set");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  try {
    await seedCameras(db);
    await seedStations(db);
    console.log("Seed check complete");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
