import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "../../lib/utils";

type SurfacePanelProps<T extends ElementType = "div"> = { as?: T } & Omit<
  ComponentPropsWithoutRef<T>,
  "as"
>;

/** Rounded, bordered surface panel — a generic content container. */
export function SurfacePanel<T extends ElementType = "div">({
  as,
  className,
  ...props
}: SurfacePanelProps<T>) {
  const Component = as ?? "div";
  return (
    <Component
      className={cn("border-border bg-card rounded-3xl border p-5", className)}
      {...props}
    />
  );
}
