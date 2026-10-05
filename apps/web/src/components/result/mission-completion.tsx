"use client";

import { Button } from "@/components/ui/button";
import { useSaveActivity } from "@/hooks/use-save-activity";
import type { Recommendation } from "@/types/recommendation";
import { PlannerSaveDialog } from "./planner-save-dialog";

/**
 * Props for the `MissionCompletion` component.
 */
export type MissionCompletionProps = {
  /** The current activity recommendation object. */
  recommendation: Recommendation;
  /** Whether a swap retry operation is currently underway. */
  isRetrying: boolean;
  /** Optional date selected before generating this recommendation. */
  planDate?: string;
};

/**
 * Interactive button component allowing parents to save an activity to their backlog.
 *
 * @param props - Component properties with recommendation details and retry state.
 */
export function MissionCompletion({
  recommendation,
  isRetrying,
  planDate,
}: MissionCompletionProps) {
  const { save, isSaved, error } = useSaveActivity(
    recommendation,
    isRetrying,
  );
  return (
    <div className="space-y-2">
      <Button
        className="h-12 w-full rounded-full"
        disabled={isSaved || isRetrying}
        onClick={save}
      >
        {isSaved ? "Saved" : "Save this activity"}
      </Button>
      {isSaved && (
        <p role="status" className="text-center text-sm text-zinc-600">
          Saved to your backlog.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <PlannerSaveDialog
        initialDateKey={planDate}
        recommendation={recommendation}
      />
    </div>
  );
}
