import { useCallback, useEffect, useRef, useState } from "react";

interface UseFilterStateOptions<T> {
  initialFilters: T;
  onFiltersChange?: (filters: T) => void;
  debounceMs?: number;
}

export function useFilterState<T extends Record<string, unknown>>(
  options: UseFilterStateOptions<T>,
) {
  const { initialFilters, onFiltersChange, debounceMs } = options;
  const [filters, setFiltersState] = useState<T>(initialFilters);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;

  const setFilters = useCallback(
    (newFilters: T | ((prev: T) => T)) => {
      setFiltersState((prev) => {
        const updatedFilters = typeof newFilters === "function" ? newFilters(prev) : newFilters;

        if (debounceMs && debounceMs > 0) {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            onFiltersChangeRef.current?.(updatedFilters);
          }, debounceMs);
        } else {
          onFiltersChangeRef.current?.(updatedFilters);
        }

        return updatedFilters;
      });
    },
    [debounceMs],
  );

  const updateFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setFilters],
  );

  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters);
    onFiltersChangeRef.current?.(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
  };
}
