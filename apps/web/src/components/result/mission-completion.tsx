"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  childAgeRange?: [number, number];
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
  childAgeRange,
}: MissionCompletionProps) {
  const [alertOpen, setAlertOpen] = useState(false);
  const { save, isSaved, error } = useSaveActivity(
    recommendation,
    isRetrying,
    childAgeRange,
  );

  const handleSave = () => {
    save();
    setAlertOpen(true);
  };

  return (
    <div className="space-y-2">
      <Button
        className="h-12 w-full rounded-full"
        disabled={isSaved || isRetrying}
        onClick={handleSave}
      >
        {isSaved ? "Saved" : "Save this activity"}
      </Button>
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:max-w-xs shadow-lg">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-base font-bold text-zinc-900">
              Saved to Backlog
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-600">
              Saved to your backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="h-10 w-full rounded-full bg-[#93AB63] font-semibold text-white hover:bg-[#819953]"
              onClick={() => setAlertOpen(false)}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
