import { redirect } from "react-router";

// The cameras route is gone — cameras are a map layer now.
// Preserve old bookmarks by sending them to the map.
export function loader() {
  return redirect("/");
}
