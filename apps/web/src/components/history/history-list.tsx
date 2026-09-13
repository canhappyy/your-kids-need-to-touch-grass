import type { CompletedMission } from "@/types/completed-mission";
import { HistoryItem } from "./history-item";

type HistoryListProps = {
  records: CompletedMission[];
};

export function HistoryList({ records }: HistoryListProps) {
  return (
    <ol className="space-y-3" aria-label="Completed mission history">
      {records.map((record) => (
        <li key={record.id}>
          <HistoryItem record={record} />
        </li>
      ))}
    </ol>
  );
}

export type { HistoryListProps };
