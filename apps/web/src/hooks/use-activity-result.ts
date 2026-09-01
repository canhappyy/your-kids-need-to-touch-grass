import { useMemo } from "react"

import {
  calculateDailyGoalProgress,
  formatDuration,
  formatSupervision,
  getDirectionsUrl,
  getLocationLabel,
} from "@/lib/activity"
import type { ActivityResultViewModel } from "@/types/activity"
import type { Recommendation } from "@/types/recommendation"

/**
 * Custom hook to derive view-model presentation data for an Activity Result.
 */
export function useActivityResult(
  recommendation: Recommendation
): ActivityResultViewModel {
  return useMemo(() => {
    const { dailyGoalPercentage, progressValue, label: goalAriaText } =
      calculateDailyGoalProgress(recommendation.durationMinutes)

    return {
      agesLabel: recommendation.ageBands.join(", "),
      dailyGoalPercentage,
      directionsUrl: getDirectionsUrl(recommendation.venue),
      formattedDuration: formatDuration(recommendation.durationMinutes),
      formattedSupervision: formatSupervision(recommendation.supervisionLevel),
      goalAriaText,
      locationLabel: getLocationLabel(recommendation),
      progressValue,
    }
  }, [recommendation])
}
