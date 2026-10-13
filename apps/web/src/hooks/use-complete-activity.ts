"use client";

import { useState } from "react";
import { saveCompletedMission } from "@/lib/completed-missions";
import { WALKING_DETOUR_FACTOR } from "@/lib/commute";
import type { Recommendation } from "@/types/recommendation";

/**
 * Persists a recommendation as completed activity history.
 */
export function useCompleteActivity(
  recommendation: Recommendation,
  isRetrying: boolean,
  childAgeRange?: [number, number],
) {
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  const complete = () => {
    if (completed || isRetrying) return;

    try {
      saveCompletedMission({
        id: crypto.randomUUID(),
        missionId: recommendation.missionId,
        name: recommendation.title,
        completedAt: new Date().toISOString(),
        durationMinutes: recommendation.durationMinutes,
        instructionText: recommendation.instructionText ?? null,
        equipmentNeeded: recommendation.equipmentNeeded ?? null,
        childAgeRange,
        walkingDistanceKm: recommendation.venue
          ? Math.round(
              recommendation.venue.distanceKm * 2 * WALKING_DETOUR_FACTOR * 100,
            ) / 100
          : 0,
        varietyTags: recommendation.varietyTags,
        socialTag: recommendation.socialTag,
      });
      setCompleted(true);
      setError("");
    } catch {
      setError(
        "Activity could not be marked complete. Check browser storage permissions.",
      );
    }
  };

  return { complete, completed, error };
}
