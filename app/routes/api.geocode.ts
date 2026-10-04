import { geocodePreview } from "~/lib/server/geocode";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Number(url.searchParams.get("limit") ?? "5");
  if (!q) return Response.json({ error: "Missing ?q=" }, { status: 400 });
  try {
    const preview = await geocodePreview(q, Number.isFinite(limit) ? limit : 5);
    return Response.json(preview);
  } catch (error) {
    console.error("Geocode failed:", error);
    return Response.json({ error: "Geocode failed" }, { status: 502 });
  }
}
