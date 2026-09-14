"use client";

import { useActivityCarousel } from "@/hooks/use-activity-carousel";
import { useActivityResult } from "@/hooks/use-activity-result";
import { calculateDailyGoalProgress } from "@/lib/activity";
import type { ActivityResultProps } from "@/types/activity";

import { ActivityActions } from "./activity-actions";
import { ActivityCarousel } from "./activity-carousel";
import { ActivityProgress } from "./activity-progress";
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

  const canChain =
    recommendation.venue !== null && recommendation.durationMinutes < 60;

  const { api, setApi, currentSlide } = useActivityCarousel({
    primaryMissionId: recommendation.missionId,
    secondaryRecommendation,
    canChain,
    chainStatus: chainState.status,
    isRetrying,
    onAddActivity,
  });

  const handleTryAnother = () => {
    api?.scrollTo(0);
    onTryAnother();
  };

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

  const outingWeather =
    secondaryRecommendation?.weather ?? recommendation.weather;

  const primaryCard = (
    <PrimaryActivityCard
      combinedActivityMinutes={combinedActivityMinutes}
      combinedOutingMinutes={combinedOutingMinutes}
      isBusy={isBusy}
      recommendation={recommendation}
      secondaryRecommendation={secondaryRecommendation}
      className="h-full"
    />
  );

  const carousel = (
    <ActivityCarousel
      api={api}
      canChain={canChain}
      chainState={chainState}
      currentSlide={currentSlide}
      isBusy={isBusy}
      onAddActivity={onAddActivity}
      primaryCard={primaryCard}
      secondaryRecommendation={secondaryRecommendation}
      setApi={setApi}
      venueName={recommendation.venue?.name}
    />
  );

  const sharedOutingContent = (
    <>
      {chainState.status === "unavailable" && (
        <p className="mt-4 text-center text-sm text-zinc-600" role="status">
          No additional activity is available at this location.
        </p>
      )}

      {chainState.status === "error" && (
        <p className="mt-4 text-center text-sm text-red-700" role="alert">
          We couldn&apos;t add another activity. Try again.
        </p>
      )}

      <MissionWeather weather={outingWeather} />

      <ActivityProgress
        dailyGoalPercentage={dailyGoalPercentage}
        goalAriaText={goalAriaText}
        progressValue={progressValue}
      />

      <ActivityActions
        directionsUrl={directionsUrl}
        isRetrying={isRetrying}
        isDisabled={isBusy}
        onTryAnother={handleTryAnother}
        showHowToPlay={false}
      />
    </>
  );

  return (
    <section
      aria-labelledby="activity-title"
      className="flex min-h-[calc(100svh-6.5rem)] flex-col pt-3 pb-[72px]"
    >
      {carousel}
      {sharedOutingContent}
    </section>
  );
}

export { ActivityResult, type ActivityResultProps };
