import { ArrowDown, ArrowUp, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

export interface FilterChipProps {
  label: ReactNode;
  onRemove: () => void;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "sort";
  direction?: "asc" | "desc";
  role?: string;
}

export function FilterChip({
  label,
  onRemove,
  onClick,
  className,
  variant = "default",
  direction,
  role,
}: FilterChipProps) {
  const isSort = variant === "sort";
  const DirIcon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : null;

  return (
    <span
      role={role}
      aria-label={typeof label === "string" ? `${label} filter` : "filter"}
      className={cn(
        "border-border bg-secondary text-secondary-foreground inline-flex items-center rounded-full border text-xs font-medium",
        isSort && "border-dashed",
        className,
      )}
    >
      <button
        type="button"
        disabled={!onClick}
        className="focus-visible:ring-ring inline-flex items-center rounded-full px-3 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-default"
        onClick={onClick}
      >
        {isSort && DirIcon ? <DirIcon className="mr-1 size-4" /> : null}
        {label}
      </button>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mr-0.5 flex size-6 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={onRemove}
        aria-label={`Remove filter: ${typeof label === "string" ? label : "selected filter"}`}
      >
        <X className="size-4" aria-hidden />
      </button>
    </span>
  );
}
