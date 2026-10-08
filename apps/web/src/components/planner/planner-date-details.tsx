"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getImportantDatesForDate } from "@/data/victorian-important-dates";
import { isPlannableDate, localDateKey } from "@/lib/planner-dates";
import { PLANNING_WINDOW_MESSAGE } from "@/lib/planned-activities";
import type { PlannedActivity } from "@/types/planner";

import { PlannedActivityItem } from "./planned-activity-item";

type PlannerDateDetailsProps = {
  activities: PlannedActivity[];
  selectedDate: Date;
  today: Date;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

export function PlannerDateDetails({
  activities,
  selectedDate,
  today,
  onAdd,
  onRemove,
}: PlannerDateDetailsProps) {
  const dateKey = localDateKey(selectedDate);
  const importantDates = getImportantDatesForDate(dateKey);
  const planned = activities.filter(
    (activity) => activity.plannedDate === dateKey,
  );
  const canPlan = isPlannableDate(dateKey, today);

  return (
    <Card className="border-[#93AB63]/60 bg-white/60 shadow-sm ring-0">
      <CardHeader>
        <CardTitle className="text-lg">
          {selectedDate.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {importantDates.length > 0 && (
          <div className="space-y-1 rounded-xl border border-[#E4633C]/25 bg-[#E4633C]/8 p-3 text-sm text-[#B8482C]">
            {importantDates.map((date) => (
              <p key={date.id} className="font-semibold">
                {date.name}
              </p>
            ))}
          </div>
        )}

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

        <Button
          className="h-11 w-full rounded-full bg-[#93AB63] text-white hover:bg-[#819953]"
          disabled={!canPlan}
          onClick={onAdd}
        >
          <Plus />
          Add activity
        </Button>
        {!canPlan && (
          <p role="status" className="text-sm text-amber-800">
            {PLANNING_WINDOW_MESSAGE}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
