import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import * as React from "react";

import { cn } from "../../lib/utils";

interface ScrollAreaProps extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
  orientation?: "horizontal" | "vertical";
  snap?: "start" | "center" | "none";
}

/**
 * Full literal class names, not `snap-${snap}` — Tailwind's scanner only
 * picks up complete strings present in the source, so an interpolated class
 * name never generates any CSS.
 */
const SNAP_ALIGN_CLASS_NAME = {
  start: "snap-start",
  center: "snap-center",
  none: undefined,
} as const satisfies Record<NonNullable<ScrollAreaProps["snap"]>, string | undefined>;

/**
 * Overlay scrollbar: invisible at rest, fades in on hover/scroll and back
 * out on idle (data-hovering / data-scrolling from Base UI). Opacity-only,
 * transitions (not keyframes) since hover/scroll toggle rapidly.
 */
const scrollbarClassName = cn(
  "flex touch-none p-0.5 opacity-0 transition-opacity duration-150 ease-out",
  "data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
  "data-[orientation=vertical]:w-2.5",
  "data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col",
);

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "horizontal", snap = "none", ...props }, ref) => {
    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex overflow-hidden",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          className,
        )}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          className={cn(
            "scrollbar-hide flex overflow-auto",
            orientation === "horizontal" ? "min-w-0 flex-1 flex-row" : "min-h-0 flex-1 flex-col",
            snap !== "none" && (orientation === "horizontal" ? "snap-x" : "snap-y"),
            snap !== "none" && "snap-mandatory",
          )}
        >
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;
            return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
              className: cn(
                SNAP_ALIGN_CLASS_NAME[snap],
                (child.props as { className?: string }).className,
              ),
            });
          })}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.Scrollbar orientation="horizontal" className={scrollbarClassName}>
          <ScrollAreaPrimitive.Thumb className="bg-foreground/40 hover:bg-foreground/60 relative flex-1 rounded-full transition-colors duration-150 ease" />
        </ScrollAreaPrimitive.Scrollbar>
        <ScrollAreaPrimitive.Scrollbar orientation="vertical" className={scrollbarClassName}>
          <ScrollAreaPrimitive.Thumb className="bg-foreground/40 hover:bg-foreground/60 relative flex-1 rounded-full transition-colors duration-150 ease" />
        </ScrollAreaPrimitive.Scrollbar>
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    );
  },
);

ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
export type { ScrollAreaProps };
