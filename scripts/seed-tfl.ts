import "dotenv/config";
import { closeDb, db, sql, tflCameras } from "~/db";

const TFL_API_URL = "https://api.tfl.gov.uk/Place/Type/JamCam";

interface TflAdditionalProperty {
  key: string;
  value: string;
}

interface TflPlace {
  id: string;
  commonName: string;
  lat: number;
  lon: number;
  additionalProperties: TflAdditionalProperty[];
}

async function main() {
  // Load .env if present (ignored in production where env vars are set directly)
  if ("loadEnvFile" in process) {
    process.loadEnvFile();
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set");
  }

  console.log("Fetching cameras from TfL API...");
  const response = await fetch(TFL_API_URL);

  if (!response.ok) {
    throw new Error(`TfL API returned ${response.status}: ${response.statusText}`);
  }

  const places: TflPlace[] = (await response.json()) as TflPlace[];

  console.log(`Fetched ${places.length} cameras`);

  const cameras = places.map((place) => {
    const props = Object.fromEntries(
      (place.additionalProperties ?? []).map((p) => [p.key, p.value]),
    );

    return {
      tflId: place.id,
      commonName: place.commonName,
      available: props.available === "true",
      imageUrl: props.imageUrl ?? "",
      videoUrl: props.videoUrl ?? "",
      view: props.view ?? "",
      lat: place.lat,
      lng: place.lon,
    };
  });

  for (const cam of cameras) {
    await db
      .insert(tflCameras)
      .values(cam)
      .onConflictDoUpdate({
        target: tflCameras.tflId,
        set: {
          commonName: sql`EXCLUDED.common_name`,
          available: sql`EXCLUDED.available`,
          imageUrl: sql`EXCLUDED.image_url`,
          videoUrl: sql`EXCLUDED.video_url`,
          view: sql`EXCLUDED.view`,
          lat: sql`EXCLUDED.lat`,
          lng: sql`EXCLUDED.lng`,
          updatedAt: sql`NOW()`,
        },
      });
  }

  console.log(`Done: upserted ${cameras.length} cameras`);

  closeDb();
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});
