import type { CompletedMission } from "@/types/completed-mission";
import { HistoryItem } from "./history-item";

/**
 * Props for the {@link HistoryList} component.
 */
type HistoryListProps = {
  /** Array of completed mission records to render, ordered from newest to oldest. */
  records: CompletedMission[];
};

/**
 * Ordered list rendering completed mission history items in chronological order.
 */
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
