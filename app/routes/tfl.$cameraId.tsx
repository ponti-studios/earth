import { Link } from "react-router";
import { fetchTflCamera } from "~/lib/public-data";
import type { Route } from "./+types/tfl.$cameraId";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const camera = await fetchTflCamera(params.cameraId);
    if (!camera) return { camera: null };

    let lastPhotoAt: string | null = null;
    if (camera.imageUrl) {
      try {
        const head = await fetch(camera.imageUrl, { method: "HEAD" });
        const lastModified = head.headers.get("last-modified");
        if (lastModified) lastPhotoAt = lastModified;
      } catch {
        // non-critical
      }
    }

    return {
      camera: { ...camera, lastPhotoAt },
    };
  } catch (error) {
    console.error("Error fetching camera by ID:", error);
    return { camera: null };
  }
}

export default function TflCamera({ loaderData }: Route.ComponentProps) {
  const { camera } = loaderData;

  if (!camera) {
    return (
      <div className="space-y-3">
        <p className="ui-eyebrow">Camera not found</p>
        <Link to="/tfl" className="text-muted-foreground hover:text-foreground text-xs">
          ← Back to Cameras
        </Link>
      </div>
    );
  }

  const isLive = camera.available === "true";

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/tfl"
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          ← Cameras
        </Link>
        <div className="flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full ${isLive ? "bg-green-500" : "bg-muted-foreground"}`}
          />
          <span
            className={`font-mono text-[10px] tracking-wider uppercase ${isLive ? "text-green-500" : "text-muted-foreground"}`}
          >
            {isLive ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Camera name + metadata */}
      <div>
        <h2 className="text-foreground leading-tight font-semibold">{camera.commonName}</h2>
        <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-widest uppercase">
          {camera.tflId}
        </p>
        <div className="text-muted-foreground mt-2 space-y-1 font-mono text-[10px] tracking-widest uppercase">
          <div className="flex justify-between">
            <span>View</span>
            <span>{camera.view && camera.view.length > 0 ? camera.view : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Coordinates</span>
            <span>
              {camera.lat.toFixed(4)}°, {camera.lng.toFixed(4)}°
            </span>
          </div>
          {camera.lastPhotoAt && (
            <div className="flex justify-between">
              <span>Last photo</span>
              <span>
                {new Date(camera.lastPhotoAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/London",
                  timeZoneName: "short",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="bg-muted border-border flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border">
        {camera.imageUrl ? (
          <img
            src={camera.imageUrl}
            alt={camera.commonName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">
            No feed available
          </span>
        )}
      </div>
    </div>
  );
}
