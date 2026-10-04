"use client";

import { CalendarDays, MapPin } from "lucide-react";

import { getImportantDatesForDate } from "@/data/victorian-important-dates";
import {
  localDateKey,
  shiftLocalDateKey,
  startOfLocalWeek,
} from "@/lib/planner-dates";
import { cn } from "@/lib/utils";
import type { PlannedActivity } from "@/types/planner";

type WeekPlannerViewProps = {
  activities: PlannedActivity[];
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
};

export function WeekPlannerView({
  activities,
  selectedDate,
  today,
  onSelectDate,
}: WeekPlannerViewProps) {
  const weekStartKey = localDateKey(startOfLocalWeek(selectedDate));
  const selectedKey = localDateKey(selectedDate);
  const todayKey = localDateKey(today);

  return (
    <div aria-label="Weekly activity planner" className="space-y-3">
      {Array.from({ length: 7 }, (_, index) => {
        const dateKey = shiftLocalDateKey(weekStartKey, index);
        const date = new Date(`${dateKey}T12:00:00`);
        const importantDates = getImportantDatesForDate(dateKey);
        const planned = activities.filter(
          (activity) => activity.plannedDate === dateKey,
        );
        const isSelected = dateKey === selectedKey;

        return (
          <button
            key={dateKey}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectDate(date)}
            className={cn(
              "grid w-full grid-cols-[3.25rem_1fr] gap-3 rounded-2xl border bg-white/55 p-3 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63]",
              isSelected
                ? "border-[#93AB63] ring-1 ring-[#93AB63]/30"
                : "border-zinc-200 hover:border-[#93AB63]/60",
            )}
          >
            <span className="flex flex-col items-center">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                {date.toLocaleDateString("en-AU", { weekday: "short" })}
              </span>
              <span
                className={cn(
                  "mt-1 flex size-10 items-center justify-center rounded-full text-lg font-bold",
                  dateKey === todayKey
                    ? "bg-[#E4633C] text-white"
                    : "bg-[#EEF2E8] text-zinc-800",
                )}
              >
                {date.getDate()}
              </span>
            </span>

            <span className="min-w-0 space-y-2 py-0.5">
              {importantDates.map((importantDate) => (
                <span
                  key={importantDate.id}
                  className="block text-xs font-semibold text-[#D65331]"
                >
                  Public calendar · {importantDate.name}
                </span>
              ))}
              {planned.length === 0 ? (
                <span className="block text-sm text-zinc-500">
                  Nothing planned yet
                </span>
              ) : (
                planned.map((activity) => (
                  <span key={activity.id} className="block space-y-1">
                    <span className="block font-semibold text-zinc-800">
                      {activity.name}
                    </span>
                    <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {activity.durationMinutes} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {activity.locationLabel}
                      </span>
                    </span>
                  </span>
                ))
              )}
              <span className="block text-sm font-semibold text-[#728A46]">
                Select date
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
