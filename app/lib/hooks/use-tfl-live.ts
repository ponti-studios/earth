import { useQuery } from "@tanstack/react-query";
import type { Arrival, LineStatus } from "~/lib/server/tfl-live";

async function fetchArrivals(stationId: string): Promise<Arrival[]> {
  const response = await fetch(`/api/arrivals?station=${encodeURIComponent(stationId)}`);
  if (!response.ok) {
    throw new Error("Failed to fetch arrivals");
  }
  const data = await response.json();
  return data.arrivals || [];
}

export function useArrivals(stationId: string | null) {
  return useQuery({
    queryKey: ["tfl", "arrivals", stationId],
    queryFn: () => fetchArrivals(stationId!),
    enabled: stationId != null,
    // Departure boards go stale fast; poll while a station is selected.
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000,
    retry: 1,
  });
}

async function fetchLineStatus(): Promise<LineStatus[]> {
  const response = await fetch("/api/line-status");
  if (!response.ok) {
    throw new Error("Failed to fetch line status");
  }
  const data = await response.json();
  return data.lines || [];
}

export function useLineStatus() {
  return useQuery({
    queryKey: ["tfl", "line-status"],
    queryFn: fetchLineStatus,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });
}
