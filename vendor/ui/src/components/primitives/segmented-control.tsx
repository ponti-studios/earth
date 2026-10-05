"use client";

import { ToggleGroup as SegmentedPrimitive } from "@base-ui/react/toggle-group";
import { Toggle as SegmentedItemPrimitive } from "@base-ui/react/toggle";
import * as React from "react";

import { cn } from "../../lib/utils";

export type SegmentedOption = {
  value: string;
  label: React.ReactNode;
  ariaLabel?: string;
};

export type SegmentedControlProps = {
  options: SegmentedOption[];
  /** Selected values. Single mode: pass at most one. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** @default false — single-select. True allows several pressed. */
  multiple?: boolean;
  /** Accessible name for the group. Falls back to joining option labels. */
  label?: string;
  className?: string;
  itemClassName?: string;
};

// Pill-group single/multi toggle. Shape + pressed states are kit-owned;
// elevation and placement are app-owned via className.
export function SegmentedControl({
  options,
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  label,
  className,
  itemClassName,
}: SegmentedControlProps) {
  return (
    <SegmentedPrimitive
      data-slot="segmented-control"
      aria-label={label ?? options.map((o) => o.ariaLabel ?? o.value).join(", ")}
      multiple={multiple}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className={cn(
        "border-border bg-card inline-flex items-center gap-0.5 rounded-full border p-0.5",
        className,
      )}
    >
      {options.map((option) => (
        <SegmentedItemPrimitive
          key={option.value}
          data-slot="segmented-control-item"
          value={option.value}
          aria-label={option.ariaLabel ?? (typeof option.label === "string" ? option.label : option.value)}
          className={cn(
            "text-muted-foreground hover:text-foreground rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase transition-colors",
            "data-pressed:bg-foreground data-pressed:text-background",
            "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
            "data-disabled:pointer-events-none data-disabled:opacity-50",
            itemClassName,
          )}
        >
          {option.label}
        </SegmentedItemPrimitive>
      ))}
    </SegmentedPrimitive>
  );
}
