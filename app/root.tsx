import { useEffect, useState } from "react";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigation,
} from "react-router";
import "./app.css";
import BottomSheet from "./components/BottomSheet";
import MapLibreViewer from "./components/MapLibreViewer";
import QueryProvider from "./components/QueryProvider";
import SheetSkeleton from "./components/SheetSkeleton";

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

export default function App() {
  const location = useLocation();
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";

  return (
    <QueryProvider>
      <div className="absolute inset-0 overflow-hidden bg-background">
        <ClientOnly>
          <MapLibreViewer />
        </ClientOnly>

        <nav
          className="fixed top-5 left-1/2 z-200 flex -translate-x-1/2 items-center gap-0.5 rounded-full border bg-card p-0.5 [box-shadow:0_2px_12px_rgb(0_0_0_/_0.08)] max-sm:top-auto max-sm:bottom-[calc(1rem+48px+0.5rem)]"
          aria-label="Primary navigation"
        >
          <Link
            to="/tfl"
            className={`rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase no-underline transition-colors whitespace-nowrap ${
              location.pathname.startsWith("/tfl")
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <img src="/logo.tfl.500x500.webp" alt="" className="mr-1.5 inline-block size-3.5" />
            Cameras
          </Link>
        </nav>

        <BottomSheet>{isNavigating ? <SheetSkeleton /> : <Outlet />}</BottomSheet>
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
