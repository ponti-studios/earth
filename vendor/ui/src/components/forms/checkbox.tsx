"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "border-input bg-background aria-checked:bg-primary aria-checked:text-primary-foreground aria-checked:border-primary focus-visible:outline-ring size-4 shrink-0 rounded-[4px] border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        "aria-[checked=mixed]:bg-primary aria-[checked=mixed]:text-primary-foreground aria-[checked=mixed]:border-primary",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
        render={(props, state) => (
          <span {...props}>
            {state.indeterminate ? (
              <MinusIcon className="size-3" />
            ) : (
              <CheckIcon className="size-3" />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
