import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect } from "react";
import Map, {
  Layer,
  NavigationControl,
  Source,
  useMap,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import { useNavigate } from "react-router";
import type { TflCamera } from "~/lib/public-data";
import { useTflCameras } from "../lib/hooks/use-tfl-cameras";

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
    if (!map || map.hasImage("camera-live")) return;
    const live = new Image();
    live.onload = () => map.addImage("camera-live", live);
    live.src = CAMERA_SVG_LIVE;
    const offline = new Image();
    offline.onload = () => map.addImage("camera-offline", offline);
    offline.src = CAMERA_SVG_OFFLINE;
  }, [map]);

  return null;
}

export default function MapLibreViewer() {
  const { data: cameras } = useTflCameras();
  const navigate = useNavigate();

  const geojson = cameras ? cameraToGeoJSON(cameras) : null;

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature || feature.layer.id !== "cameras") return;
      const { id } = feature.properties as { id: string };
      navigate(`/tfl/${id}`);
    },
    [navigate],
  );

  return (
    <div className="absolute inset-0 overflow-hidden touch-none">
      <Map
        initialViewState={LONDON_CENTER}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={geojson ? ["cameras"] : []}
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
      </Map>
    </div>
  );
}
