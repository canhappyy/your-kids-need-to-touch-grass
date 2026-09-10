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
 * Custom hook that transforms a raw activity recommendation into formatted presentation data for the UI.
 *
 * How this hook works:
 * 1. Performance Optimization (`useMemo`):
 *    Memoizes all derived calculations so formatting and progress math only run
 *    when the `recommendation` prop changes, preventing redundant work during component re-renders.
 *
 * 2. Daily Goal & Progress Calculation (`calculateDailyGoalProgress`):
 *    - `dailyGoalPercentage`: Computes progress against the recommended 60-minute daily active goal (e.g., 45 mins = 75%).
 *    - `progressValue`: Clamps the percentage between 0 and 100 for smooth progress bar display.
 *    - `goalAriaText`: Provides an accessible screen-reader announcement (e.g., "75% of the 60-minute daily goal").
 *
 * 3. Human-Readable Formatting:
 *    - `agesLabel`: Formats the age bands array into a comma-separated string (e.g., `"5-7, 8-9"`).
 *    - `formattedDuration`: Converts raw minutes into natural language (e.g., `"1 hour 30 minutes"`).
 *    - `formattedSupervision`: Maps internal codes to parent-friendly terms ("Independent play" or "Adult supervision").
 *    - `locationLabel`: Resolves the specific venue name, `"At home"`, or `"Anywhere"`.
 *
 * 4. Directions Navigation (`getDirectionsUrl`):
 *    Generates a Google Maps directions URL with encoded GPS coordinates if an outdoor venue exists, or `null` for home activities.
 *
 * @param recommendation - The raw activity recommendation data to format.
 * @returns An `ActivityResultViewModel` containing pre-computed, UI-ready strings and progress metrics.
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
