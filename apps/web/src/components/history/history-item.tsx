import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/activity";
import { formatCompletionDate } from "@/lib/completed-missions";
import type { CompletedMission } from "@/types/completed-mission";

type HistoryItemProps = {
  record: CompletedMission;
};

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
