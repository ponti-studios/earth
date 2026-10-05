import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { XIcon } from "lucide-react";
import * as React from "react";

import { useIsMobile } from "../../hooks/use-mobile";
import { cn } from "../../lib/utils";

function Popover({ modal, ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const isMobile = useIsMobile();
  return <PopoverPrimitive.Root data-slot="popover" modal={modal ?? isMobile} {...props} />;
}

function PopoverTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger> & { asChild?: boolean }) {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      {...(asChild && React.isValidElement(children)
        ? { render: children as React.ReactElement }
        : {})}
      {...props}
    >
      {!asChild && children}
    </PopoverPrimitive.Trigger>
  );
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  children,
  side = "bottom",
  avoidCollisions = true,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
  side?: "top" | "right" | "bottom" | "left";
  avoidCollisions?: boolean;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Backdrop className="ui-mobile-sheet-backdrop" />
      <PopoverPrimitive.Positioner
        className="ui-mobile-sheet-positioner"
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionAvoidance={avoidCollisions ? undefined : { side: "none", align: "none" }}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 relative z-50 w-72 origin-(--transform-origin) rounded-md border p-4 outline-hidden ui-mobile-sheet-popup ui-mobile-popover-popup",
            className,
          )}
          {...props}
        >
          {children}
          <PopoverPrimitive.Close className="ui-mobile-sheet-close">
            <XIcon aria-hidden="true" />
            <span className="sr-only">Close</span>
          </PopoverPrimitive.Close>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
