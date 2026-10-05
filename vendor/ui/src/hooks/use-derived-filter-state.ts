import { useCallback, useMemo, useState } from "react";

import type { ActiveFilter } from "../components/filters/active-filters-bar";

export interface FilterConfig {
  default: string;
  label?: (value: string) => string;
}

interface UseDerivedFilterStateOptions<T extends Record<string, FilterConfig>> {
  fields: T;
  sync: {
    read: () => Record<string, string>;
    write: (values: Record<string, string>) => void;
  };
}

export function useDerivedFilterState<T extends Record<string, FilterConfig>>({
  fields,
  sync,
}: UseDerivedFilterStateOptions<T>) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const read = sync.read();
    const initial: Record<string, string> = {};
    for (const key of Object.keys(fields)) {
      initial[key] = read[key] ?? fields[key].default;
    }
    return initial;
  });

  const setValue = useCallback(
    (key: string, value: string) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value };
        sync.write(next);
        return next;
      });
    },
    [sync],
  );

  const clearAll = useCallback(() => {
    const reset: Record<string, string> = {};
    for (const key of Object.keys(fields)) {
      reset[key] = fields[key].default;
    }
    setValues(reset);
    sync.write(reset);
  }, [fields, sync]);

  const activeFilters: ActiveFilter[] = useMemo(() => {
    return Object.entries(values)
      .filter(([, v]) => v !== "")
      .map(([key, v]) => ({
        id: key,
        label: fields[key]?.label ? fields[key].label!(v) : `${key}: ${v}`,
        onRemove: () => setValue(key, ""),
      }));
  }, [values, fields, setValue]);

  const hasActive = activeFilters.length > 0;

  return {
    values,
    setValue,
    activeFilters,
    clearAll,
    hasActive,
  };
}
