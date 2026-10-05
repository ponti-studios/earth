import { getLineStatuses } from "~/lib/server/tfl-live";

export async function loader() {
  try {
    const lines = await getLineStatuses();
    return Response.json({ lines });
  } catch (error) {
    console.error("Error fetching line statuses:", error);
    return Response.json({ error: "Failed to fetch line statuses" }, { status: 502 });
  }
}
