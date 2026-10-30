/**
 * Collapse trailing slashes so route-level chrome checks match both
 * `/flights` and `/flights/`. The root path stays `/`.
 */
export function normalisePathname(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}
