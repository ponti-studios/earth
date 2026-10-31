import { useEffect, useState, type ReactNode } from "react";

/**
 * MapLibre needs a browser. Render map subtrees only after hydration so the
 * rest of the route — stats, filters, leg list — still renders on the server.
 */
export default function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}
