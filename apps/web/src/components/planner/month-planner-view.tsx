"use client";

import type { ComponentProps } from "react";

import { Calendar } from "@/components/ui/calendar";
import { getImportantDatesForDate } from "@/data/victorian-important-dates";
import { localDateKey } from "@/lib/planner-dates";
import { cn } from "@/lib/utils";
import type { PlannedActivity } from "@/types/planner";
import {
  PlannerCalendarDayButton,
  PLANNER_SELECTED_DAY_CLASSES,
} from "./planner-calendar-day-button";

/**
 * Properties for the `MonthPlannerView` component.
 */
type MonthPlannerViewProps = {
  /** Array of all planned activities scheduled by the user. */
  activities: PlannedActivity[];
  /** The first day of the calendar month currently on display. */
  displayedMonth: Date;
  /** The specific date currently selected by the parent. */
  selectedDate: Date;
  /** Callback fired when navigating to a different month. */
  onMonthChange: (month: Date) => void;
  /** Callback fired when selecting a specific day in the month calendar grid. */
  onSelectDate: (date: Date) => void;
};

/**
 * Monthly calendar grid view for scheduling family outdoor play and missions.
 *
 * Wraps the accessible `Calendar` component and provides custom day cell indicators:
 * - Orange badge dot for Victorian school terms and public holiday milestones.
 * - Green badge pill indicating the count of scheduled activities on that day.
 * - Full screen-reader accessibility with descriptive `aria-label`s announcing holidays and activity counts.
 * - Responsive cell sizing scaling from compact mobile screens up to desktop widths.
 *
 * @param props - Month view properties including activities and calendar date change handlers.
 * @returns The rendered monthly calendar grid.
 */
export function MonthPlannerView({
  activities,
  displayedMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: MonthPlannerViewProps) {
  /**
   * Custom day cell renderer injecting activity counters and holiday indicators.
   */
  function PlannerDayButton(
    props: ComponentProps<typeof PlannerCalendarDayButton>,
  ) {
    const dateKey = localDateKey(props.day.date);
    const importantDates = getImportantDatesForDate(dateKey);
    const plannedCount = activities.filter(
      (activity) => activity.plannedDate === dateKey,
    ).length;

    const details = [
      ...importantDates.map((date) => date.name),
      plannedCount > 0
        ? `${plannedCount} planned ${plannedCount === 1 ? "activity" : "activities"}`
        : "",
    ].filter(Boolean);
    const label = [
      props.day.date.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      ...details,
    ].join(", ");

    return (
      <PlannerCalendarDayButton
        {...props}
        aria-label={label}
        className={cn(props.className, PLANNER_SELECTED_DAY_CLASSES)}
      >
        <span>{props.day.date.getDate()}</span>
        {(importantDates.length > 0 || plannedCount > 0) && (
          <span aria-hidden="true" className="flex items-center gap-0.5">
            {importantDates.length > 0 && (
              <span className="size-1.5 rounded-full bg-[#E4633C]" />
            )}
            {plannedCount > 0 && (
              <span className="rounded-full bg-[#93AB63] px-1 text-[9px] font-bold text-white">
                {plannedCount}
              </span>
            )}
          </span>
        )}
      </PlannerCalendarDayButton>
    );
  }

  return (
    <Calendar
      aria-label="Monthly activity planner"
      className="w-full rounded-2xl bg-transparent p-0 [--cell-size:--spacing(9)] min-[360px]:[--cell-size:--spacing(10)] sm:[--cell-size:--spacing(14)]"
      classNames={{
        root: "w-full",
        month: "w-full",
        nav: "hidden",
        month_caption: "hidden",
      }}
      components={{ DayButton: PlannerDayButton }}
      mode="single"
      month={displayedMonth}
      onMonthChange={onMonthChange}
      onSelect={(date) => date && onSelectDate(date)}
      selected={selectedDate}
      showOutsideDays
    />
  );
}
