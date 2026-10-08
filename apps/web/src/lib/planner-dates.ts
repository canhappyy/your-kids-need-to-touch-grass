/**
 * Maximum advance planning horizon in calendar days (365 days / 1 year).
 * Parents can plan future physical activities starting from today up to one full year ahead.
 */
export const PLANNING_WINDOW_DAYS = 365;

/**
 * Converts a JavaScript Date into a local date key formatted as YYYY-MM-DD.
 *
 * Uses the local calendar components (year, month, day) rather than UTC to ensure
 * scheduling, storage, and comparisons stay synchronized with the parent's actual local day.
 *
 * @param date - The JavaScript Date object to format.
 * @returns An ISO date key string in YYYY-MM-DD format.
 */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Safely parses a YYYY-MM-DD date key into a local JavaScript Date set to midday (12:00:00).
 *
 * Midday is intentionally chosen to avoid timezone and daylight savings shifts (DST)
 * that could accidentally roll the date forwards or backwards by an hour across midnight.
 *
 * @param dateKey - The date key string to parse (e.g. "2026-10-15").
 * @returns A validated Date instance at local noon, or null if the string is malformed or invalid.
 */
export function parseLocalDateKey(dateKey: string): Date | null {
  // Validate format strictly matches 4 digits, 2 digits, 2 digits
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);

  // Guard against rollover values like 2026-02-31 turning into March
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Adds or subtracts a specified number of calendar days from a YYYY-MM-DD date key.
 *
 * @param dateKey - The starting date key string in YYYY-MM-DD format.
 * @param days - Number of days to add (positive) or subtract (negative).
 * @returns The resulting date key string in YYYY-MM-DD format.
 * @throws Error if the supplied dateKey cannot be parsed as a valid calendar date.
 */
export function shiftLocalDateKey(dateKey: string, days: number): string {
  const date = parseLocalDateKey(dateKey);
  if (!date) throw new Error(`Invalid local date: ${dateKey}`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

/**
 * Returns the valid scheduling window boundaries [today, today + 365 days].
 *
 * @param now - Reference current date. Defaults to the current moment (`new Date()`).
 * @returns An object containing minDateKey (today) and maxDateKey (1 year in the future).
 */
export function getPlanningWindow(now = new Date()): {
  minDateKey: string;
  maxDateKey: string;
} {
  const minDateKey = localDateKey(now);
  return {
    minDateKey,
    maxDateKey: shiftLocalDateKey(minDateKey, PLANNING_WINDOW_DAYS),
  };
}

/**
 * Checks whether a given date key falls within the acceptable planning window.
 *
 * A date is plannable if it is a valid calendar date that is not in the past and does
 * not exceed 365 days into the future.
 *
 * @param dateKey - The date key string to evaluate (YYYY-MM-DD).
 * @param now - Reference current date. Defaults to `new Date()`.
 * @returns True if the date is today or up to 365 days in the future, false otherwise.
 */
export function isPlannableDate(dateKey: string, now = new Date()): boolean {
  if (!parseLocalDateKey(dateKey)) return false;
  const { minDateKey, maxDateKey } = getPlanningWindow(now);
  return dateKey >= minDateKey && dateKey <= maxDateKey;
}

/**
 * Extracts and sanitizes an optional plan date parameter from URL query strings.
 *
 * @param value - The raw query string parameter value, or null if omitted.
 * @param now - Reference current date. Defaults to `new Date()`.
 * @returns The validated date key string if plannable, or undefined if absent or invalid.
 */
export function readPlannableDateParam(
  value: string | null,
  now = new Date(),
): string | undefined {
  return value !== null && isPlannableDate(value, now) ? value : undefined;
}

/**
 * Computes the Monday starting the local calendar week for a given date.
 *
 * In Australia and ISO 8601 standard calendars, weeks start on Monday.
 *
 * @param date - The reference date inside the week.
 * @returns A new Date set to 12:00:00 on the Monday of that week.
 */
export function startOfLocalWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  // (day + 6) % 7 calculates days since Monday (where Sunday is day 0 -> 6 days since Monday)
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}
