import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useState } from "react";
import Map, {
  Layer,
  NavigationControl,
  Source,
  useMap,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import { useSearchParams } from "react-router";
import type { TflCamera } from "~/lib/server/tfl";
import { parseLayers, serializeLayers } from "~/lib/layers";
import { useTflCameras } from "../lib/hooks/use-tfl-cameras";

type PlacePoint = {
  id: number;
  latitude: number | null;
  longitude: number | null;
  reviewStatus: string | null;
};

const LONDON_CENTER = { longitude: -0.1278, latitude: 51.5074, zoom: 12 };

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function cameraToGeoJSON(cameras: TflCamera[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: cameras.map((c) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [c.lng, c.lat] },
      properties: { id: c.tflId, available: c.available },
    })),
  };
}

function placesToGeoJSON(places: PlacePoint[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: places
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.longitude!, p.latitude!] },
        properties: { id: p.id, reviewStatus: p.reviewStatus ?? "unknown" },
      })),
  };
}

function usePlaces() {
  const [places, setPlaces] = useState<PlacePoint[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/places?filter=all")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data?.places) setPlaces(data.places);
        })
        .catch(() => {});
    };
    load();
    window.addEventListener("places:changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("places:changed", load);
    };
  }, []);
  return places;
}

const CAMERA_SVG_LIVE =
  "data:image/svg+xml;base64," +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></svg>',
  );

const CAMERA_SVG_OFFLINE =
  "data:image/svg+xml;base64," +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></svg>',
  );

function CameraIcons() {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map) return;
    const live = new Image();
    live.onload = () => {
      if (!map.hasImage("camera-live")) map.addImage("camera-live", live);
    };
    live.src = CAMERA_SVG_LIVE;
    const offline = new Image();
    offline.onload = () => {
      if (!map.hasImage("camera-offline")) map.addImage("camera-offline", offline);
    };
    offline.src = CAMERA_SVG_OFFLINE;
  }, [map]);

  return null;
}

export default function MapLibreViewer() {
  const { data: cameras } = useTflCameras();
  const places = usePlaces();
  const [params, setParams] = useSearchParams();
  const enabled = parseLayers(params.get("layers"));
  const showCameras = enabled.includes("cameras");
  const showPlaces = enabled.includes("places");

  const geojson = cameras && showCameras ? cameraToGeoJSON(cameras) : null;
  const placesGeojson = places && showPlaces ? placesToGeoJSON(places) : null;

  const select = useCallback(
    (sel: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!next.get("layers")) next.set("layers", serializeLayers(parseLayers(null)));
          next.set("sel", sel);
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setParams],
  );

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      if (feature.layer.id === "cameras") {
        const { id } = feature.properties as { id: string };
        select(`cam:${id}`);
      } else if (feature.layer.id === "places") {
        const { id } = feature.properties as { id: number };
        select(`place:${id}`);
      }
    },
    [select],
  );

  return (
    <div className="absolute inset-0 overflow-hidden touch-none">
      <Map
        initialViewState={LONDON_CENTER}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={[
          ...(geojson ? ["cameras"] : []),
          ...(placesGeojson ? ["places"] : []),
        ]}
        onClick={onClick}
        cursor="auto"
      >
        <NavigationControl position="bottom-right" />
        <CameraIcons />

        {geojson && (
          <Source id="cameras" type="geojson" data={geojson}>
            <Layer
              id="cameras"
              type="symbol"
              layout={{
                "icon-image": [
                  "case",
                  ["==", ["get", "available"], "true"],
                  "camera-live",
                  "camera-offline",
                ],
                "icon-size": 1.25,
                "icon-allow-overlap": true,
              }}
            />
          </Source>
        )}

        {placesGeojson && (
          <Source id="places-src" type="geojson" data={placesGeojson}>
            <Layer
              id="places"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
                "circle-color": [
                  "match",
                  ["get", "reviewStatus"],
                  "ok",
                  "#22c55e",
                  "needs_review",
                  "#f59e0b",
                  "no_match",
                  "#f87171",
                  "#9ca3af",
                ],
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
