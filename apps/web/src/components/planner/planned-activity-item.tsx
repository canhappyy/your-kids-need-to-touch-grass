"use client";

import { useState } from "react";
import { CalendarClock, MapPin, Trash2 } from "lucide-react";

import { MissionInstructionsDialog } from "@/components/result/mission-instructions-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PlannedActivity } from "@/types/planner";

/**
 * Properties for the `PlannedActivityItem` card component.
 */
export type PlannedActivityItemProps = {
  /** The planned activity record containing mission details, schedule, and equipment needed. */
  activity: PlannedActivity;
  /** Optional callback fired when the user clicks the remove/delete action button. */
  onRemove?: (id: string) => void;
  /** Visual button styling variant for the remove action ("ghost" for subtle week list or "destructive" for details panel). */
  removeVariant?: "destructive" | "ghost";
  /** Optional CSS class name overrides. */
  className?: string;
};

/**
 * Interactive card component representing a scheduled activity within the planner views.
 *
 * Visual Features:
 * - Shows the mission title, duration in minutes, and venue/home location label.
 * - Entire card functions as an accessible button: tapping opens the `MissionInstructionsDialog`
 *   to view step-by-step game rules and required equipment.
 * - Provides an optional Remove button with event stopping to prevent accidentally triggering
 *   the instruction dialog when removing an item.
 *
 * @param props - Component configuration including activity data and delete callback.
 * @returns The rendered activity card with embedded instruction dialog.
 */
export function PlannedActivityItem({
  activity,
  onRemove,
  removeVariant = "ghost",
  className,
}: PlannedActivityItemProps) {
  // Controls the visibility of the full-screen mission instructions dialog
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Clickable article card triggering the instructions dialog */}
      <article
        role="button"
        tabIndex={0}
        aria-label={`View instructions for ${activity.name}`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          // Allow keyboard users to open instructions with Space or Enter
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
        {/* Activity Details Column */}
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

        {/* Optional Remove Activity Button */}
        {onRemove && (
          <Button
            type="button"
            size="sm"
            variant={removeVariant}
            aria-label={`Remove ${activity.name}`}
            onClick={(e) => {
              // Crucial: stop propagation so clicking Remove doesn't open the instructions dialog
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

      {/* Pop-up dialog rendering detailed game rules and equipment */}
      <MissionInstructionsDialog
        equipmentNeeded={activity.equipmentNeeded ?? null}
        instructionText={activity.instructionText ?? null}
        title={activity.name}
        iconFile={activity.iconFile ?? null}
      />
    </Dialog>
  );
}

