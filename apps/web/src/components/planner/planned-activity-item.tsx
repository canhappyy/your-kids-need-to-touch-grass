"use client";

import { useState } from "react";
import { CalendarClock, MapPin, Trash2 } from "lucide-react";

import { MissionInstructionsDialog } from "@/components/result/mission-instructions-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PlannedActivity } from "@/types/planner";

export type PlannedActivityItemProps = {
  /** The planned activity record to display. */
  activity: PlannedActivity;
  /** Optional callback fired when the remove button is clicked. */
  onRemove?: (id: string) => void;
  /** Visual button style for the remove action. */
  removeVariant?: "destructive" | "ghost";
  /** Optional custom class name for the wrapper. */
  className?: string;
};

/**
 * Card component displaying a planned activity in the planner.
 *
 * Displays activity name, duration, location, and an affordance to view instructions.
 * Clicking the card opens the step-by-step instruction pop up dialog.
 */
export function PlannedActivityItem({
  activity,
  onRemove,
  removeVariant = "ghost",
  className,
}: PlannedActivityItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <article
        role="button"
        tabIndex={0}
        aria-label={`View instructions for ${activity.name}`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "group flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-[#93AB63]/50 bg-white/75 p-3 shadow-2xs transition-all hover:border-[#93AB63] hover:bg-white hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63]",
          className,
        )}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <h4 className="truncate text-sm font-semibold text-zinc-900 transition-colors group-hover:text-[#728A46]">
            {activity.name}
          </h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5 text-zinc-400" />
              {activity.durationMinutes} min
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-zinc-400" />
              {activity.locationLabel}
            </span>
          </div>
          <p className="inline-flex items-center gap-1 text-[11px] font-medium text-[#728A46] transition-colors group-hover:underline">
            Tap to view instructions
          </p>
        </div>

        {onRemove && (
          <Button
            type="button"
            size="sm"
            variant={removeVariant}
            aria-label={`Remove ${activity.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(activity.id);
            }}
            className={cn(
              removeVariant === "destructive"
                ? "shrink-0"
                : "h-8 shrink-0 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-400",
            )}
          >
            <Trash2
              className={
                removeVariant === "destructive" ? "size-4" : "size-3.5 sm:mr-1"
              }
            />
            <span
              className={
                removeVariant === "destructive" ? "" : "hidden sm:inline"
              }
            >
              Remove
            </span>
          </Button>
        )}
      </article>

      <MissionInstructionsDialog
        equipmentNeeded={activity.equipmentNeeded ?? null}
        instructionText={activity.instructionText ?? null}
        title={activity.name}
        iconFile={activity.iconFile ?? null}
      />
    </Dialog>
  );
}
