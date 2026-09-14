"use client";

import { Dialog } from "@/components/ui/dialog";
import { useActivityCarousel } from "@/hooks/use-activity-carousel";
import { useActivityResult } from "@/hooks/use-activity-result";
import { calculateDailyGoalProgress } from "@/lib/activity";
import type { ActivityResultProps } from "@/types/activity";

import { ActivityActions } from "./activity-actions";
import { ActivityCarousel } from "./activity-carousel";
import { ActivityProgress } from "./activity-progress";
import { ChainedActivityPrompt } from "./chained-activity-prompt";
import { MissionCompletion } from "./mission-completion";
import { MissionWeather } from "./mission-weather";
import { PrimaryActivityCard } from "./primary-activity-card";

/**
 * Renders the activity recommendation result view, composing the mission carousel,
 * outing weather forecasts, daily activity progress, and action controls.
 */
function ActivityResult({
  recommendation,
  chainState,
  isBusy,
  isRetrying = false,
  onAddActivity,
  onTryAnother,
}: ActivityResultProps) {
  const secondaryRecommendation =
    chainState.status === "loaded" ? chainState.recommendation : null;

  const { api, setApi, currentSlide } = useActivityCarousel(
    secondaryRecommendation,
  );

  const { directionsUrl } = useActivityResult(recommendation);

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

  const primaryCard = (
    <PrimaryActivityCard
      combinedActivityMinutes={combinedActivityMinutes}
      combinedOutingMinutes={combinedOutingMinutes}
      isBusy={isBusy}
      recommendation={recommendation}
      secondaryRecommendation={secondaryRecommendation}
    />
  );

  const carousel = (
    <ActivityCarousel
      api={api}
      currentSlide={currentSlide}
      isBusy={isBusy}
      primaryCard={primaryCard}
      secondaryRecommendation={secondaryRecommendation}
      setApi={setApi}
    />
  );

  const sharedOutingContent = (
    <>
      {canChain && !secondaryRecommendation && (
        <ChainedActivityPrompt
          chainState={chainState}
          isBusy={isBusy}
          onAddActivity={onAddActivity}
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
          secondaryRecommendation ? null : (
            <MissionCompletion
              recommendation={recommendation}
              isRetrying={isBusy}
            />
          )
        }
        directionsUrl={directionsUrl}
        isRetrying={isRetrying}
        isDisabled={isBusy}
        onTryAnother={onTryAnother}
        showHowToPlay={!secondaryRecommendation}
      />
    </>
  );

  return (
    <section
      aria-labelledby="activity-title"
      className="flex min-h-[calc(100svh-6.5rem)] flex-col pt-3 pb-[72px]"
    >
      {secondaryRecommendation ? (
        <>
          {carousel}
          {sharedOutingContent}
        </>
      ) : (
        <Dialog key={recommendation.missionId}>
          {carousel}
          {sharedOutingContent}
        </Dialog>
      )}
    </section>
  );
}

export { ActivityResult, type ActivityResultProps };
