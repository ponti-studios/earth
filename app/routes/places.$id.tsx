import { redirect } from "react-router";
import type { Route } from "./+types/places.$id";

// Place detail now renders as a map selection in the bottom sheet.
// Mutations moved to /api/places/:id (fetcher, no navigation).
export function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const layers = url.searchParams.get("layers") ?? "cameras,places";
  return redirect(`/?layers=${encodeURIComponent(layers)}&sel=place:${params.id}`);
}
