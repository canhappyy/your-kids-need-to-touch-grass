"use client";

import { Plus } from "lucide-react";

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

import { PlannedActivityItem } from "./planned-activity-item";

/**
 * Properties for the `WeekPlannerView` component.
 */
type WeekPlannerViewProps = {
  /** List of all planned activities scheduled by the user. */
  activities: PlannedActivity[];
  /** The anchor date determining which 7-day Monday-to-Sunday week is displayed. */
  selectedDate: Date;
  /** Today's active date (for styling current day badges and calculating plannable window). */
  today: Date;
  /** Optional callback fired when a day is focused or clicked. */
  onSelectDate?: (date: Date) => void;
  /** Optional callback fired when clicking "Add activity" on a particular day row. */
  onAddActivity?: (date: Date) => void;
  /** Optional callback fired when removing an activity by ID. */
  onRemoveActivity?: (id: string) => void;
};

/**
 * Weekly chronological planner view.
 *
 * Renders a vertical 7-day timeline (Monday through Sunday) for the selected week:
 * - Each row features a day badge with day of the week and date number, highlighting "Today".
 * - Shows Victorian public holiday and school term event indicators.
 * - Displays all planned activities scheduled on that day with direct removal affordances.
 * - Provides an inline "+ Add activity" button for eligible dates within the 14-day window.
 *
 * @param props - Week planner properties including activities and event callbacks.
 * @returns The rendered 7-day weekly schedule timeline.
 */
export function WeekPlannerView({
  activities,
  selectedDate,
  today,
  onSelectDate,
  onAddActivity,
  onRemoveActivity,
}: WeekPlannerViewProps) {
  // Compute Monday date key of the active week
  const weekStartKey = localDateKey(startOfLocalWeek(selectedDate));
  // Today's date key for highlighting current day badge
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
              isToday
                ? "border-[#93AB63]/80 bg-white/80"
                : "border-zinc-200/90",
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
                    <PlannedActivityItem
                      key={activity.id}
                      activity={activity}
                      onRemove={onRemoveActivity}
                      removeVariant="ghost"
                    />
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
