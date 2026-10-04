import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("tfl", "routes/tfl.tsx"),
  route("tfl/:cameraId", "routes/tfl.$cameraId.tsx"),
  route("places", "routes/places.tsx"),
  route("places/:id", "routes/places.$id.tsx"),
  route("api/tfl", "routes/api.tfl.ts"),
  route("api/geocode", "routes/api.geocode.ts"),
  route("api/places", "routes/api.places.ts"),
  route("api/places/:id", "routes/api.places.$id.ts"),
] satisfies RouteConfig;
