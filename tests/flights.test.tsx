import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import {
  buildLegs,
  greatCircle,
  parseYears,
  visibleLegs,
  type Airport,
} from "../app/lib/flights";
import Flights from "../app/routes/flights";

const raw = JSON.parse(readFileSync(new URL("../app/data/flights.json", import.meta.url), "utf8"));

const legs = buildLegs(raw);
const years = [...new Set(legs.map((leg) => leg.year))].sort((a, b) => a - b);

function renderAt(entry: string): string {
  const Stub = createRoutesStub([{ path: "/flights", Component: Flights }]);
  return renderToStaticMarkup(<Stub initialEntries={[entry]} />);
}

function renderedLegIds(html: string): string[] {
  return [...html.matchAll(/data-leg-id="([^"]+)"/g)].map((match) => match[1]);
}

test("flights.json is carried over intact", () => {
  assert.equal(raw.legs.length, 41);
  assert.equal(legs.length, raw.legs.length);
  assert.deepEqual(raw.stats, {
    legs: 41,
    total_km: 125696,
    total_miles: 78104,
    airports: 30,
    countries: [
      "Australia",
      "Canada",
      "Denmark",
      "Germany",
      "Iceland",
      "Italy",
      "Portugal",
      "Puerto Rico",
      "Spain",
      "UK",
      "USA",
    ],
    span: ["2016-08-26", "2026-11-29"],
  });
});

test("route renders every leg when no year filter is set", () => {
  const ids = renderedLegIds(renderAt("/flights"));
  assert.equal(ids.length, raw.legs.length);
  assert.deepEqual(new Set(ids), new Set(raw.legs.map((leg: { id: string }) => leg.id)));
});

test("selecting a year renders only that year's legs", () => {
  for (const year of years) {
    const expected = raw.legs
      .filter((leg: { date: string }) => leg.date.startsWith(String(year)))
      .map((leg: { id: string }) => leg.id);
    const ids = renderedLegIds(renderAt(`/flights?years=${year}`));
    assert.equal(ids.length, expected.length, `${year} should render ${expected.length} legs`);
    assert.deepEqual(new Set(ids), new Set(expected));
  }
});

test("clearing the year filter restores all legs", () => {
  assert.equal(renderedLegIds(renderAt("/flights?years=2019")).length < raw.legs.length, true);
  assert.equal(renderedLegIds(renderAt("/flights")).length, raw.legs.length);
});

test("stats displayed on the route match flights.json exactly", () => {
  const html = renderAt("/flights");
  const expected = [
    ["legs", "41"],
    ["miles", "78,104"],
    ["hubs", "30"],
    ["countries", "11"],
    ["span", "2016—2026"],
  ];
  for (const [key, value] of expected) {
    assert.match(
      html,
      new RegExp(`data-stat="${key}" data-stat-value="${value}"`),
      `${key} should render ${value}`,
    );
  }
});

test("unknown or unusable year params fall back to all years", () => {
  assert.deepEqual(parseYears(null, years), years);
  assert.deepEqual(parseYears("", years), years);
  assert.deepEqual(parseYears("nope", years), years);
  assert.deepEqual(parseYears("2019", years), [2019]);
  assert.deepEqual(parseYears("2019,2024", years), [2019, 2024]);
});

test("visibleLegs filters by year and keeps every leg for the full set", () => {
  assert.equal(visibleLegs(legs, years).length, legs.length);
  const only2019 = visibleLegs(legs, [2019]);
  assert.ok(only2019.length > 0);
  assert.ok(only2019.every((leg) => leg.year === 2019));
});

test("great-circle paths cross the antimeridian without jumping", () => {
  const airports = raw.airports as Record<string, Airport>;
  const coords = greatCircle(airports.LAX, airports.SYD);
  assert.ok(coords.some(([lon]) => lon < -180));
  for (let i = 1; i < coords.length; i++) {
    assert.ok(Math.abs(coords[i][0] - coords[i - 1][0]) <= 180);
  }
});
