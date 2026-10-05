import * as React from "react";

import { cn } from "../../lib/utils";

const sizeClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-8",
  xl: "size-12",
} as const;

export interface SpinnerProps extends React.ComponentProps<"output"> {
  label?: string | false;
  presentation?: "inline" | "centered";
  size?: keyof typeof sizeClasses;
}

export function Spinner({
  label = false,
  presentation = "inline",
  size = "md",
  className,
  ...props
}: SpinnerProps) {
  const accessibleLabel = typeof label === "string" ? label : "Loading";

  return (
    <output
      className={cn(
        "inline-flex items-center justify-center gap-2",
        presentation === "centered" && "flex w-full py-12",
        className,
      )}
      aria-label={accessibleLabel}
      {...props}
    >
      <span
        className={cn(
          "border-border border-t-primary rounded-full border-2 motion-safe:animate-spin",
          sizeClasses[size],
        )}
        aria-hidden="true"
      />
      {label && <span className="text-muted-foreground text-xs">{label}</span>}
    </output>
  );
}
