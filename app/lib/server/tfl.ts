import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, tflCameras } from "~/db";

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
