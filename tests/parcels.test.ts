import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PARCELS_STORAGE_KEY,
  TYPE_EMOJI,
  addParcel,
  cityCoord,
  cityName,
  detectCarrier,
  emojiForType,
  greatCircle,
  isDelivered,
  loadParcels,
  markerPosition,
  normaliseTrackingNumber,
  pointAt,
  removeParcel,
  routeFraction,
  saveParcels,
  shouldFetchStatus,
} from "../app/lib/parcels";

const LAX = { lat: 34.0522, lon: -118.2437 };
const LHR = { lat: 51.498, lon: -0.0779 };

describe("carrier detection", () => {
  it.each([
    ["dhl 10-digit waybill", "1291215726", "dhl", "DHL Express"],
    ["dhl JJD reference", "JJD014600012894607109", "dhl", "DHL Express"],
    ["ups 1Z + 16", "1Z999AA10123456784", "ups", "UPS"],
    ["royal mail", "RN123456789GB", "royal-mail", "Royal Mail"],
    ["usps 22-digit IMpb", "9400111899223856928499", "usps", "USPS"],
    ["usps 20-digit", "12345678901234567890", "usps", "USPS"],
    ["evri 16-digit", "1234567890123456", "evri", "Evri"],
    ["fedex 12-digit", "123456789012", "fedex", "FedEx"],
    ["fedex 15-digit", "123456789012345", "fedex", "FedEx"],
  ])("resolves %s", (_label, number, carrier, name) => {
    const found = detectCarrier(number);
    expect(found.carrier).toBe(carrier);
    expect(found.carrierName).toBe(name);
    expect(found.trackingUrl).toBeTruthy();
  });

  it("normalises whitespace, hyphens and case before matching", () => {
    expect(normaliseTrackingNumber("  1z 999a a101 2345 6784 ")).toBe("1Z999AA10123456784");
    expect(detectCarrier("1z 999a a101 2345 6784").carrier).toBe("ups");
    expect(detectCarrier("1291-215-726").carrier).toBe("dhl");
  });

  it("builds each carrier's own tracking URL", () => {
    expect(detectCarrier("1291215726").trackingUrl).toBe(
      "https://www.dhl.com/gb-en/home/tracking/tracking-express.html?submit=1&tracking-id=1291215726",
    );
    expect(detectCarrier("1Z999AA10123456784").trackingUrl).toBe(
      "https://www.ups.com/track?tracknum=1Z999AA10123456784",
    );
    expect(detectCarrier("RN123456789GB").trackingUrl).toContain(
      "royalmail.com/track-your-item#/tracking-results/RN123456789GB",
    );
    expect(detectCarrier("123456789012").trackingUrl).toContain(
      "fedex.com/fedextrack/?trknbr=123456789012",
    );
    expect(detectCarrier("9400111899223856928499").trackingUrl).toContain(
      "tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223856928499",
    );
    expect(detectCarrier("1234567890123456").trackingUrl).toContain(
      "evri.com/track/parcel/1234567890123456",
    );
  });

  it("treats an unmatched format as carrier-unknown without a URL", () => {
    const found = detectCarrier("HELLO123");
    expect(found.carrier).toBeNull();
    expect(found.carrierName).toBeNull();
    expect(found.trackingUrl).toBeNull();
  });
});

describe("detector precedence", () => {
  // The rules overlap as patterns, so the first-match order is the contract.
  it("10 digits is DHL, not a short FedEx reference", () => {
    expect(detectCarrier("1234567890").carrier).toBe("dhl");
  });

  it("12 digits is FedEx, not USPS or Evri", () => {
    expect(detectCarrier("123456789012").carrier).toBe("fedex");
  });

  it("15 digits is FedEx, not Evri", () => {
    expect(detectCarrier("123456789012345").carrier).toBe("fedex");
  });

  it("16 digits is Evri, not USPS", () => {
    expect(detectCarrier("1234567890123456").carrier).toBe("evri");
  });

  it("20–22 digits is USPS, not Evri", () => {
    expect(detectCarrier("12345678901234567890").carrier).toBe("usps");
    expect(detectCarrier("9400111899223856928499").carrier).toBe("usps");
  });

  it("JJD wins before numeric length rules", () => {
    const found = detectCarrier("JJD014600012894607109");
    expect(found.carrier).toBe("dhl");
    expect(found.formatLabel).toBe("JJD + 10+ digits");
  });

  it("1Z wins before numeric length rules", () => {
    expect(detectCarrier("1Z999AA10123456784").carrier).toBe("ups");
  });
});

describe("type markers", () => {
  it("maps every type to the standalone tracker's emoji", () => {
    expect(TYPE_EMOJI).toEqual({
      flight: "✈️",
      moving: "🚚",
      parcel: "📦",
      clothing: "👕",
      food: "🍔",
      car: "🚗",
    });
  });

  it("falls back to the pin for unknown or missing types", () => {
    expect(emojiForType("parcel")).toBe("📦");
    expect(emojiForType("moving")).toBe("🚚");
    expect(emojiForType("boat")).toBe("📍");
    expect(emojiForType(null)).toBe("📍");
    expect(emojiForType(undefined)).toBe("📍");
  });
});

describe("localStorage persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });

  it("keeps an added number after a reload", async () => {
    const added = addParcel([], "1291215726", "moving");
    saveParcels(added);

    // A reload re-imports the module and reads the browser's storage again.
    vi.resetModules();
    const reloaded = await import("../app/lib/parcels");
    const stored = reloaded.loadParcels();

    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ number: "1291215726", type: "moving" });
    expect(window.localStorage.getItem(PARCELS_STORAGE_KEY)).toContain("1291215726");
  });

  it("removes a number from the list and from localStorage after a reload", async () => {
    const stored = addParcel(addParcel([], "1291215726", "moving"), "1Z999AA10123456784", "parcel");
    saveParcels(stored);

    vi.resetModules();
    const reloaded = await import("../app/lib/parcels");
    const before = reloaded.loadParcels();
    expect(before).toHaveLength(2);

    const target = before.find((parcel) => parcel.number === "1291215726");
    expect(target).toBeTruthy();
    reloaded.saveParcels(reloaded.removeParcel(before, target!.id));

    vi.resetModules();
    const afterReload = await import("../app/lib/parcels");
    const after = afterReload.loadParcels();
    expect(after).toHaveLength(1);
    expect(after[0].number).toBe("1Z999AA10123456784");
    expect(window.localStorage.getItem(PARCELS_STORAGE_KEY)).not.toContain("1291215726");
  });

  it("saves unknown-format numbers but marks them as no-fetch", async () => {
    const next = addParcel([], "HELLO123", "parcel");
    saveParcels(next);

    vi.resetModules();
    const reloaded = await import("../app/lib/parcels");
    const stored = reloaded.loadParcels();
    expect(stored).toHaveLength(1);
    expect(reloaded.detectCarrier(stored[0].number).carrier).toBeNull();
    expect(reloaded.shouldFetchStatus(stored[0].number)).toBe(false);
  });

  it("ignores duplicate numbers and malformed storage", () => {
    const once = addParcel([], "1291215726", "parcel");
    expect(addParcel(once, " 1291-215-726 ", "car")).toHaveLength(1);
    expect(removeParcel(once, "missing")).toHaveLength(1);

    window.localStorage.setItem(PARCELS_STORAGE_KEY, "{not json");
    expect(loadParcels()).toEqual([]);
    window.localStorage.setItem(PARCELS_STORAGE_KEY, JSON.stringify({ nope: true }));
    expect(loadParcels()).toEqual([]);
  });

  it("only requests status for numbers with a detected carrier", () => {
    expect(shouldFetchStatus("1291215726")).toBe(true);
    expect(shouldFetchStatus("9400111899223856928499")).toBe(true);
    expect(shouldFetchStatus("HELLO123")).toBe(false);
  });
});

describe("marker interpolation", () => {
  const route = greatCircle(LAX, LHR);

  it("draws a great circle from origin to destination", () => {
    expect(route[0][0]).toBeCloseTo(LAX.lon, 4);
    expect(route[0][1]).toBeCloseTo(LAX.lat, 4);
    expect(route.at(-1)![0]).toBeCloseTo(LHR.lon, 4);
    expect(route.at(-1)![1]).toBeCloseTo(LHR.lat, 4);
    expect(route.length).toBe(97);
  });

  it("uses 5% at collection and 97% at the estimate", () => {
    const collectedAt = "2026-10-28T00:00:00.000Z";
    const estimatedAt = "2026-11-02T00:00:00.000Z";
    expect(routeFraction({ collectedAt, estimatedAt, now: Date.parse(collectedAt) })).toBe(0.05);
    expect(routeFraction({ collectedAt, estimatedAt, now: Date.parse(estimatedAt) })).toBe(0.97);
    expect(routeFraction({ delivered: true })).toBe(1);

    const midpoint = routeFraction({
      collectedAt,
      estimatedAt,
      now: Date.parse("2026-10-30T12:00:00.000Z"),
    });
    expect(midpoint).toBeGreaterThan(0.4);
    expect(midpoint).toBeLessThan(0.65);
    expect(pointAt(route, midpoint)[0]).toBeGreaterThan(-100);
  });

  it("jumps to a named-city scan instead of the clock position", () => {
    const position = markerPosition(
      route,
      [
        {
          text: "Clearance processing complete",
          at: "2026-10-29T23:59:00.000Z",
          place: "East Midlands",
        },
      ],
      {
        collectedAt: "2026-10-28T00:00:00.000Z",
        estimatedAt: "2026-11-02T00:00:00.000Z",
        now: Date.parse("2026-10-28T06:00:00.000Z"),
      },
    );
    expect(position).toEqual([-1.3281, 52.8311]);
  });

  it("falls back to time interpolation when no scan has a known city", () => {
    const position = markerPosition(
      route,
      [{ text: "Customs hold", at: "2026-10-29T23:59:00.000Z", place: "Somewhere" }],
      {
        collectedAt: "2026-10-28T00:00:00.000Z",
        estimatedAt: "2026-11-02T00:00:00.000Z",
        now: Date.parse("2026-10-28T00:00:00.000Z"),
      },
    );
    expect(position).toEqual(pointAt(route, 0.05));
  });

  it("puts a delivered parcel at the destination", () => {
    const position = markerPosition(route, [], { delivered: true });
    expect(position![0]).toBeCloseTo(LHR.lon, 4);
    expect(position![1]).toBeCloseTo(LHR.lat, 4);
  });
});

describe("delivery status", () => {
  it("accepts affirmative delivered statuses", () => {
    expect(isDelivered("Delivered")).toBe(true);
    expect(isDelivered("Delivered to your neighbour")).toBe(true);
    expect(isDelivered("Shipment delivered")).toBe(true);
    expect(isDelivered("Delivery completed")).toBe(true);
  });

  it("rejects mentions of delivery that are not completed", () => {
    expect(isDelivered("Not delivered")).toBe(false);
    expect(isDelivered("Shipment will be delivered tomorrow")).toBe(false);
    expect(isDelivered("Out for delivery")).toBe(false);
    expect(isDelivered("Attempted delivery")).toBe(false);
    expect(isDelivered(null)).toBe(false);
  });
});

describe("place aliases", () => {
  it("collapses DHL place strings onto known cities", () => {
    expect(cityName("LOS ANGELES GATEWAY,CA-USA")).toBe("Los Angeles");
    expect(cityName("EAST MIDLANDS-GBR")).toBe("East Midlands");
    expect(cityCoord("LONDON - UK")).toEqual(LHR);
    expect(cityCoord("Apartment 1, The Pickle Factory")).toBeNull();
  });
});
