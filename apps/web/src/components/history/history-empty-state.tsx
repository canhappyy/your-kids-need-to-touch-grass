import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export type HistoryEmptyStateProps = {
  /** Optional callback fired when the user chooses to find a mission. */
  onClose?: () => void;
};

/**
 * Empty state card shown when the user has no recorded completed missions yet.
 * Includes a friendly message and a link encouraging them to explore new missions.
 */
export function HistoryEmptyState({ onClose }: HistoryEmptyStateProps = {}) {
  return (
    <Card>
      <CardContent className="py-6 text-center">
        <p>No missions completed yet</p>
        <Link
          className="mt-3 inline-flex min-h-11 items-center underline"
          href="/"
          onClick={onClose}
        >
          Find a mission
        </Link>
      </CardContent>
    </Card>
  );
}
