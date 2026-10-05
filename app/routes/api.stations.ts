import { listTflStations } from "~/lib/server/tfl";

export async function loader() {
  try {
    const stations = await listTflStations();
    return Response.json({ stations });
  } catch (error) {
    console.error("Error fetching TfL stations:", error);
    return Response.json({ error: "Failed to fetch stations" }, { status: 500 });
  }
}
