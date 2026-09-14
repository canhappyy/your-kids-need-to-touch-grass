import { Card, CardContent } from "@/components/ui/card";
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
 */
export function HistoryItem({ record }: HistoryItemProps) {
  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <h2 className="break-words text-lg font-semibold">{record.name}</h2>
        <div className="flex flex-wrap justify-between gap-2 text-sm text-zinc-600">
          <time dateTime={record.completedAt}>
            {formatCompletionDate(record.completedAt)}
          </time>
          <span>{formatDuration(record.durationMinutes)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export type { HistoryItemProps };
