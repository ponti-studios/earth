import { fetchTflCameras } from "~/lib/public-data";

export async function loader() {
  try {
    const cameras = await fetchTflCameras();
    return Response.json({ cameras });
  } catch (error) {
    console.error("Error fetching TFL cameras:", error);
    return Response.json({ error: "Failed to fetch cameras" }, { status: 500 });
  }
}
