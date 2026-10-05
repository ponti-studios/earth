import {
  acceptGeocodeResult,
  deletePlace,
  markNotAPlace,
  renamePlace,
  saveReviewQuery,
} from "~/lib/server/places";

// Mutations for the review detail, called via fetcher (no navigation).
// Returns JSON so the map keeps its state.
export async function action({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const query = String(form.get("query") ?? "").trim();

  try {
    if (intent === "save-query") {
      await saveReviewQuery(id, query);
    } else if (intent === "rename") {
      await renamePlace(id, String(form.get("name") ?? ""));
    } else if (intent === "delete") {
      await deletePlace(id);
    } else if (intent === "not-a-place") {
      await markNotAPlace(id, query || "manual review");
    } else if (intent === "accept") {
      const displayTitle = String(form.get("displayTitle") ?? "");
      const latitude = Number(form.get("latitude"));
      const longitude = Number(form.get("longitude"));
      if (!displayTitle || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return Response.json({ error: "Invalid geocode result" }, { status: 400 });
      }
      await acceptGeocodeResult(id, query, {
        displayTitle,
        latitude,
        longitude,
        formattedAddress: displayTitle,
        city: String(form.get("city") ?? "") || undefined,
        state: String(form.get("state") ?? "") || undefined,
        postalCode: String(form.get("postalCode") ?? "") || undefined,
        country: String(form.get("country") ?? "") || undefined,
        countryCode: String(form.get("countryCode") ?? "") || undefined,
      });
    } else {
      return Response.json({ error: "Unknown intent" }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Place action failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 400 },
    );
  }
}
