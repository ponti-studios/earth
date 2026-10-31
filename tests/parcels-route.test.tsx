import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Parcels from "../app/routes/parcels";
import { PARCELS_STORAGE_KEY, type ParcelStatusResult } from "../app/lib/parcels";

// The map is MapLibre/WebGL; the route's list and persistence behaviour is
// what this test exercises, while the mocked map records the route it is given.
const mapState = vi.hoisted(() => ({
  props: null as null | { route: unknown; emoji: string },
}));

vi.mock("~/components/ParcelMap", () => ({
  default: (props: { route: unknown; emoji: string }) => {
    mapState.props = props;
    return <div data-testid="parcel-map" />;
  },
}));

const UNAVAILABLE: ParcelStatusResult = {
  state: "unavailable",
  number: "1291215726",
  carrier: "dhl",
  carrierName: "DHL Express",
  trackingUrl:
    "https://www.dhl.com/gb-en/home/tracking/tracking-express.html?submit=1&tracking-id=1291215726",
  reason: "blocked",
  status: null,
  events: [],
  origin: null,
  destination: null,
  estimatedDelivery: null,
  estimatedDeliveryAt: null,
  collectedAt: null,
  fetchedAt: "2026-10-30T12:00:00.000Z",
};

const DHL_OK: ParcelStatusResult = {
  state: "ok",
  number: "1291215726",
  carrier: "dhl",
  carrierName: "DHL Express",
  trackingUrl:
    "https://www.dhl.com/gb-en/home/tracking/tracking-express.html?submit=1&tracking-id=1291215726",
  reason: null,
  status: "Clearance processing complete",
  events: [
    {
      text: "Clearance processing complete at EAST MIDLANDS-GBR",
      at: "2026-10-29T23:59:00.000Z",
      place: "East Midlands",
    },
    { text: "Shipment picked up", at: "2026-10-28T22:52:00.000Z", place: "Los Angeles" },
  ],
  origin: "LOS ANGELES - USA",
  destination: "LONDON - UK",
  estimatedDelivery: "02 November 2026",
  estimatedDeliveryAt: "2026-11-02T23:59:59.000Z",
  collectedAt: "2026-10-28T22:52:00.000Z",
  fetchedAt: "2026-10-30T12:00:00.000Z",
};

const DHL_UNMAPPED_DESTINATION: ParcelStatusResult = {
  ...DHL_OK,
  destination: "NEW YORK - USA",
};

function stubFetch(result: ParcelStatusResult = UNAVAILABLE) {
  const impl = vi.fn(async () => new Response(JSON.stringify(result), { status: 200 }));
  vi.stubGlobal("fetch", impl);
  return impl;
}

function addNumber(number: string, type?: string) {
  const input = screen.getByLabelText("Tracking number");
  fireEvent.change(input, { target: { value: number } });
  if (type) {
    const select = screen.getByLabelText("Marker");
    fireEvent.change(select, { target: { value: type } });
  }
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
}

describe("/parcels route", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("adds a number, keeps it across a reload, then removes it", async () => {
    stubFetch();
    const first = render(<Parcels />);

    addNumber("1291215726", "moving");

    await waitFor(() => {
      expect(screen.getAllByText("1291215726").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("DHL Express").length).toBeGreaterThan(0);
    expect(screen.getByText("Live status unavailable")).toBeTruthy();
    expect(screen.getAllByText("🚚").length).toBeGreaterThan(0);

    // Reload: unmount and mount a fresh app against the same browser storage.
    first.unmount();
    render(<Parcels />);

    await waitFor(() => {
      expect(screen.getAllByText("1291215726").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove 1291215726" }));

    await waitFor(() => {
      expect(screen.queryByText("1291215726")).toBeNull();
    });
    expect(JSON.parse(window.localStorage.getItem(PARCELS_STORAGE_KEY) ?? "null")).toEqual([]);
  });

  it("saves an unknown-format number without calling the status API", async () => {
    const fetchImpl = stubFetch();
    render(<Parcels />);

    addNumber("HELLO123");

    await waitFor(() => {
      expect(screen.getAllByText("HELLO123").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("Carrier unknown").length).toBeGreaterThan(0);
    expect(screen.getByText(/No carrier matched this number's format/)).toBeTruthy();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("draws the detected route and hands the item's emoji to the map", async () => {
    stubFetch(DHL_OK);
    render(<Parcels />);

    addNumber("1291215726", "moving");

    await waitFor(() => {
      expect(screen.getAllByText("Clearance processing complete").length).toBeGreaterThan(0);
    });

    const route = mapState.props?.route as {
      originName: string;
      destinationName: string;
      marker: [number, number];
    } | null;
    expect(route).toBeTruthy();
    expect(route!.originName).toBe("LOS ANGELES - USA");
    expect(route!.destinationName).toBe("LONDON - UK");
    // Named-city scan wins: the marker jumps to East Midlands.
    expect(route!.marker).toEqual([-1.3281, 52.8311]);
    expect(mapState.props?.emoji).toBe("🚚");
  });

  it("omits the route when a destination cannot be resolved to coordinates", async () => {
    stubFetch(DHL_UNMAPPED_DESTINATION);
    render(<Parcels />);

    addNumber("1291215726", "moving");

    await waitFor(() => {
      expect(screen.getByText(/NEW YORK - USA/)).toBeTruthy();
    });
    await waitFor(() => {
      expect(mapState.props?.route).toBeNull();
    });
  });

  it("lets each saved item's type drive its marker", async () => {
    stubFetch();
    render(<Parcels />);

    addNumber("1291215726");
    await waitFor(() => {
      expect(screen.getAllByText("1291215726").length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByLabelText("Marker type for 1291215726"), {
      target: { value: "food" },
    });

    await waitFor(() => {
      expect(screen.getAllByText("🍔").length).toBeGreaterThan(0);
    });
    const stored = JSON.parse(window.localStorage.getItem(PARCELS_STORAGE_KEY) ?? "[]") as {
      number: string;
      type: string;
    }[];
    expect(stored[0]).toMatchObject({ number: "1291215726", type: "food" });
  });
});
