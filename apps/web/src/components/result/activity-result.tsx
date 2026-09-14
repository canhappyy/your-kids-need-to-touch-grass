import { MissionWeather } from "./mission-weather";
import { MissionCompletion } from "./mission-completion";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MissionInstructionsDialog } from "./mission-instructions-dialog";
import { ActivityActions } from "./activity-actions";
import { ActivityDetails } from "./activity-details";
import { ActivityHeader } from "./activity-header";
import { ActivityProgress } from "./activity-progress";
import { ChainedActivityCard } from "./chained-activity-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { calculateDailyGoalProgress, formatDuration } from "@/lib/activity";
import { useActivityResult } from "@/hooks/use-activity-result";
import type { ActivityResultProps } from "@/types/activity";

function ActivityResult({
  recommendation,
  chainState,
  isBusy,
  isRetrying = false,
  onAddActivity,
  onTryAnother,
}: ActivityResultProps) {
  const {
    agesLabel,
    directionsUrl,
    formattedDuration,
    formattedTotalDuration,
    formattedCommuteDuration,
    formattedSupervision,
    locationLabel,
  } = useActivityResult(recommendation);
  const secondaryRecommendation =
    chainState.status === "loaded" ? chainState.recommendation : null;
  const combinedActivityMinutes =
    recommendation.durationMinutes +
    (secondaryRecommendation?.durationMinutes ?? 0);
  const combinedOutingMinutes =
    recommendation.totalMinutes +
    (secondaryRecommendation?.durationMinutes ?? 0);
  const {
    dailyGoalPercentage,
    label: goalAriaText,
    progressValue,
  } = calculateDailyGoalProgress(combinedActivityMinutes);
  const canChain =
    recommendation.venue !== null && recommendation.durationMinutes < 60;
  const outingWeather =
    secondaryRecommendation?.weather ?? recommendation.weather;

  return (
    <section
      aria-labelledby="activity-title"
      className="flex min-h-[calc(100svh-6.5rem)] flex-col pt-3 pb-[72px]"
    >
      <Dialog key={recommendation.missionId}>
        {secondaryRecommendation && (
          <p className="mb-2 text-center text-sm font-bold tracking-wide text-[#E4633C] uppercase">
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

        {canChain && !secondaryRecommendation && (
          <div className="mt-6 space-y-3">
            {chainState.status !== "unavailable" && (
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
            )}
            {chainState.status === "unavailable" && (
              <p className="text-center text-sm text-zinc-600" role="status">
                No additional activity is available at this location.
              </p>
            )}
            {chainState.status === "error" && (
              <p className="text-center text-sm text-red-700" role="alert">
                We couldn&apos;t add another activity. Try again.
              </p>
            )}
          </div>
        )}

        {secondaryRecommendation && (
          <ChainedActivityCard
            isBusy={isBusy}
            recommendation={secondaryRecommendation}
          />
        )}

        <MissionWeather weather={outingWeather} />

        <ActivityProgress
          dailyGoalPercentage={dailyGoalPercentage}
          goalAriaText={goalAriaText}
          progressValue={progressValue}
        />

        <ActivityActions
          completionControl={
            <MissionCompletion
              recommendation={recommendation}
              isRetrying={isBusy}
            />
          }
          directionsUrl={directionsUrl}
          isRetrying={isRetrying}
          isDisabled={isBusy}
          onTryAnother={onTryAnother}
        />
        <MissionInstructionsDialog
          title={recommendation.title}
          instructionText={recommendation.instructionText}
        />
      </Dialog>
    </section>
  );
}

export { ActivityResult, type ActivityResultProps };
