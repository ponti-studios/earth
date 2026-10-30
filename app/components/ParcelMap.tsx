import "maplibre-gl/dist/maplibre-gl.css";
import Map, { Layer, Marker, NavigationControl, Source } from "react-map-gl/maplibre";
import type { Coordinates, GeoPoint } from "~/lib/parcels";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const WORLD_VIEW = { longitude: -20, latitude: 30, zoom: 1.4 };

export type ParcelMapRoute = {
  id: string;
  originName: string;
  destinationName: string;
  origin: Coordinates;
  destination: Coordinates;
  coords: GeoPoint[];
  marker: GeoPoint;
};

function routeData(coords: GeoPoint[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      },
    ],
  };
}

function bounds(coords: GeoPoint[]): [[number, number], [number, number]] {
  const lons = coords.map((point) => point[0]);
  const lats = coords.map((point) => point[1]);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
}

export default function ParcelMap({
  route,
  emoji,
  emptyLabel = "Save a tracking number to draw its route.",
}: {
  route: ParcelMapRoute | null;
  emoji: string;
  emptyLabel?: string;
}) {
  const initialViewState = route
    ? { bounds: bounds(route.coords), fitBoundsOptions: { padding: 64 } }
    : WORLD_VIEW;

  return (
    <div className="bg-card relative h-full w-full overflow-hidden">
      <Map
        key={route?.id ?? "world"}
        initialViewState={initialViewState}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {route && (
          <>
            <Source id="parcel-route" type="geojson" data={routeData(route.coords)}>
              <Layer
                id="parcel-route-glow"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{
                  "line-color": "#ff7652",
                  "line-width": 9,
                  "line-blur": 8,
                  "line-opacity": 0.35,
                }}
              />
              <Layer
                id="parcel-route-core"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{ "line-color": "#ff7652", "line-width": 2.4, "line-opacity": 0.95 }}
              />
            </Source>

            <Marker longitude={route.origin.lon} latitude={route.origin.lat} anchor="center">
              <span
                title={route.originName}
                className="border-foreground/70 bg-background block size-2.5 rounded-full border-2 shadow-sm"
              />
            </Marker>
            <Marker
              longitude={route.destination.lon}
              latitude={route.destination.lat}
              anchor="center"
            >
              <span
                title={route.destinationName}
                className="border-foreground/70 bg-background block size-2.5 rounded-full border-2 shadow-sm"
              />
            </Marker>
            <Marker longitude={route.marker[0]} latitude={route.marker[1]} anchor="center">
              <span
                title={`${emoji} current position`}
                className="grid size-9 place-items-center rounded-full bg-white text-lg shadow-[0_2px_10px_rgb(0_0_0_/_0.35)] ring-1 ring-black/10"
                style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif' }}
              >
                {emoji}
              </span>
            </Marker>
          </>
        )}
      </Map>

      {!route && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
          <p className="border-border bg-background/90 text-muted-foreground max-w-xs rounded-md border px-3 py-2 text-center text-xs leading-relaxed">
            {emptyLabel}
          </p>
        </div>
      )}
    </div>
  );
}
