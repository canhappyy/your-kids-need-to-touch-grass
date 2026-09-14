import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChainState } from "@/types/result";

export type ChainedActivityPromptProps = {
  chainState: ChainState;
  isBusy: boolean;
  onAddActivity: () => void;
};

/**
 * Renders the button allowing parents to add a second compatible activity at the venue,
 * as well as loading, error, and unavailable statuses.
 */
export function ChainedActivityPrompt({
  chainState,
  isBusy,
  onAddActivity,
}: ChainedActivityPromptProps) {
  if (chainState.status === "unavailable") {
    return (
      <p className="mt-6 text-center text-sm text-zinc-600" role="status">
        No additional activity is available at this location.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <Button
        className="h-12 w-full rounded-full bg-[#93AB63] text-base font-bold text-white hover:bg-[#7f9653]"
        disabled={isBusy}
        onClick={onAddActivity}
        size="lg"
        type="button"
      >
        <Plus aria-hidden="true" />
        {chainState.status === "loading"
          ? "Adding activity…"
          : chainState.status === "error"
            ? "Try adding again"
            : "Add another activity here"}
      </Button>
      {chainState.status === "error" && (
        <p className="text-center text-sm text-red-700" role="alert">
          We couldn&apos;t add another activity. Try again.
        </p>
      )}
    </div>
  );
}
