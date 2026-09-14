import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Empty state card shown when the user has no recorded completed missions yet.
 * Includes a friendly message and a link encouraging them to explore new missions.
 */
export function HistoryEmptyState() {
  return (
    <Card>
      <CardContent className="py-6 text-center">
        <p>No missions completed yet</p>
        <Link
          className="mt-3 inline-flex min-h-11 items-center underline"
          href="/"
        >
          Find a mission
        </Link>
      </CardContent>
    </Card>
  );
}
