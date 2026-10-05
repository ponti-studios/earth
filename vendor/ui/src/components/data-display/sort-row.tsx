import { ArrowDownWideNarrow, ArrowUpWideNarrow, X } from "lucide-react";

import type { SortField, SortOption } from "../../hooks/sort.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../overlays/dropdown-menu";
import { Button } from "../primitives/button";

export interface SortRowProps {
  sortOption: SortOption;
  index: number;
  sortableFields: SortField[];
  usedFields: SortField[];
  updateSortOption: (index: number, option: SortOption) => void;
  removeSortOption: (index: number) => void;
}

function fieldLabel(field: SortField) {
  return field.charAt(0).toUpperCase() + field.slice(1);
}

export function SortRow({
  sortOption,
  index,
  sortableFields,
  usedFields,
  updateSortOption,
  removeSortOption,
}: SortRowProps) {
  const availableFieldsForCurrentSelect = sortableFields.filter(
    (field) => !usedFields.includes(field) || field === sortOption.field,
  );

  return (
    <div className="flex w-full items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="hover:bg-muted focus-visible:ring-ring flex-1 rounded-md px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {fieldLabel(sortOption.field)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {availableFieldsForCurrentSelect.map((field) => (
            <DropdownMenuItem
              key={field}
              onClick={() => updateSortOption(index, { ...sortOption, field })}
            >
              {fieldLabel(field)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="sm"
        className="size-8 p-0"
        aria-label={sortOption.direction === "asc" ? "Sorted ascending" : "Sorted descending"}
        onClick={() =>
          updateSortOption(index, {
            ...sortOption,
            direction: sortOption.direction === "asc" ? "desc" : "asc",
          })
        }
      >
        {sortOption.direction === "asc" ? (
          <ArrowUpWideNarrow className="size-4" />
        ) : (
          <ArrowDownWideNarrow className="size-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => removeSortOption(index)}
        className="size-8 p-0"
        aria-label="Remove sort criterion"
      >
        <X className="text-muted-foreground size-4" />
      </Button>
    </div>
  );
}
