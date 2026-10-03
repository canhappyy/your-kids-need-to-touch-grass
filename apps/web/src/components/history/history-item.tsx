"use client";

import { useState } from "react";
import { MissionInstructionsDialog } from "@/components/result/mission-instructions-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { formatDuration } from "@/lib/activity";
import { formatCompletionDate } from "@/lib/completed-missions";
import type { CompletedMission } from "@/types/completed-mission";

/**
 * Props for the {@link HistoryItem} component.
 */
type HistoryItemProps = {
  /** The completed mission entry to display, containing mission name, completion timestamp, and duration. */
  record: CompletedMission;
};

/**
 * Card displaying a single completed mission entry in the user's history,
 * showing the mission name, formatted completion date, and duration.
 * Clicking the card opens the mission instructions modal.
 */
export function HistoryItem({ record }: HistoryItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card
        className="group cursor-pointer bg-white transition-all hover:border-[#93AB63]/50 hover:shadow-xs"
        onClick={() => setOpen(true)}
      >
        <CardContent className="space-y-2 py-4">
          <h2 className="break-words text-lg font-semibold text-zinc-900 transition-colors group-hover:text-[#93AB63]">
            {record.name}
          </h2>
          <div className="flex flex-wrap justify-between gap-2 text-sm text-zinc-600">
            <time dateTime={record.completedAt}>
              {formatCompletionDate(record.completedAt)}
            </time>
            <span>{formatDuration(record.durationMinutes)}</span>
          </div>
        </CardContent>
      </Card>

      <MissionInstructionsDialog
        equipmentNeeded={record.equipmentNeeded}
        instructionText={record.instructionText ?? null}
        title={record.name}
      />
    </Dialog>
  );
}

export type { HistoryItemProps };
