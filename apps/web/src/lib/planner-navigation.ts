import {
  localDateKey,
  parseLocalDateKey,
  shiftLocalDateKey,
} from "@/lib/planner-dates";
import type { PlannerView } from "@/types/planner";

/**
 * Normalizes a date to the first calendar day of its month at local midday.
 *
 * Used as a stable reference anchor for monthly calendar views.
 *
 * @param date - Any date within the target month.
 * @returns A Date object pointing to day 1 of the month at 12:00:00 local time.
 */
export function plannerMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

/**
 * Shifts the calendar forward or backward by a specified number of periods (months or weeks).
 *
 * Behavior:
 * - When in `"month"` view: moves the view by `amount` full calendar months and sets the selected date
 *   to the first of that new month.
 * - When in `"week"` view: shifts the active selected date by `amount * 7` days, updating the month
 *   indicator if the selected week crosses into another month.
 *
 * @param view - Current calendar view mode ("month" or "week").
 * @param displayedMonth - Currently displayed month anchor date.
 * @param selectedDate - Currently highlighted day date.
 * @param amount - Number of steps to navigate (+1 for next, -1 for previous).
 * @returns An object containing the updated `displayedMonth` and `selectedDate`.
 */
export function movePlannerPeriod(
  view: PlannerView,
  displayedMonth: Date,
  selectedDate: Date,
  amount: number,
): { displayedMonth: Date; selectedDate: Date } {
  // Monthly view navigation: shift full month increments
  if (view === "month") {
    const month = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + amount,
      1,
      12,
    );
    return { displayedMonth: month, selectedDate: month };
  }

  // Weekly view navigation: shift by exact multiples of 7 days
  const nextKey = shiftLocalDateKey(localDateKey(selectedDate), amount * 7);
  const nextDate = parseLocalDateKey(nextKey) ?? selectedDate;
  return { displayedMonth: plannerMonth(nextDate), selectedDate: nextDate };
}
