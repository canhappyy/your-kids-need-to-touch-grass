"use client";

import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useActivityResult } from "@/hooks/use-activity-result";
import { formatDuration } from "@/lib/activity";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/types/recommendation";

import { ActivityDetails } from "./activity-details";
import { ActivityHeader } from "./activity-header";
import { MissionCompletion } from "./mission-completion";
import { MissionInstructionsDialog } from "./mission-instructions-dialog";

export type PrimaryActivityCardProps = {
  recommendation: Recommendation;
  secondaryRecommendation: Recommendation | null;
  isBusy: boolean;
  combinedActivityMinutes: number;
  combinedOutingMinutes: number;
  className?: string;
};

/**
 * Renders the primary recommended activity (Activity 1) card inside the carousel,
 * including details, completion button, and instructions dialog.
 */
export function PrimaryActivityCard({
  recommendation,
  secondaryRecommendation,
  isBusy,
  combinedActivityMinutes,
  combinedOutingMinutes,
  className,
}: PrimaryActivityCardProps) {
  const {
    agesLabel,
    formattedDuration,
    formattedTotalDuration,
    formattedCommuteDuration,
    formattedSupervision,
    locationLabel,
  } = useActivityResult(recommendation);

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
            {secondaryRecommendation && (
              <p className="text-center text-sm font-bold tracking-wide text-[#E4633C] uppercase">
                Activity 1
              </p>
            )}
            <div className="relative">
              <DialogTrigger
                aria-label={`How to Play: ${recommendation.title}`}
                className="absolute inset-0 z-10 cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] focus-visible:ring-offset-4"
              />
              <ActivityHeader
                agesLabel={agesLabel}
                compact={Boolean(secondaryRecommendation)}
                formattedDuration={
                  formattedCommuteDuration !== null && !secondaryRecommendation
                    ? `${formattedTotalDuration} total (est.)`
                    : formattedDuration
                }
                formattedSupervision={formattedSupervision}
                reasons={recommendation.reasons}
                title={recommendation.title}
              />

              <ActivityDetails
                activityCount={secondaryRecommendation ? 2 : 1}
                formattedTotalDuration={
                  secondaryRecommendation
                    ? formatDuration(combinedOutingMinutes)
                    : formattedTotalDuration
                }
                formattedCommuteDuration={formattedCommuteDuration}
                formattedDuration={formatDuration(combinedActivityMinutes)}
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
