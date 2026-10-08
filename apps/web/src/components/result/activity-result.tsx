"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useActivityResult } from "@/hooks/use-activity-result";
import type { ActivityResultProps } from "@/types/activity";

import { ActivityActions } from "./activity-actions";
import { ActivityDetails } from "./activity-details";
import { ActivityHeader } from "./activity-header";
import { ActivityProgress } from "./activity-progress";
import { MissionCompletion } from "./mission-completion";
import { MissionInstructionsDialog } from "./mission-instructions-dialog";

/**
 * Renders the single recommended activity result view, displaying activity details,
 * weather conditions, daily active play progress, and action controls.
 */
function ActivityResult({
  recommendation,
  planDate,
  childAgeRange,
  isRetrying = false,
  onTryAnother,
}: ActivityResultProps) {
  const {
    dailyGoalPercentage,
    directionsUrl,
    formattedDuration,
    formattedTotalDuration,
    formattedCommuteDuration,
    goalAriaText,
    isHomeBased,
    locationLabel,
    progressValue,
  } = useActivityResult(recommendation);

  return (
    <section
      aria-labelledby="activity-title"
      className="flex min-h-[calc(100svh-6.5rem)] flex-col pt-3 pb-[72px]"
    >
      {recommendation.weatherNotice && (
        <div
          role="status"
          className="fixed top-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm font-medium text-amber-900 shadow-sm"
        >
          {recommendation.weatherNotice}
        </div>
      )}
      <Dialog key={recommendation.missionId}>
        <ActivityHeader title={recommendation.title} />

        <div className="group relative mt-6">
          <DialogTrigger
            aria-label={`How to Play: ${recommendation.title}`}
            className="absolute inset-0 z-10 cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] focus-visible:ring-offset-4"
          />
          <Card className="border border-[#93AB63]/60 bg-white/70 shadow-sm ring-0 transition-all group-hover:border-[#93AB63] group-hover:shadow-md">
            <CardContent className="p-5 sm:p-6">
              <ActivityDetails
                formattedCommuteDuration={formattedCommuteDuration}
                formattedDuration={formattedDuration}
                formattedTotalDuration={formattedTotalDuration}
                isHomeBased={isHomeBased}
                locationLabel={locationLabel}
                weather={recommendation.weather}
              />
            </CardContent>
          </Card>
        </div>

        <ActivityProgress
          dailyGoalPercentage={dailyGoalPercentage}
          goalAriaText={goalAriaText}
          progressValue={progressValue}
        />

        <ActivityActions
          completionControl={
            <MissionCompletion
              isRetrying={isRetrying}
              planDate={planDate}
              childAgeRange={childAgeRange}
              recommendation={recommendation}
            />
          }
          directionsUrl={directionsUrl}
          isRetrying={isRetrying}
          onTryAnother={onTryAnother}
        />
        <MissionInstructionsDialog
          equipmentNeeded={recommendation.equipmentNeeded}
          iconFile={recommendation.iconFile}
          instructionText={recommendation.instructionText}
          title={recommendation.title}
        />
      </Dialog>
    </section>
  );
}

export { ActivityResult, type ActivityResultProps };
