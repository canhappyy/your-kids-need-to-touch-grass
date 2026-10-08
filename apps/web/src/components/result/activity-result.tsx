"use client";

import { useActivityResult } from "@/hooks/use-activity-result";
import type { ActivityResultProps } from "@/types/activity";

import { ActivityActions } from "./activity-actions";
import { ActivityCard } from "./activity-card";
import { ActivityHeader } from "./activity-header";
import { ActivityProgress } from "./activity-progress";
import { MissionCompletion } from "./mission-completion";

/**
 * Renders the single recommended activity result view, displaying flippable activity details,
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

      <ActivityHeader title={recommendation.title} />

      <ActivityCard
        formattedCommuteDuration={formattedCommuteDuration}
        formattedDuration={formattedDuration}
        formattedTotalDuration={formattedTotalDuration}
        isHomeBased={isHomeBased}
        locationLabel={locationLabel}
        recommendation={recommendation}
      />

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
        showHowToPlay={false}
      />
    </section>
  );
}

export { ActivityResult, type ActivityResultProps };
