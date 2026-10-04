import { useEffect, useRef, useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigation,
} from "react-router";
import "./app.css";
import CameraDetail from "./components/CameraDetail";
import LayerToggle from "./components/LayerToggle";
import MapLibreViewer from "./components/MapLibreViewer";
import PlaceDetail from "./components/PlaceDetail";
import QueryProvider from "./components/QueryProvider";
import SearchBar from "./components/SearchBar";
import SheetSkeleton from "./components/SheetSkeleton";
import { BottomSheet } from "@ponti-studios/ui/overlays";
import { parseLayers, serializeLayers } from "./lib/layers";
import { getPlace, getPlaceAttempts } from "./lib/server/places";
import { getTflCamera } from "./lib/server/tfl";
import type { Route } from "./+types/root";

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

export const links = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Ponti Studios - Earth</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const sel = url.searchParams.get("sel");
  const layersParam = url.searchParams.get("layers") ?? serializeLayers(parseLayers(null));

  if (sel?.startsWith("cam:")) {
    const camera = await getTflCamera(sel.slice(4)).catch(() => null);
    if (!camera) return { selection: null, layersParam };
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
    return { selection: { kind: "camera" as const, camera: { ...camera, lastPhotoAt } }, layersParam };
  }

  if (sel?.startsWith("place:")) {
    const id = Number(sel.slice("place:".length));
    if (!Number.isInteger(id)) return { selection: null, layersParam };
    const place = await getPlace(id).catch(() => null);
    if (!place) return { selection: null, layersParam };
    const attempts = await getPlaceAttempts(id).catch(() => []);
    return { selection: { kind: "place" as const, place, attempts }, layersParam };
  }

  return { selection: null, layersParam };
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { selection, layersParam } = loaderData;
  const location = useLocation();
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";
  const [sheetOpen, setSheetOpen] = useState(false);

  // Reopen the sheet whenever the selection or route changes (but keep the
  // collapsed stub on first load so the map owns the screen).
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    setSheetOpen(true);
  }, [location.key]);

  return (
    <QueryProvider>
      <div className="absolute inset-0 overflow-hidden bg-background">
        <ClientOnly>
          <MapLibreViewer />
        </ClientOnly>

        <SearchBar />
        <LayerToggle />

        <BottomSheet
          expanded={sheetOpen}
          onExpandedChange={setSheetOpen}
          label="Details"
          className="bg-background fixed bottom-4 left-1/2 z-100 w-[min(480px,calc(100vw-2rem))] max-h-[70vh] -translate-x-1/2 rounded-2xl border [box-shadow:0_8px_40px_rgb(0_0_0_/_0.12),0_2px_8px_rgb(0_0_0_/_0.06)]"
          scrollClassName="bottom-sheet-scroll p-4 pb-6"
        >
          {isNavigating ? (
            <SheetSkeleton />
          ) : selection?.kind === "camera" ? (
            <CameraDetail camera={selection.camera} layersParam={layersParam} />
          ) : selection?.kind === "place" ? (
            <PlaceDetail
              place={selection.place}
              attempts={selection.attempts}
              layersParam={layersParam}
            />
          ) : (
            <Outlet />
          )}
        </BottomSheet>
      </div>
    </QueryProvider>
  );
}

export function ErrorBoundary({ error }: { error?: unknown }) {
  let status = 500;
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center [box-shadow:0_8px_40px_rgb(0_0_0_/_0.12),0_2px_8px_rgb(0_0_0_/_0.06)]">
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
          System exception
        </p>
        <p className="mt-2 text-6xl font-bold text-destructive">{status}</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{message}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{details}</p>

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex min-h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Reload mission
          </button>
          <a
            href="/"
            className="inline-flex min-h-9 items-center rounded-md border px-4 text-sm font-medium"
          >
            Return home
          </a>
        </div>

        {stack && import.meta.env.DEV && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
              Stack trace
            </summary>
            <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">
              <code>{stack}</code>
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
