export const PLANNING_WINDOW_DAYS = 365;

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function shiftLocalDateKey(dateKey: string, days: number): string {
  const date = parseLocalDateKey(dateKey);
  if (!date) throw new Error(`Invalid local date: ${dateKey}`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

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

export function isPlannableDate(dateKey: string, now = new Date()): boolean {
  if (!parseLocalDateKey(dateKey)) return false;
  const { minDateKey, maxDateKey } = getPlanningWindow(now);
  return dateKey >= minDateKey && dateKey <= maxDateKey;
}

export function startOfLocalWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}
