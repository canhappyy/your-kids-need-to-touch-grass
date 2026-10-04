import {
  localDateKey,
  parseLocalDateKey,
  shiftLocalDateKey,
} from "@/lib/planner-dates";
import type { PlannerView } from "@/types/planner";

export function plannerMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function movePlannerPeriod(
  view: PlannerView,
  displayedMonth: Date,
  selectedDate: Date,
  amount: number,
): { displayedMonth: Date; selectedDate: Date } {
  if (view === "month") {
    const month = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + amount,
      1,
      12,
    );
    return { displayedMonth: month, selectedDate: month };
  }

  const nextKey = shiftLocalDateKey(localDateKey(selectedDate), amount * 7);
  const nextDate = parseLocalDateKey(nextKey) ?? selectedDate;
  return { displayedMonth: plannerMonth(nextDate), selectedDate: nextDate };
}
