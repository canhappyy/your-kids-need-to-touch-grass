import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useActivityResult } from "@/hooks/use-activity-result";
import type { Recommendation } from "@/types/recommendation";
import { ActivityDetails } from "./activity-details";
import { ActivityHeader } from "./activity-header";
import { MissionCompletion } from "./mission-completion";
import { MissionInstructionsDialog } from "./mission-instructions-dialog";

type ChainedActivityCardProps = {
  recommendation: Recommendation;
  isBusy: boolean;
};

/** Displays Activity 2 with independent instructions and completion history. */
export function ChainedActivityCard({
  recommendation,
  isBusy,
}: ChainedActivityCardProps) {
  const {
    agesLabel,
    formattedDuration,
    formattedSupervision,
    locationLabel,
  } = useActivityResult(recommendation);

  return (
    <Card className="mt-6 bg-white">
      <CardContent className="space-y-5 py-5 sm:px-6">
        <p className="text-center text-sm font-bold tracking-wide text-[#E4633C] uppercase">
          Activity 2
        </p>
        <Dialog key={recommendation.missionId}>
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
          <MissionInstructionsDialog
            title={recommendation.title}
            instructionText={recommendation.instructionText}
          />
        </Dialog>
      </CardContent>
    </Card>
  );
}
