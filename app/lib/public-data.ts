import { z } from "zod";
import { EarthServerEnv } from "./server/env.js";

const { publicDataUrl: BASE } = EarthServerEnv.parse(process.env);

const TflCameraRawSchema = z.object({
  tflId: z.string(),
  commonName: z.string(),
  placeType: z.string(),
  lat: z.number(),
  lng: z.number(),
  properties: z.string(),
});

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

function parseProperties(raw: string) {
  const parsed = JSON.parse(raw);
  return {
    available: String(parsed.available ?? ""),
    imageUrl: String(parsed.imageUrl ?? ""),
    videoUrl: String(parsed.videoUrl ?? ""),
    view: String(parsed.view ?? ""),
  };
}

export async function fetchTflCameras(type?: string): Promise<TflCamera[]> {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  const qs = params.toString();
  const url = `${BASE}/tfl/cameras${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`public-data API error: ${res.status}`);
  const raw = z.array(TflCameraRawSchema).parse(await res.json());
  return raw.map((c) =>
    TflCameraSchema.parse({ ...c, ...parseProperties(c.properties), properties: undefined }),
  );
}

export async function fetchTflCamera(tflId: string): Promise<TflCamera | null> {
  const res = await fetch(`${BASE}/tfl/cameras/${tflId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`public-data API error: ${res.status}`);
  const raw = TflCameraRawSchema.parse(await res.json());
  return TflCameraSchema.parse({ ...raw, ...parseProperties(raw.properties), properties: undefined });
}
