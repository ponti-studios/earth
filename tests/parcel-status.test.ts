import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchParcelStatus,
  latestDateIso,
  parseDhlJson,
  parseJsonLd,
} from "../app/lib/server/parcel-status";
import { loader as parcelStatusLoader } from "../app/routes/api.parcel-status";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
  const calls: string[] = [];
  const impl = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    return handler(url);
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

const DHL_PAYLOAD = {
  shipments: [
    {
      id: "1291215726",
      service: "EXPRESS WORLDWIDE",
      origin: { address: { addressLocality: "LOS ANGELES - USA" } },
      destination: { address: { addressLocality: "LONDON - UK" } },
      status: { description: "Clearance processing complete" },
      estimatedTimeOfDelivery: "02 November 2026",
      events: [
        {
          timestamp: "2026-10-29T23:59:00.000Z",
          description: "Clearance processing complete at EAST MIDLANDS-GBR",
          location: { address: { addressLocality: "EAST MIDLANDS-GBR" } },
        },
        {
          timestamp: "2026-10-28T15:52:00-07:00",
          description: "Shipment picked up",
          location: { address: { addressLocality: "LOS ANGELES - USA" } },
        },
      ],
    },
  ],
};

describe("DHL status normalisation", () => {
  it("returns DHL's own status, events and estimate", async () => {
    const { impl, calls } = mockFetch(
      () =>
        new Response(JSON.stringify(DHL_PAYLOAD), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );

    const result = await fetchParcelStatus("1291215726", {
      fetchImpl: impl,
      now: () => new Date("2026-10-30T12:00:00.000Z"),
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("dhl.com");
    expect(calls[0]).toContain("1291215726");
    expect(result.state).toBe("ok");
    expect(result.carrier).toBe("dhl");
    expect(result.status).toBe("Clearance processing complete");
    expect(result.origin).toBe("LOS ANGELES - USA");
    expect(result.destination).toBe("LONDON - UK");
    expect(result.estimatedDelivery).toBe("02 November 2026");
    expect(result.estimatedDeliveryAt).toBe("2026-11-02T23:59:59.000Z");
    expect(result.collectedAt).toBe("2026-10-28T22:52:00.000Z");
    expect(result.events[0]).toMatchObject({
      text: "Clearance processing complete at EAST MIDLANDS-GBR",
      place: "EAST MIDLANDS-GBR",
    });
    expect(result.reason).toBeNull();
    expect(result.fetchedAt).toBe("2026-10-30T12:00:00.000Z");
  });

  it("uses the latest date in a range as the estimate", () => {
    expect(latestDateIso("30 October 2026 / 02 November 2026")).toBe("2026-11-02T23:59:59.000Z");
    expect(latestDateIso("2026-10-30")).toBe("2026-10-30T23:59:59.000Z");
    expect(latestDateIso("not a date")).toBeNull();
    expect(latestDateIso(null)).toBeNull();
  });

  it("returns nothing parseable for a payload with no status or scans", () => {
    expect(parseDhlJson(JSON.stringify({ shipments: [{}] }))).toBeNull();
    expect(parseDhlJson("{}")).toBeNull();
    expect(parseDhlJson("<html>not json</html>")).toBeNull();
  });
});

describe("graceful degradation", () => {
  it("reports blocked when DHL serves an Akamai challenge", async () => {
    const { impl, calls } = mockFetch(
      () =>
        new Response("<html><title>Your tracking attempt has been blocked</title></html>", {
          status: 403,
        }),
    );

    const result = await fetchParcelStatus("1291215726", { fetchImpl: impl });

    expect(calls.length).toBe(2);
    expect(result.state).toBe("unavailable");
    expect(result.reason).toBe("blocked");
    expect(result.status).toBeNull();
    expect(result.events).toEqual([]);
    expect(result.trackingUrl).toContain("dhl.com");
  });

  it("reports unparseable when the carrier returns a page we cannot read", async () => {
    const { impl } = mockFetch(
      () => new Response("<html><body>Loading…</body></html>", { status: 200 }),
    );

    const result = await fetchParcelStatus("1291215726", { fetchImpl: impl });

    expect(result.state).toBe("unavailable");
    expect(result.reason).toBe("unparseable");
    expect(result.status).toBeNull();
  });

  it("reports unreachable when every request fails at the network layer", async () => {
    const { impl } = mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });

    const result = await fetchParcelStatus("1Z999AA10123456784", { fetchImpl: impl });

    expect(result.state).toBe("unavailable");
    expect(result.reason).toBe("unreachable");
    expect(result.status).toBeNull();
  });

  it("never fetches or guesses for an unknown format", async () => {
    const { impl, calls } = mockFetch(() => new Response("", { status: 200 }));

    const result = await fetchParcelStatus("HELLO123", { fetchImpl: impl });

    expect(calls).toEqual([]);
    expect(result.state).toBe("unavailable");
    expect(result.reason).toBe("unknown-carrier");
    expect(result.carrier).toBeNull();
    expect(result.trackingUrl).toBeNull();
    expect(result.status).toBeNull();
  });

  it("does not turn an empty 200 into a status", async () => {
    const { impl } = mockFetch(() => new Response("", { status: 200 }));
    const result = await fetchParcelStatus("1291215726", { fetchImpl: impl });
    expect(result.state).toBe("unavailable");
    expect(result.status).toBeNull();
  });
});

describe("other carriers", () => {
  it("reads a schema.org ParcelDelivery block from a carrier page", async () => {
    const html = `<html><head><script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ParcelDelivery",
      trackingNumber: "1Z999AA10123456784",
      deliveryStatus: "In transit",
      originAddress: { addressLocality: "Los Angeles" },
      destinationAddress: { addressLocality: "London" },
      expectedArrivalUntil: "2026-11-02",
    })}</script></head><body></body></html>`;
    const { impl, calls } = mockFetch(() => new Response(html, { status: 200 }));

    const result = await fetchParcelStatus("1Z999AA10123456784", { fetchImpl: impl });

    expect(calls[0]).toContain("ups.com");
    expect(result.state).toBe("ok");
    expect(result.carrier).toBe("ups");
    expect(result.status).toBe("In transit");
    expect(result.origin).toBe("Los Angeles");
    expect(result.destination).toBe("London");
    expect(result.estimatedDeliveryAt).toBe("2026-11-02T23:59:59.000Z");
  });

  it("parses JSON-LD only when it is actually a delivery", () => {
    expect(
      parseJsonLd(
        `<script type="application/ld+json">${JSON.stringify({ "@type": "Organization", name: "UPS" })}</script>`,
      ),
    ).toBeNull();
    expect(
      parseJsonLd(
        `<script type="application/ld+json">${JSON.stringify({
          "@type": "ParcelDelivery",
          deliveryStatus: "Delivered",
        })}</script>`,
      )?.status,
    ).toBe("Delivered");
  });
});

describe("api/parcel-status route", () => {
  it("rejects a carrier hint that contradicts the number format", async () => {
    const response = await parcelStatusLoader({
      request: new Request("http://earth.test/api/parcel-status?number=1291215726&carrier=ups"),
    });
    expect(response.status).toBe(400);
  });

  it("returns carrier-unknown without fetching for an unmatched format", async () => {
    const impl = vi.fn(async () => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", impl);

    const response = await parcelStatusLoader({
      request: new Request("http://earth.test/api/parcel-status?number=HELLO123"),
    });
    const body = (await response.json()) as { state: string; reason: string };

    expect(response.status).toBe(200);
    expect(body.state).toBe("unavailable");
    expect(body.reason).toBe("unknown-carrier");
    expect(impl).not.toHaveBeenCalled();
  });

  it("rejects a missing number", async () => {
    const response = await parcelStatusLoader({
      request: new Request("http://earth.test/api/parcel-status"),
    });
    expect(response.status).toBe(400);
  });

  it("does not cache live status responses", async () => {
    const impl = vi.fn(
      async () =>
        new Response(JSON.stringify(DHL_PAYLOAD), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", impl);

    const response = await parcelStatusLoader({
      request: new Request("http://earth.test/api/parcel-status?number=1291215726&carrier=dhl"),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
