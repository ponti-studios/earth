import { ListOrdered, PlusCircle } from "lucide-react";

import type { SortField, SortOption } from "../../hooks/sort.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../overlays/dropdown-menu";
import { Button } from "../primitives/button";
import { SortRow } from "./sort-row";

export interface SortControlsProps {
  sortOptions: SortOption[];
  sortableFields: SortField[];
  addSortOption: (option: SortOption) => void;
  updateSortOption: (index: number, option: SortOption) => void;
  removeSortOption: (index: number) => void;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  focusedSortIndex?: (number | null) | undefined;
}

/** Multi-field sort builder, driven by the `SortOption`/`SortField` shared types. */
export function SortControls({
  sortOptions,
  sortableFields,
  addSortOption,
  updateSortOption,
  removeSortOption,
  open,
  onOpenChange,
  focusedSortIndex,
}: SortControlsProps) {
  const availableFieldsToAdd = sortableFields.filter(
    (field) => !sortOptions.some((option) => option.field === field),
  );

  return (
    <DropdownMenu {...(open !== undefined && { open })} {...(onOpenChange && { onOpenChange })}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ListOrdered className="mr-2 size-4" />
          Sort
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 space-y-2 p-2">
        <DropdownMenuGroup className="space-y-1">
          <DropdownMenuLabel>Define Sort Order</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {sortOptions.map((sort, index) => {
            const usedFields = sortOptions
              .filter((_, i) => i !== index)
              .map((option) => option.field);
            return (
              <div
                key={sort.field}
                className={`rounded-sm ${index === focusedSortIndex ? "bg-muted" : ""}`}
              >
                <SortRow
                  sortOption={sort}
                  index={index}
                  sortableFields={sortableFields}
                  usedFields={usedFields}
                  updateSortOption={updateSortOption}
                  removeSortOption={removeSortOption}
                />
              </div>
            );
          })}
        </DropdownMenuGroup>
        {availableFieldsToAdd.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              type="button"
              onClick={() => {
                const firstAvailable = availableFieldsToAdd[0];
                if (firstAvailable) {
                  addSortOption({ field: firstAvailable, direction: "desc" });
                }
              }}
              className="hover:bg-muted focus-visible:ring-ring mt-1 flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <PlusCircle className="mr-2 size-4" />
              Add Sort Criterion
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
