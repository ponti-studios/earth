import type { ComponentProps, ReactNode } from "react";

import { cn } from "../../lib/utils";

interface MetricCardProps extends ComponentProps<"div"> {
  label: string;
  value: ReactNode;
  change?: ReactNode;
}

/** Label/value/change stat tile. */
export function MetricCard({ label, value, change, className, ...props }: MetricCardProps) {
  return (
    <div className={cn("ui-flat-card", className)} {...props}>
      <p className="ui-data-label mb-2">{label}</p>
      <p className="ui-data-value">{value ?? "—"}</p>
      {change != null ? <p className="text-muted-foreground mt-1.5 text-xs">{change}</p> : null}
    </div>
  );
}
