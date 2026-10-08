"use client";

import { useCallback, useEffect, useState } from "react";
import { BACKLOG_CHANGE_EVENT } from "@/lib/completed-missions";
import { PLANNER_CHANGE_EVENT } from "@/lib/planned-activities";
import {
  clearSavedActivities,
  moveSavedToCompleted,
  removeSavedActivity,
  syncSavedActivities,
  SAVED_ACTIVITIES_KEY,
} from "@/lib/saved-activities";
import { useDashboardDate } from "@/hooks/use-dashboard-date";
import type { SavedActivity } from "@/types/saved-activity";

/**
 * React hook that manages saved activities in the user's backlog.
 *
 * Automatically synchronizes across browser tabs, storage events, and midnight day rollover,
 * clearing uncompleted activities from previous days and importing today's planned activities.
 *
 * @param providedDate - Optional current local date override (useful for testing or fixed clock).
 * @returns An object containing:
 * - `savedActivities`: Array of saved activities sorted by save date (newest first).
 * - `loading`: Boolean indicating whether initial storage hydration is in progress.
 * - `error`: User-facing error message string if storage read or write fails.
 * - `refresh`: Function to re-read activities from storage.
 * - `remove`: Function to remove a saved activity.
 * - `markComplete`: Function to move a saved activity to completed activities.
 * - `clear`: Function to clear all saved activities.
 */
export function useSavedActivities(providedDate?: Date) {
  const liveDate = useDashboardDate();
  const currentDate = providedDate ?? liveDate;
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(
    (activeDate = currentDate) => {
      try {
        setSavedActivities(syncSavedActivities(activeDate, window.localStorage));
        setError("");
      } catch {
        setError(
          "Saved activities could not be read. Browser storage may be unavailable.",
        );
      } finally {
        setLoading(false);
      }
    },
    [currentDate],
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) refresh(currentDate);
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVED_ACTIVITIES_KEY || event.key === null) {
        refresh(currentDate);
      }
    };
    const onCustomEvent = () => refresh(currentDate);

    window.addEventListener("storage", onStorage);
    window.addEventListener(BACKLOG_CHANGE_EVENT, onCustomEvent);
    window.addEventListener(PLANNER_CHANGE_EVENT, onCustomEvent);

    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(BACKLOG_CHANGE_EVENT, onCustomEvent);
      window.removeEventListener(PLANNER_CHANGE_EVENT, onCustomEvent);
    };
  }, [currentDate, refresh]);

  const remove = (id: string) => {
    try {
      removeSavedActivity(id);
      refresh();
      return true;
    } catch {
      setError("Failed to remove saved activity.");
      return false;
    }
  };

  const markComplete = (id: string) => {
    try {
      const completed = moveSavedToCompleted(id);
      refresh();
      return completed !== null;
    } catch {
      setError("Failed to move activity to completed.");
      return false;
    }
  };

  const clear = () => {
    try {
      clearSavedActivities();
      setSavedActivities([]);
      setError("");
      return true;
    } catch {
      setError("Failed to clear saved activities.");
      return false;
    }
  };

  return {
    savedActivities,
    loading,
    error,
    refresh,
    remove,
    markComplete,
    clear,
  };
}
