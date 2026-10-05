import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "state-settle inline-flex w-fit shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded border border-transparent px-1.5 py-px text-xs font-medium [&>svg]:size-3 [&>svg]:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90",
        outline: "border-border text-foreground [a&]:hover:bg-muted",
        ghost: "bg-transparent text-foreground [a&]:hover:bg-muted",
        link: "text-foreground underline-offset-4 [a&]:hover:underline",
        /** Quiet metadata marker for real reference IDs (case/appointment/feed
         * numbers) — never for decorative sequence markers. */
        ref: "ref-tag border-transparent bg-transparent px-0 py-0 font-normal",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
