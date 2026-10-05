import { useId, useMemo } from "react";

import { cn } from "../../lib/utils";
import { Spinner } from "../feedback/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../forms/select";

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: FilterSelectOption[];
  label: string;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  emptyLabel?: string;
  className?: string;
  id?: string;
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "All",
  disabled = false,
  isLoading = false,
  emptyLabel = "No options available",
  className,
  id,
}: FilterSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const items = useMemo(
    () => [{ value: null, label: placeholder }, ...options],
    [options, placeholder],
  );

  return (
    <div className={cn("space-y-2 min-w-36", className)}>
      <label htmlFor={selectId}>{label}</label>
      <Select value={value} onValueChange={onChange} items={items}>
        <SelectTrigger id={selectId} disabled={disabled} aria-label={label} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background max-h-[250px] min-w-36 overflow-y-auto">
          <SelectItem>{placeholder}</SelectItem>
          {isLoading ? (
            <Spinner presentation="centered" size="sm" />
          ) : options.length === 0 ? (
            <div className="text-muted-foreground px-2 py-1.5 text-sm">{emptyLabel}</div>
          ) : (
            options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
