"use client";

import { useSaveActivity } from "./use-save-activity";
import type { Recommendation } from "@/types/recommendation";

/**
 * Hook for saving or managing mission backlog state.
 *
 * @param recommendation - Current mission recommendation.
 * @param isRetrying - Whether an activity fetch/retry is in progress.
 */
export function useMissionCompletion(
  recommendation: Recommendation,
  isRetrying: boolean,
) {
  return useSaveActivity(recommendation, isRetrying);
}
