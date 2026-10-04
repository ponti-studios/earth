import { createPlace, listPlaces, PlaceFilterSchema } from "~/lib/server/places";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const filter = PlaceFilterSchema.catch("all").parse(url.searchParams.get("filter") ?? "all");
  const search = url.searchParams.get("search") ?? "";
  try {
    const data = await listPlaces({ filter, search });
    return Response.json(data);
  } catch (error) {
    console.error("Failed to list places:", error);
    return Response.json({ error: "Failed to list places" }, { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  const form = await request.formData();
  try {
    const place = await createPlace({
      name: String(form.get("name") ?? ""),
      latitude: Number(form.get("latitude")),
      longitude: Number(form.get("longitude")),
      formattedAddress: String(form.get("formattedAddress") ?? "") || undefined,
      city: String(form.get("city") ?? "") || undefined,
      state: String(form.get("state") ?? "") || undefined,
      postalCode: String(form.get("postalCode") ?? "") || undefined,
      country: String(form.get("country") ?? "") || undefined,
      countryCode: String(form.get("countryCode") ?? "") || undefined,
    });
    return Response.json({ ok: true, id: place.id });
  } catch (error) {
    console.error("Failed to save place:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save place" },
      { status: 400 },
    );
  }
}
