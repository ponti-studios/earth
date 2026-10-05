import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import * as React from "react";

import { cn } from "../../lib/utils";

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
}) {
  const isFilling = typeof value === "number" && value > 0 && value < 100;
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("bg-muted relative h-2 w-full overflow-hidden rounded-full", className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "bg-primary relative h-full w-full flex-1 overflow-hidden transition-transform duration-300 ease-out",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      >
        {isFilling && (
          <span
            aria-hidden
            className="animate-progress-shimmer absolute inset-0 bg-[linear-gradient(90deg,transparent_35%,rgba(255,255,255,0.75)_50%,transparent_65%)]"
          />
        )}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
