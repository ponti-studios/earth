import { useCallback, useEffect, useMemo } from "react";
import { Layer, Source, useMap, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import { hubsToGeoJSON, legsToGeoJSON, type Airport, type FlightLeg } from "~/lib/flights";
import MapCanvas from "./MapCanvas";

const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-128, -42],
  [158, 66],
];

type Props = {
  legs: readonly FlightLeg[];
  airports: Record<string, Airport>;
  selectedLeg: FlightLeg | null;
  onSelectLeg: (legId: string | null) => void;
};

/** Frame the selected route, or the whole world when nothing is selected. */
function FocusLeg({ leg }: { leg: FlightLeg | null }) {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map) return;

    // The panel sits at the left on desktop and over the bottom on mobile;
    // pad the camera so a framed route lands in the visible part of the map.
    const narrow = window.innerWidth < 768;
    const padding = narrow
      ? { top: 40, bottom: Math.round(window.innerHeight * 0.64) + 24, left: 32, right: 32 }
      : 72;

    if (!leg) {
      map.fitBounds(WORLD_BOUNDS, { padding: narrow ? 32 : 48, duration: 700 });
      return;
    }

    const lngs = leg.coords.map(([lng]) => lng);
    const lats = leg.coords.map(([, lat]) => lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding, maxZoom: 6, duration: 900 },
    );
  }, [map, leg]);

  return null;
}

export default function FlightMap({ legs, airports, selectedLeg, onSelectLeg }: Props) {
  const routes = useMemo(() => legsToGeoJSON(legs), [legs]);
  const hubs = useMemo(() => hubsToGeoJSON(legs, airports), [legs, airports]);

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const id = feature?.properties?.id;
      onSelectLeg(typeof id === "string" ? id : null);
    },
    [onSelectLeg],
  );

  return (
    <MapCanvas
      initialViewState={{ bounds: WORLD_BOUNDS, fitBoundsOptions: { padding: 48 } }}
      navigationPosition="top-right"
      minZoom={0.8}
      maxPitch={0}
      dragRotate={false}
      touchPitch={false}
      interactiveLayerIds={["flight-routes-hit"]}
      onClick={onClick}
    >
      <FocusLeg leg={selectedLeg} />

      <Source id="flight-routes" type="geojson" data={routes}>
        <Layer
          id="flight-routes-glow"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ["get", "color"],
            "line-width": 8,
            "line-blur": 7,
            "line-opacity": 0.28,
          }}
        />
        <Layer
          id="flight-routes-air"
          type="line"
          filter={["!=", ["get", "mode"], "rail"]}
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": ["get", "color"],
            "line-width": 2,
            "line-opacity": 0.95,
          }}
        />
        <Layer
          id="flight-routes-rail"
          type="line"
          filter={["==", ["get", "mode"], "rail"]}
          layout={{ "line-join": "round" }}
          paint={{
            "line-color": ["get", "color"],
            "line-width": 2,
            "line-opacity": 0.95,
            "line-dasharray": [2, 1.6],
          }}
        />
        {/* Invisible fat line so thin routes are easy to tap. */}
        <Layer
          id="flight-routes-hit"
          type="line"
          layout={{ "line-cap": "round" }}
          paint={{ "line-color": "#000000", "line-width": 18, "line-opacity": 0.01 }}
        />
      </Source>

      <Source id="flight-hubs" type="geojson" data={hubs}>
        <Layer
          id="flight-hubs"
          type="circle"
          paint={{
            "circle-radius": ["+", 4, ["*", 1.5, ["sqrt", ["get", "count"]]]],
            "circle-color": "#111827",
            "circle-opacity": 0.9,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
          }}
        />
        <Layer
          id="flight-hub-labels"
          type="symbol"
          layout={{
            "text-field": ["get", "code"],
            "text-size": 10,
            "text-offset": [0.9, -0.9],
            "text-anchor": "bottom-left",
            "text-letter-spacing": 0.04,
          }}
          paint={{
            "text-color": "#111827",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.6,
          }}
        />
      </Source>

      {selectedLeg && (
        <Source id="flight-selected" type="geojson" data={legsToGeoJSON([selectedLeg])}>
          <Layer
            id="flight-selected-glow"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{
              "line-color": selectedLeg.color,
              "line-width": 11,
              "line-blur": 8,
              "line-opacity": 0.55,
            }}
          />
          <Layer
            id="flight-selected-core"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{ "line-color": "#0f172a", "line-width": 3 }}
          />
        </Source>
      )}
    </MapCanvas>
  );
}
