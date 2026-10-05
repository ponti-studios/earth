// Layer registry: every map overlay (cameras, places, future live feeds
// like TfL trains or other open data) registers here. Adding a layer is:
//   1. add an entry below
//   2. gate its <Source/> in MapLibreViewer on `enabled.includes("<id>")`
//   3. add its data hook / loader
// Visibility is URL-driven (?layers=cameras,places) so views are shareable.

export const LAYERS = [
  { id: "cameras", label: "Cameras", icon: "📷" },
  { id: "places", label: "Places", icon: "📍" },
  { id: "stations", label: "Trains", icon: "🚇" },
] as const;

export type LayerId = (typeof LAYERS)[number]["id"];

export const DEFAULT_LAYERS: LayerId[] = ["cameras", "places", "stations"];

export function parseLayers(param: string | null): LayerId[] {
  if (!param) return [...DEFAULT_LAYERS];
  const ids = param
    .split(",")
    .map((s) => s.trim())
    .filter((id): id is LayerId => LAYERS.some((l) => l.id === id));
  return ids.length > 0 ? [...new Set(ids)] : [...DEFAULT_LAYERS];
}

export function serializeLayers(ids: readonly LayerId[]): string {
  return ids.join(",");
}
