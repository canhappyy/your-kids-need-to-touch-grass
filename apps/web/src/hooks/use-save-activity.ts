"use client";

import { useEffect, useRef, useState } from "react";
import { isActivitySaved, saveActivity, SAVED_ACTIVITIES_KEY } from "@/lib/saved-activities";
import { BACKLOG_CHANGE_EVENT } from "@/lib/completed-missions";
import type { Recommendation } from "@/types/recommendation";

/**
 * Custom hook that manages the action of saving an activity recommendation to the backlog.
 *
 * Checks whether the recommendation is already saved, and provides a synchronous
 * double-click guard and error handling.
 *
 * @param recommendation - The currently active mission recommendation.
 * @param isRetrying - Boolean flag indicating if an activity retry or fetch is currently in progress.
 * @returns An object containing:
 *   - `save`: Function to save the recommendation to the backlog.
 *   - `isSaved`: Boolean indicating whether this recommendation is saved.
 *   - `error`: Error message string if saving failed, or empty string on success.
 */
export function useSaveActivity(
  recommendation: Recommendation,
  isRetrying: boolean,
) {
  const saved = useRef<Recommendation | null>(null);
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return isActivitySaved(recommendation.missionId);
    } catch {
      return false;
    }
  });
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const alreadySaved = isActivitySaved(recommendation.missionId);
      setIsSaved(alreadySaved);
      if (alreadySaved) {
        saved.current = recommendation;
      }
    } catch {
      // ignore
    }
  }, [recommendation.missionId, recommendation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorageChange = () => {
      try {
        setIsSaved(isActivitySaved(recommendation.missionId));
      } catch {
        // ignore
      }
    };
    window.addEventListener(BACKLOG_CHANGE_EVENT, onStorageChange);
    window.addEventListener("storage", onStorageChange);
    return () => {
      window.removeEventListener(BACKLOG_CHANGE_EVENT, onStorageChange);
      window.removeEventListener("storage", onStorageChange);
    };
  }, [recommendation.missionId]);

  const save = () => {
    if (saved.current === recommendation || isSaved || isRetrying) return;
    try {
      saveActivity({
        id: crypto.randomUUID(),
        missionId: recommendation.missionId,
        name: recommendation.title,
        savedAt: new Date().toISOString(),
        durationMinutes: recommendation.durationMinutes,
        instructionText: recommendation.instructionText,
        equipmentNeeded: recommendation.equipmentNeeded,
      });
      saved.current = recommendation;
      setIsSaved(true);
      setError("");
    } catch {
      setError(
        "Activity could not be saved. Check browser storage permissions.",
      );
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
