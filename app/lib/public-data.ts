const BASE =
  process.env.PUBLIC_DATA_URL ?? "https://public-data-production.up.railway.app";

interface TflCameraRaw {
  id: number;
  tfl_id: string;
  common_name: string;
  place_type: string;
  lat: number;
  lng: number;
  properties: string;
}

interface TflCameraProperties {
  available: string;
  imageUrl: string;
  videoUrl: string;
  view: string;
}

export interface TflCameraParsed {
  id: string;
  available: string;
  commonName: string;
  imageUrl: string;
  videoUrl: string;
  view: string;
  lat: number;
  lng: number;
}

export async function fetchTflCameras(type?: string): Promise<TflCameraParsed[]> {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  const qs = params.toString();
  const url = `${BASE}/tfl/cameras${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`public-data API error: ${res.status}`);
  const raw: TflCameraRaw[] = (await res.json()) as TflCameraRaw[];
  return raw.map((c) => {
    const props: TflCameraProperties = JSON.parse(c.properties);
    return {
      id: c.tfl_id,
      commonName: c.common_name,
      available: props.available,
      imageUrl: props.imageUrl,
      videoUrl: props.videoUrl,
      view: props.view,
      lat: c.lat,
      lng: c.lng,
    };
  });
}
