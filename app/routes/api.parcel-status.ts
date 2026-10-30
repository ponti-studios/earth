import { z } from "zod";
import { CARRIER_INFO, detectCarrier, type CarrierId } from "~/lib/parcels";
import { fetchParcelStatus } from "~/lib/server/parcel-status";

const CarrierSchema = z.enum(Object.keys(CARRIER_INFO) as [CarrierId, ...CarrierId[]]);

const QuerySchema = z.object({
  number: z.string().trim().min(1).max(64),
  carrier: CarrierSchema.optional(),
});

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    number: url.searchParams.get("number") ?? "",
    carrier: url.searchParams.get("carrier") || undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "Missing or invalid ?number=" }, { status: 400 });
  }

  // The number's format is the source of truth. A carrier hint is accepted so
  // callers can be explicit, but it may not override the detector.
  const detection = detectCarrier(parsed.data.number);
  if (parsed.data.carrier && detection.carrier && parsed.data.carrier !== detection.carrier) {
    return Response.json(
      { error: "carrier does not match the tracking number format" },
      { status: 400 },
    );
  }

  try {
    // Unknown formats come back as `unavailable`/`unknown-carrier` without a
    // fetch; the route never guesses a carrier.
    return Response.json(await fetchParcelStatus(parsed.data.number));
  } catch (error) {
    console.error("Parcel status failed:", error);
    return Response.json({ error: "Parcel status failed" }, { status: 502 });
  }
}
