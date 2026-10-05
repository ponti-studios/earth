import { getArrivals } from "~/lib/server/tfl-live";

export async function loader({ request }: { request: Request }) {
  const station = new URL(request.url).searchParams.get("station")?.trim() ?? "";
  if (!station) {
    return Response.json({ error: "Missing station parameter" }, { status: 400 });
  }
  try {
    const arrivals = await getArrivals(station);
    return Response.json({ station, arrivals });
  } catch (error) {
    console.error("Error fetching arrivals:", error);
    return Response.json({ error: "Failed to fetch arrivals" }, { status: 502 });
  }
}
