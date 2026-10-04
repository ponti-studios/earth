import { redirect } from "react-router";
import type { Route } from "./+types/tfl.$cameraId";

// Deep links to a camera now select it on the map.
export function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const layers = url.searchParams.get("layers") ?? "cameras,places";
  return redirect(`/?layers=${encodeURIComponent(layers)}&sel=cam:${params.cameraId}`);
}
