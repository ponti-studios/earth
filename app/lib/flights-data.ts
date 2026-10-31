import rawFlights from "~/data/flights.json";
import type { FlightsData } from "./flights";

/**
 * The travel log is a committed, immutable data file carried over verbatim
 * from the standalone map. Imported statically so the route renders fully on
 * the server without a client fetch.
 */
export const flightsData = rawFlights as unknown as FlightsData;
