"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { MissionInstructionsDialog } from "@/components/result/mission-instructions-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { formatDuration } from "@/lib/activity";
import { formatCompletionDate } from "@/lib/completed-missions";
import type { SavedActivity } from "@/types/saved-activity";

/**
 * Props for the {@link SavedActivityItem} component.
 */
export type SavedActivityItemProps = {
  /** The saved activity record to display. */
  activity: SavedActivity;
  /** Callback fired when the user clicks the check icon to mark the activity as completed. */
  onComplete: (id: string) => void;
  /** Callback fired when the user clicks the cross icon to remove the activity from saved. */
  onRemove: (id: string) => void;
};

/**
 * Card component for a saved activity in the backlog.
 *
 * Displays activity name, duration, and save date.
 * Clicking the card opens the activity instructions modal.
 * Includes check and cross action buttons to mark completed or remove.
 */
export function SavedActivityItem({
  activity,
  onComplete,
  onRemove,
}: SavedActivityItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card
        className="group cursor-pointer bg-white transition-all hover:border-[#93AB63]/50 hover:shadow-xs"
        onClick={() => setOpen(true)}
      >
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-zinc-900 transition-colors group-hover:text-[#93AB63]">
              {activity.name}
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span>{formatDuration(activity.durationMinutes)}</span>
              <span aria-hidden="true">•</span>
              <time dateTime={activity.savedAt}>
                Saved {formatCompletionDate(activity.savedAt)}
              </time>
            </p>
          </div>

          <div
            className="flex shrink-0 items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              aria-label={`Mark ${activity.name} as completed`}
              className="size-9 rounded-full border-[#93AB63] text-[#93AB63] hover:bg-[#93AB63]/15 hover:text-[#93AB63] focus-visible:ring-[#93AB63]"
              onClick={(e) => {
                e.stopPropagation();
                onComplete(activity.id);
              }}
              size="icon-sm"
              title="Mark as completed"
              type="button"
              variant="outline"
            >
              <Check className="size-4" strokeWidth={2.5} />
            </Button>
            <Button
              aria-label={`Remove ${activity.name} from saved`}
              className="size-9 rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-400"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(activity.id);
              }}
              size="icon-sm"
              title="Remove from saved"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <MissionInstructionsDialog
        equipmentNeeded={activity.equipmentNeeded}
        instructionText={activity.instructionText ?? null}
        title={activity.name}
      />
    </Dialog>
  );
}
