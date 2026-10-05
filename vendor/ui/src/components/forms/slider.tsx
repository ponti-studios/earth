"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import * as React from "react";

import { cn } from "../../lib/utils";

type SliderProps = Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  "onValueChange" | "value" | "defaultValue"
> & {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
};

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      onValueChange,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledby,
      ...props
    },
    ref,
  ) => (
    <SliderPrimitive.Root
      ref={ref}
      {...props}
      onValueChange={(value) => onValueChange?.(Array.isArray(value) ? [...value] : [value])}
    >
      <SliderPrimitive.Control
        className={cn("relative flex w-full touch-none items-center py-2 select-none", className)}
      >
        <SliderPrimitive.Track className="bg-muted relative h-2 w-full grow rounded-full">
          <SliderPrimitive.Indicator className="bg-primary absolute h-full rounded-full" />
          <SliderPrimitive.Thumb
            aria-label={ariaLabel ?? "Slider"}
            aria-labelledby={ariaLabelledby}
            className="border-border focus-visible:border-ring focus-visible:bg-primary focus-visible:ring-ring bg-background z-10 block h-6 w-6 rounded-full border shadow-sm ring-1 ring-border/5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = "Slider";

export { Slider };
