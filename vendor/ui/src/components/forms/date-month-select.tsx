import { Calendar } from "lucide-react";
import { useMemo } from "react";

import { cn } from "../../lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface MonthOption {
  value: string;
  label: string;
}

export interface DateMonthSelectProps {
  selectedMonthYear: string;
  onMonthChange: (value: string) => void;
  monthsBack?: number;
  className?: string;
  placeholder?: string;
}

/** Select a `YYYY-MM` month from the last `monthsBack` months. */
export function DateMonthSelect({
  selectedMonthYear,
  onMonthChange,
  monthsBack = 12,
  className = "w-[200px]",
  placeholder = "Select month",
}: DateMonthSelectProps) {
  const monthOptions = useMemo<MonthOption[]>(() => {
    const options: MonthOption[] = [];
    const today = new Date();
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      options.push({
        value: `${year}-${month}`,
        label: date.toLocaleString("default", { month: "long", year: "numeric" }),
      });
    }
    return options;
  }, [monthsBack]);

  return (
    <div className="flex items-center">
      <div className="border-border bg-background text-foreground flex size-10 items-center justify-center rounded-l-xl border">
        <Calendar className="size-4" />
      </div>
      <Select
        value={selectedMonthYear}
        onValueChange={(v: string | null) => v != null && onMonthChange(v)}
      >
        <SelectTrigger
          className={cn(
            "border-border bg-background text-foreground min-h-10 max-h-10 rounded-l-none rounded-r-xl border-l-0",
            className,
          )}
          aria-label={placeholder}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Current month in `YYYY-MM` format. */
export const getCurrentMonthYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
};
