import { CalendarIcon } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { ChangeEvent, RefObject } from "react";

import { cn } from "../../lib/utils";
import { formatDateInput } from "./date-utils";

export interface DateRangeValue {
  from?: Date | string | null;
  to?: Date | string | null;
}

interface DatePickerBaseProps {
  label?: string;
  helpText?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Earliest selectable date, "YYYY-MM-DD". */
  min?: string;
  /** Latest selectable date, "YYYY-MM-DD". */
  max?: string;
}

export interface SingleDatePickerProps extends DatePickerBaseProps {
  mode?: "single";
  /** Form field name — the native input submits "YYYY-MM-DD". */
  name?: string;
  value?: Date | string | null;
  defaultValue?: Date | string | null;
  onValueChange?: (value: string | null) => void;
}

export interface RangeDatePickerProps extends DatePickerBaseProps {
  mode: "range";
  /** Form field name for the range start — submits "YYYY-MM-DD". */
  startName?: string;
  /** Form field name for the range end — submits "YYYY-MM-DD". */
  endName?: string;
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onValueChange?: (value: { from: string | null; to: string | null }) => void;
  fromLabel?: string;
  toLabel?: string;
}

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

const LABEL_CLASS = "text-foreground text-sm font-medium";
const REQUIRED_CLASS = "after:text-destructive-text after:ml-0.5 after:content-['*']";
const SUBLABEL_CLASS = "text-muted-foreground text-xs font-medium";
const FIELD_CLASS =
  "bg-background text-foreground border-input h-10 w-full min-w-0 appearance-none border px-3 py-1 text-sm transition-colors " +
  "[&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 " +
  "placeholder:text-muted-foreground " +
  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 " +
  "aria-invalid:ring-destructive/20 aria-invalid:border-destructive";

/**
 * DatePickerIcon — the brand calendar glyph. The browser's own picker
 * indicator is hidden, so this is the visible affordance: clicking it calls
 * the input's `showPicker()` (falling back to focus, which opens the native
 * picker on iOS). It is not a tab stop because the input itself is the
 * focusable control and opens the picker on focus.
 */
function DatePickerIcon({
  inputRef,
  disabled,
  ariaLabel,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        const input = inputRef.current;
        if (!input) return;
        try {
          input.showPicker?.();
        } catch {
          input.focus();
        }
      }}
      className="border-border bg-background text-foreground flex size-10 shrink-0 items-center justify-center rounded-l-xl border"
    >
      <CalendarIcon className="size-4" aria-hidden />
    </button>
  );
}

function SingleDatePicker({
  id,
  name,
  label,
  helpText,
  error,
  className,
  disabled,
  required,
  min,
  max,
  value: controlledValue,
  defaultValue,
  onValueChange,
}: SingleDatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() =>
    formatDateInput(isControlled ? controlledValue : defaultValue),
  );
  const inputValue = (isControlled ? formatDateInput(controlledValue) : internalValue) || "";

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value || null;
    if (!isControlled) setInternalValue(next ?? "");
    onValueChange?.(next);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={inputId} className={cn(LABEL_CLASS, required && REQUIRED_CLASS)}>
          {label}
        </label>
      ) : null}
      <div className="flex w-full items-center">
        <DatePickerIcon inputRef={inputRef} disabled={disabled} ariaLabel="Open date picker" />
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="date"
          value={isControlled ? inputValue : undefined}
          defaultValue={isControlled ? undefined : inputValue}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : helpText ? descriptionId : undefined}
          className={cn(FIELD_CLASS, "rounded-l-none rounded-r-xl border-l-0")}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-destructive-text text-sm">
          {error}
        </p>
      ) : helpText ? (
        <p id={descriptionId} className="text-muted-foreground text-sm">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

function RangeDatePicker({
  id,
  label,
  helpText,
  error,
  className,
  disabled,
  required,
  min,
  max,
  startName,
  endName,
  value: controlledValue,
  defaultValue,
  onValueChange,
  fromLabel = "From",
  toLabel = "To",
}: RangeDatePickerProps) {
  const generatedId = useId();
  const startId = id ?? generatedId;
  const endId = `${startId}-to`;
  const descriptionId = `${startId}-description`;
  const errorId = `${startId}-error`;
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState<{ from: string; to: string }>(() => {
    const initial = (isControlled ? controlledValue : defaultValue) as DateRangeValue | undefined;
    return { from: formatDateInput(initial?.from), to: formatDateInput(initial?.to) };
  });
  const from = (isControlled ? formatDateInput(controlledValue?.from) : internal.from) || "";
  const to = (isControlled ? formatDateInput(controlledValue?.to) : internal.to) || "";

  function handleChange(which: "from" | "to") {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value || null;
      const next = which === "from" ? { from: nextValue, to } : { from, to: nextValue };
      if (!isControlled) setInternal({ from: next.from ?? "", to: next.to ?? "" });
      onValueChange?.({ from: next.from, to: next.to });
    };
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <span className={cn(LABEL_CLASS, required && REQUIRED_CLASS)}>{label}</span> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={startId} className={SUBLABEL_CLASS}>
            {fromLabel}
          </label>
          <div className="flex w-full items-center">
            <DatePickerIcon inputRef={startRef} disabled={disabled} ariaLabel={fromLabel} />
            <input
              ref={startRef}
              id={startId}
              name={startName}
              type="date"
              value={isControlled ? from : undefined}
              defaultValue={isControlled ? undefined : from}
              onChange={handleChange("from")}
              disabled={disabled}
              required={required}
              min={min}
              max={to || max || undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : helpText ? descriptionId : undefined}
              className={cn(FIELD_CLASS, "rounded-l-none rounded-r-xl border-l-0")}
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={endId} className={SUBLABEL_CLASS}>
            {toLabel}
          </label>
          <div className="flex w-full items-center">
            <DatePickerIcon inputRef={endRef} disabled={disabled} ariaLabel={toLabel} />
            <input
              ref={endRef}
              id={endId}
              name={endName}
              type="date"
              value={isControlled ? to : undefined}
              defaultValue={isControlled ? undefined : to}
              onChange={handleChange("to")}
              disabled={disabled}
              required={required}
              min={from || min || undefined}
              max={max}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : helpText ? descriptionId : undefined}
              className={cn(FIELD_CLASS, "rounded-l-none rounded-r-xl border-l-0")}
            />
          </div>
        </div>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-destructive-text text-sm">
          {error}
        </p>
      ) : helpText ? (
        <p id={descriptionId} className="text-muted-foreground text-sm">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

/**
 * DatePicker — native date inputs styled to the design system. The browser
 * owns the picker UI (calendar on desktop, wheel on iOS, etc.) so there is no
 * popover, calendar grid, or positioning layer in the bundle. Both a single
 * date (`name`) and a range (`startName` + `endName`) are supported; the
 * native inputs submit "YYYY-MM-DD" local date strings directly.
 *
 * @example
 * <DatePicker name="startDate" defaultValue="2020-01-15" label="Start date" />
 * <DatePicker
 *   mode="range"
 *   startName="startDate"
 *   endName="endDate"
 *   defaultValue={{ from: "2020-01-15", to: "2020-06-30" }}
 *   label="Active period"
 * />
 */
function DatePicker(props: DatePickerProps) {
  if (props.mode === "range") {
    return <RangeDatePicker {...props} />;
  }
  return <SingleDatePicker {...props} />;
}

export { DatePicker };
