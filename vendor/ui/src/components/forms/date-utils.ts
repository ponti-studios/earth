/**
 * Parse a date-only string ("YYYY-MM-DD") as a local calendar day instead of
 * UTC midnight, so negative-UTC-offset timezones don't render the previous day.
 * Accepts a `Date` (returned as-is when valid) and returns `undefined` for
 * null/undefined/invalid input.
 */
export function parseDateInput(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  // `new Date(year, month, day)` treats years from 0 through 99 as
  // 1900-based years. Native date inputs can temporarily expose those years
  // while a user is editing the year segment, so construct the date first and
  // set the full year explicitly to avoid turning `0002` into `1902`.
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Serialize a date to its "YYYY-MM-DD" form using local components, so the
 * value round-trips without a UTC shift. Returns "" for invalid input.
 */
export function formatDateInput(value: Date | string | null | undefined): string {
  const date = parseDateInput(value);
  if (!date) return "";
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's date as a "YYYY-MM-DD" local string. */
export function todayDateInput(): string {
  return formatDateInput(new Date());
}
