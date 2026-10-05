import { X } from "lucide-react";

import { cn } from "../../lib/utils";
import { FilterChip } from "./filter-chip";

export interface ActiveFilter {
  id: string;
  label: string;
  onRemove: () => void;
  onClick?: () => void;
  variant?: "filter" | "sort";
  direction?: "asc" | "desc";
}

export interface ActiveFiltersBarProps {
  filters: ActiveFilter[];
  className?: string;
  onClearAll?: () => void;
}

export function ActiveFiltersBar({ filters, className, onClearAll }: ActiveFiltersBarProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex w-full items-center h-10 gap-2 rounded-lg border border-border pr-0",
        className,
      )}
    >
      <span className="text-muted-foreground shrink-0 self-stretch flex items-center text-sm border-r px-4">
        Filters
      </span>
      <ul className="flex flex-1 min-w-0 items-center gap-2 overflow-x-auto scroll-fade-x pl-4 py-1.5">
        {filters.map((filter) => (
          <li key={filter.id} className="shrink-0">
            <FilterChip
              label={filter.label}
              onRemove={filter.onRemove}
              onClick={filter.onClick}
              variant={filter.variant === "sort" ? "sort" : "default"}
              direction={filter.direction}
            />
          </li>
        ))}
      </ul>
      {onClearAll ? (
        <button
          type="button"
          onClick={onClearAll}
          className="hover:bg-muted text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 items-center justify-center self-stretch aspect-square rounded-r-lg border-l border-border transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Clear all"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
