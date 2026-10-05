import { useQuery } from "@tanstack/react-query";
import type { TflStation } from "~/lib/server/tfl";

async function fetchTflStations(): Promise<TflStation[]> {
  try {
    const response = await fetch("/api/stations");
    if (!response.ok) {
      throw new Error("Failed to fetch TfL stations");
    }
    const data = await response.json();
    return data.stations || [];
  } catch (error) {
    console.error("Error fetching TfL stations:", error);
    // Fall back to empty array on error
    return [];
  }
}

export function useTflStations() {
  return useQuery({
    queryKey: ["tfl", "stations"],
    queryFn: fetchTflStations,
    staleTime: 60 * 60 * 1000, // 1 hour (seeded data, rarely changes)
    gcTime: 2 * 60 * 60 * 1000,
  });
}
