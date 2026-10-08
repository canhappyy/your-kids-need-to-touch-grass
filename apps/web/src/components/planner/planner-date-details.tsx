"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getImportantDatesForDate } from "@/data/victorian-important-dates";
import { isPlannableDate, localDateKey } from "@/lib/planner-dates";
import { PLANNING_WINDOW_MESSAGE } from "@/lib/planned-activities";
import type { PlannedActivity } from "@/types/planner";

import { PlannedActivityItem } from "./planned-activity-item";

/**
 * Properties for the `PlannerDateDetails` sidebar card.
 */

type PlannerDateDetailsProps = {
  /** All saved planned activities in the user's local schedule. */
  activities: PlannedActivity[];
  /** The currently selected calendar date being viewed. */
  selectedDate: Date;
  /** Today's active date (used to calculate valid future planning windows). */
  today: Date;
  /** Callback fired when the parent clicks "Add activity" for this date. */
  onAdd: () => void;
  /** Callback fired to remove an activity by its unique ID. */
  onRemove: (id: string) => void;
};

/**
 * Sidebar details panel for the Month Planner view.
 *
 * Displays:
 * 1. Formatted heading for the selected date (e.g. "Saturday, 11 October").
 * 2. Victorian public calendar alerts (school holidays, public holidays).
 * 3. List of activities scheduled on this specific date.
 * 4. An "Add activity" button that redirects to the search flow with `planDate` preset,
 *    or disables the action if the date is outside the 14-day planning window.
 *
 * @param props - Component configuration including activities, selected date, and action handlers.
 * @returns The rendered date details card.
 */
export function PlannerDateDetails({
  activities,
  selectedDate,
  today,
  onAdd,
  onRemove,
}: PlannerDateDetailsProps) {
  // Convert selected date into canonical ISO YYYY-MM-DD string
  const dateKey = localDateKey(selectedDate);

  // Retrieve any Victorian public or school holiday events for this date
  const importantDates = getImportantDatesForDate(dateKey);

  // Filter activities scheduled specifically on this date
  const planned = activities.filter(
    (activity) => activity.plannedDate === dateKey,
  );

  // Verify whether the date falls within the allowable 14-day future window
  const canPlan = isPlannableDate(dateKey, today);

  return (
    <Card className="border-[#93AB63]/60 bg-white/60 shadow-sm ring-0">
      <CardHeader>
        {/* Formatted Date Header (e.g. "Monday, 12 October") */}
        <CardTitle className="text-lg">
          {selectedDate.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Victorian Important Events Banner */}
        {importantDates.length > 0 && (
          <div className="space-y-1 rounded-xl border border-[#E4633C]/25 bg-[#E4633C]/8 p-3 text-sm text-[#B8482C]">
            {importantDates.map((date) => (
              <p key={date.id} className="font-semibold">
                {date.name}
              </p>
            ))}
          </div>
        )}

        {/* Planned Activities or Empty State */}
        {planned.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing planned yet</p>
        ) : (
          <div className="space-y-3">
            {planned.map((activity) => (
              <PlannedActivityItem
                key={activity.id}
                activity={activity}
                onRemove={onRemove}
                removeVariant="destructive"
              />
            ))}
          </div>
        )}

        {/* Add Activity CTA Button */}
        <Button
          className="h-11 w-full rounded-full bg-[#93AB63] text-white hover:bg-[#819953]"
          disabled={!canPlan}
          onClick={onAdd}
        >
          <Plus />
          Add activity
        </Button>

        {/* Advisory message when date is past or too far in the future */}
        {!canPlan && (
          <p role="status" className="text-sm text-amber-800">
            {PLANNING_WINDOW_MESSAGE}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

