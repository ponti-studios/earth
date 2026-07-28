import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback } from "react";
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import { useNavigate } from "react-router";
import { useTflCameras } from "../lib/hooks/useOrbitData";

const LONDON_CENTER = { longitude: -0.1278, latitude: 51.5074, zoom: 12 };

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function cameraToGeoJSON(
  cameras: {
    id: string;
    commonName: string;
    view: string;
    available: string;
    lat: number;
    lng: number;
  }[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: cameras.map((c) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [c.lng, c.lat] },
      properties: { id: c.id, available: c.available },
    })),
  };
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
    <div className="earth-viewport">
      <Map
        initialViewState={LONDON_CENTER}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={geojson ? ["cameras"] : []}
        onClick={onClick}
        cursor="auto"
      >
        <NavigationControl position="bottom-right" />

        {geojson && (
          <Source id="cameras" type="geojson" data={geojson}>
            <Layer
              id="cameras"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-color": [
                  "case",
                  ["==", ["get", "available"], "true"],
                  "#10b981",
                  "#6b7280",
                ],
                "circle-opacity": 0.8,
                "circle-stroke-width": 1.5,
                "circle-stroke-color": [
                  "case",
                  ["==", ["get", "available"], "true"],
                  "#10b981",
                  "#6b7280",
                ],
                "circle-stroke-opacity": 0.6,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
