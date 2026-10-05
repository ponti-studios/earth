"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

const Sheet = SheetPrimitive.Root;

function SheetTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger> & { asChild?: boolean }) {
  return (
    <SheetPrimitive.Trigger
      {...(asChild && React.isValidElement(children)
        ? { render: children as React.ReactElement }
        : {})}
      {...props}
    >
      {!asChild && children}
    </SheetPrimitive.Trigger>
  );
}

function SheetClose({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close> & { asChild?: boolean }) {
  return (
    <SheetPrimitive.Close
      {...(asChild && React.isValidElement(children)
        ? { render: children as React.ReactElement }
        : {})}
      {...props}
    >
      {!asChild && children}
    </SheetPrimitive.Close>
  );
}

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Backdrop>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Backdrop
    data-slot="sheet-overlay"
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const sheetClassName = [
  // Appearance
  "bg-background text-foreground rounded-xl border shadow-lg",
  // Layout
  "flex flex-col gap-6 p-4",
  // Position: floats off every edge, anchored to the bottom on mobile
  "fixed z-50 inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))]",
  // Size: mobile
  "max-h-[calc(100dvh-2rem)] min-h-[30dvh]",
  // Position: anchored to the right edge on desktop
  "md:inset-y-2 md:right-2 md:left-auto md:bottom-auto",
  // Size: desktop
  "md:w-3/4 md:max-w-sm md:min-h-0",
];

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Popup> {
  /** Applied to the built-in close button, alongside its default styling. */
  closeClassName?: string;
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Popup>,
  SheetContentProps
>(({ className, closeClassName, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Popup
      ref={ref}
      data-slot="sheet-content"
      className={cn(sheetClassName, className)}
      {...props}
    >
      <SheetPrimitive.Close
        className={cn(
          "text-muted-foreground hover:bg-muted hover:text-muted-foreground focus-visible:outline-ring absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-md border border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none md:top-4 md:right-4",
          closeClassName,
        )}
      >
        <X className="size-4.5" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Popup>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-2 text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold tracking-tight", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground max-w-prose text-sm", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
