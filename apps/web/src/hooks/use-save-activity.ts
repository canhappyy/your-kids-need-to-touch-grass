"use client";

import { useEffect, useRef, useState } from "react";
import { saveActivity } from "@/lib/saved-activities";
import type { Recommendation } from "@/types/recommendation";

// In-memory registry tracking recommendation results that have already been saved in this session.
const savedResultInstances = new Set<string | Recommendation>();

/**
 * Gets a distinct identifier for a recommendation instance.
 */
function getRecommendationKey(
  recommendation: Recommendation,
): string | Recommendation {
  return recommendation.requestId || recommendation;
}

/**
 * Resets saved result tracking (primarily for testing and mock isolation).
 */
export function _resetSavedResultInstances(): void {
  savedResultInstances.clear();
}

/**
 * Custom hook that manages the action of saving an activity recommendation to the backlog.
 *
 * Each recommendation result from a request can be saved once.
 * Once saved from that result, it remains in the "Saved" state (preventing duplicate saving or click-jacking).
 * If the user receives the activity from a later request (e.g. subsequent search or retry),
 * it can be saved again to the backlog as a duplicate.
 *
 * @param recommendation - The currently active mission recommendation.
 * @param isRetrying - Boolean flag indicating if an activity retry or fetch is currently in progress.
 * @returns An object containing:
 *   - `save`: Function to save the recommendation to the backlog.
 *   - `isSaved`: Boolean indicating whether this specific result recommendation has been saved.
 *   - `error`: Error message string if saving failed, or empty string on success.
 */
export function useSaveActivity(
  recommendation: Recommendation,
  isRetrying: boolean,
) {
  const savedRef = useRef<Recommendation | null>(null);
  const [isSaved, setIsSaved] = useState(() => {
    return savedResultInstances.has(getRecommendationKey(recommendation));
  });
  const [error, setError] = useState("");
  const isSaving = useRef(false);

  useEffect(() => {
    const key = getRecommendationKey(recommendation);
    const saved = savedResultInstances.has(key);
    setIsSaved(saved);
    savedRef.current = saved ? recommendation : null;
    setError("");
  }, [recommendation]);

  const save = () => {
    const key = getRecommendationKey(recommendation);
    if (
      savedRef.current === recommendation ||
      savedResultInstances.has(key) ||
      isSaved ||
      isRetrying ||
      isSaving.current
    ) {
      return;
    }

    try {
      isSaving.current = true;
      savedRef.current = recommendation;
      savedResultInstances.add(key);
      if (recommendation.requestId) {
        savedResultInstances.add(recommendation);
      }
      setIsSaved(true);

      saveActivity({
        id: crypto.randomUUID(),
        missionId: recommendation.missionId,
        name: recommendation.title,
        savedAt: new Date().toISOString(),
        durationMinutes: recommendation.durationMinutes,
        instructionText: recommendation.instructionText,
        equipmentNeeded: recommendation.equipmentNeeded,
      });

      setError("");
    } catch {
      savedRef.current = null;
      savedResultInstances.delete(key);
      if (recommendation.requestId) {
        savedResultInstances.delete(recommendation);
      }
      setIsSaved(false);
      setError(
        "Activity could not be saved. Check browser storage permissions.",
      );
    } finally {
      isSaving.current = false;
    }
  };

  return {
    save,
    isSaved,
    error,
    // Aliases for compatibility
    complete: save,
    completed: isSaved,
  };
}
