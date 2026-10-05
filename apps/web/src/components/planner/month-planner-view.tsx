"use client";

import type { ComponentProps } from "react";

import { Calendar } from "@/components/ui/calendar";
import { getImportantDatesForDate } from "@/data/victorian-important-dates";
import { localDateKey } from "@/lib/planner-dates";
import { cn } from "@/lib/utils";
import type { PlannedActivity } from "@/types/planner";
import { PlannerCalendarDayButton } from "./planner-calendar-day-button";

type MonthPlannerViewProps = {
  activities: PlannedActivity[];
  displayedMonth: Date;
  selectedDate: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
};

export function MonthPlannerView({
  activities,
  displayedMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: MonthPlannerViewProps) {
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
        className={cn(
          props.className,
          "data-[selected-single=true]:bg-[#F0B6A31F] data-[selected-single=true]:text-zinc-900 data-[selected-single=true]:font-bold data-[selected-single=true]:border data-[selected-single=true]:border-[#E4633C]/40 data-[selected-single=true]:hover:bg-[#F0B6A31F] data-[selected-single=true]:[&>span]:opacity-100",
        )}
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
