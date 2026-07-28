import "~/lib/server/env";
import { db, tflCameras } from "~/db";
import type { TflCamera } from "../lib/signals/earth";

export async function loader() {
  try {
    const cameras = await db.select().from(tflCameras);

    // Transform database data to match the frontend expected format
    const transformedCameras: TflCamera[] = cameras.map((camera) => ({
      id: camera.tflId,
      commonName: camera.commonName,
      available: camera.available ? "true" : "false",
      imageUrl: camera.imageUrl || "",
      videoUrl: camera.videoUrl || "",
      view: camera.view || "",
      lat: camera.lat,
      lng: camera.lng,
    }));

    return Response.json({ cameras: transformedCameras });
  } catch (error) {
    console.error("Error fetching TFL cameras:", error);
    return Response.json({ error: "Failed to fetch cameras" }, { status: 500 });
  }
}
