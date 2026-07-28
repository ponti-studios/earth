import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("tfl", "routes/tfl.tsx"),
  route("tfl/:cameraId", "routes/tfl.$cameraId.tsx"),
  route("api/tfl", "routes/api.tfl.ts"),
] satisfies RouteConfig;
