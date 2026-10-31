import type { ReactNode } from "react";
import Map, { NavigationControl, type MapProps } from "react-map-gl/maplibre";

/** One basemap for every map view in Earth. */
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

type MapCanvasProps = Omit<MapProps, "mapStyle"> & {
  children?: ReactNode;
  /** Hide the zoom controls when the map is decorative rather than usable. */
  navigation?: boolean;
  /** Where the zoom controls sit; move them clear of app-owned panels. */
  navigationPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

/**
 * Shared MapLibre canvas: Earth's basemap, styles and navigation controls in
 * one place so each view only supplies its own layers and camera.
 */
export default function MapCanvas({
  children,
  navigation = true,
  navigationPosition = "bottom-right",
  ...props
}: MapCanvasProps) {
  return (
    <Map mapStyle={MAP_STYLE} style={{ width: "100%", height: "100%" }} {...props}>
      {children}
      {navigation ? <NavigationControl position={navigationPosition} /> : null}
    </Map>
  );
}
