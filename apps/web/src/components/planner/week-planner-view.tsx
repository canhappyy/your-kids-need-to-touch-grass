"use client";

import { CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getImportantDatesForDate } from "@/data/victorian-important-dates";
import {
  isPlannableDate,
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
  onSelectDate?: (date: Date) => void;
  onAddActivity?: (date: Date) => void;
  onRemoveActivity?: (id: string) => void;
};

export function WeekPlannerView({
  activities,
  selectedDate,
  today,
  onSelectDate,
  onAddActivity,
  onRemoveActivity,
}: WeekPlannerViewProps) {
  const weekStartKey = localDateKey(startOfLocalWeek(selectedDate));
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
        const canPlan = isPlannableDate(dateKey, today);
        const isToday = dateKey === todayKey;

        return (
          <article
            key={dateKey}
            className={cn(
              "grid grid-cols-[3.25rem_1fr] gap-3 rounded-2xl border bg-white/55 p-3.5 shadow-xs transition-colors sm:p-4",
              isToday ? "border-[#93AB63]/80 bg-white/80" : "border-zinc-200/90",
            )}
          >
            {/* Date column */}
            <div className="flex flex-col items-center pt-0.5 select-none">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                {date.toLocaleDateString("en-AU", { weekday: "short" })}
              </span>
              <span
                className={cn(
                  "mt-1 flex size-10 items-center justify-center rounded-full text-lg font-bold shadow-xs",
                  isToday
                    ? "bg-[#E4633C] text-white"
                    : "bg-[#EEF2E8] text-zinc-800",
                )}
              >
                {date.getDate()}
              </span>
              {isToday && (
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#E4633C]">
                  Today
                </span>
              )}
            </div>

            {/* Details & actions column */}
            <div className="min-w-0 space-y-3">
              {/* Victorian important dates banner */}
              {importantDates.length > 0 && (
                <div className="space-y-1">
                  {importantDates.map((importantDate) => (
                    <span
                      key={importantDate.id}
                      className="inline-block rounded-md bg-[#E4633C]/10 px-2 py-0.5 text-xs font-semibold text-[#D65331]"
                    >
                      Public calendar · {importantDate.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Planned activities list */}
              {planned.length === 0 ? (
                <p className="text-sm text-zinc-500">Nothing planned yet</p>
              ) : (
                <div className="space-y-2">
                  {planned.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-[#93AB63]/40 bg-white/85 p-2.5 shadow-2xs sm:items-center sm:p-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <h4 className="font-semibold text-sm text-zinc-900 truncate">
                          {activity.name}
                        </h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3.5 text-zinc-400" />
                            {activity.durationMinutes} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5 text-zinc-400" />
                            {activity.locationLabel}
                          </span>
                        </div>
                      </div>

                      {onRemoveActivity && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove ${activity.name}`}
                          onClick={() => onRemoveActivity(activity.id)}
                          className="h-8 shrink-0 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-400"
                        >
                          <Trash2 className="size-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Direct Add Activity Button */}
              <div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canPlan}
                  onClick={() => {
                    onSelectDate?.(date);
                    onAddActivity?.(date);
                  }}
                  className="h-8 rounded-full bg-[#93AB63] px-3.5 text-xs font-medium text-white hover:bg-[#819953] transition-colors disabled:opacity-50"
                >
                  <Plus className="size-3.5 mr-1" />
                  Add activity
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
