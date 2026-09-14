import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useActivityResult } from "@/hooks/use-activity-result";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/types/recommendation";
import { ActivityDetails } from "./activity-details";
import { ActivityHeader } from "./activity-header";
import { MissionCompletion } from "./mission-completion";
import { MissionInstructionsDialog } from "./mission-instructions-dialog";

/**
 * Props for the `ChainedActivityCard` component.
 */
export type ChainedActivityCardProps = {
  /** The secondary activity recommendation payload to render on Slide 2. */
  recommendation: Recommendation;
  /** Whether a mission completion or retry mutation is currently in flight. */
  isBusy: boolean;
  /** Optional additional CSS class names for styling the card container. */
  className?: string;
};

/**
 * Renders the secondary chained activity (Activity 2) card inside the carousel.
 *
 * Includes dedicated mission details, match reasons, an independent "How to Play"
 * instructions modal trigger, and a completion toggle button.
 *
 * @param props - Component configuration including the `recommendation` payload, `isBusy` flag, and optional `className`.
 * @returns The React element representing the chained activity card.
 */
export function ChainedActivityCard({
  recommendation,
  isBusy,
  className,
}: ChainedActivityCardProps) {
  const { agesLabel, formattedDuration, formattedSupervision, locationLabel } =
    useActivityResult(recommendation);

  return (
    <Dialog key={recommendation.missionId}>
      <Card
        className={cn(
          "flex h-full flex-1 flex-col justify-between bg-white",
          className,
        )}
      >
        <CardContent className="flex flex-1 flex-col justify-between space-y-5 py-5 sm:px-6">
          <div className="space-y-5">
            <p className="text-center text-sm font-bold tracking-wide text-[#E4633C] uppercase">
              Activity 2
            </p>
            <div className="relative">
              <DialogTrigger
                aria-label={`How to Play: ${recommendation.title}`}
                className="absolute inset-0 z-10 cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] focus-visible:ring-offset-4"
              />
              <ActivityHeader
                agesLabel={agesLabel}
                compact
                formattedDuration={formattedDuration}
                formattedSupervision={formattedSupervision}
                headingLevel="h2"
                reasons={recommendation.reasons}
                title={recommendation.title}
                titleId="secondary-activity-title"
              />
              <ActivityDetails
                formattedCommuteDuration={null}
                formattedDuration={formattedDuration}
                formattedTotalDuration={formattedDuration}
                locationLabel={locationLabel}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <MissionCompletion
              recommendation={recommendation}
              isRetrying={isBusy}
            />
            <DialogTrigger
              render={<Button size="lg" type="button" variant="outline" />}
              className="h-12 w-full rounded-full border-[#93AB63] bg-white px-6 text-base font-bold text-[#93AB63] hover:bg-zinc-50 hover:text-[#93AB63] focus-visible:border-[#93AB63] focus-visible:ring-[#93AB63]/20"
            >
              <BookOpen aria-hidden="true" />
              How to Play
            </DialogTrigger>
          </div>
          <MissionInstructionsDialog
            title={recommendation.title}
            instructionText={recommendation.instructionText}
          />
        </CardContent>
      </Card>
    </Dialog>
  );
}
