"use client";

import * as React from "react";

import { cn } from "../../lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // Association happens at usage (htmlFor or wrapping); the wrapper
    // itself cannot know its control.
    // oxlint-disable-next-line jsx-a11y/label-has-associated-control
    <label
      data-slot="label"
      className={cn(
        "text-sm leading-none font-medium select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        "group-has-disabled:cursor-not-allowed group-has-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
