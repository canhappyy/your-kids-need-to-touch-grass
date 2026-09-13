"use client";

import { useRef, useState } from "react";
import { saveCompletedMission } from "@/lib/completed-missions";
import type { Recommendation } from "@/types/recommendation";

/**
 * Custom hook that manages the action of marking a recommended mission as completed.
 *
 * How this hook works:
 * 1. Synchronous Guard (`useRef`):
 *    Tracks the currently saved recommendation in a mutable ref (`saved.current`).
 *    This prevents race conditions and rapid double-clicks on the completion button before
 *    React state updates can re-render the UI.
 *
 * 2. Persistent Storage:
 *    Invokes `saveCompletedMission` to append a new completion entry to local browser storage,
 *    storing a unique UUID, the mission ID, title, current ISO timestamp, and duration.
 *
 * 3. Error Handling:
 *    Catches browser storage quota or permission errors and exposes a parent-friendly error
 *    message guiding them to check browser settings or inspect their history page.
 *
 * @param recommendation - The currently active mission recommendation being completed.
 * @param isRetrying - Boolean flag indicating if an activity retry or fetch is currently in progress.
 * @returns An object containing:
 *   - `complete`: Function to record the mission as completed.
 *   - `completed`: Boolean indicating whether this specific recommendation was successfully marked as completed.
 *   - `error`: Error message string if saving failed, or empty string on success.
 */
export function useMissionCompletion(
  recommendation: Recommendation,
  isRetrying: boolean,
) {
  const saved = useRef<Recommendation | null>(null);
  const [savedFor, setSavedFor] = useState<Recommendation | null>(null);
  const [error, setError] = useState("");

  const complete = () => {
    if (saved.current === recommendation || isRetrying) return;
    try {
      saveCompletedMission({
        id: crypto.randomUUID(),
        missionId: recommendation.missionId,
        name: recommendation.title,
        completedAt: new Date().toISOString(),
        durationMinutes: recommendation.durationMinutes,
      });
      saved.current = recommendation;
      setSavedFor(recommendation);
      setError("");
    } catch {
      setError(
        "Completion could not be saved. Check browser storage or visit History to review existing records.",
      );
    }
  };

  return { complete, completed: savedFor === recommendation, error };
}
