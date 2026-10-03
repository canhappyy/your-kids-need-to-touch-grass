"use client";

import { useCallback, useEffect, useState } from "react";
import { BACKLOG_CHANGE_EVENT } from "@/lib/completed-missions";
import {
  clearSavedActivities,
  moveSavedToCompleted,
  readSavedActivities,
  removeSavedActivity,
  SAVED_ACTIVITIES_KEY,
} from "@/lib/saved-activities";
import type { SavedActivity } from "@/types/saved-activity";

/**
 * React hook that manages saved activities in the user's backlog.
 *
 * Automatically synchronizes across browser tabs and storage events,
 * and provides operations to remove activities or move them to completed.
 *
 * @returns An object containing:
 * - `savedActivities`: Array of saved activities sorted by save date (newest first).
 * - `loading`: Boolean indicating whether initial storage hydration is in progress.
 * - `error`: User-facing error message string if storage read or write fails.
 * - `refresh`: Function to re-read activities from storage.
 * - `remove`: Function to remove a saved activity.
 * - `markComplete`: Function to move a saved activity to completed activities.
 * - `clear`: Function to clear all saved activities.
 */
export function useSavedActivities() {
  const [savedActivities, setSavedActivities] = useState<SavedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    try {
      setSavedActivities(readSavedActivities());
      setError("");
    } catch {
      setError("Saved activities could not be read. Browser storage may be unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) refresh();
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVED_ACTIVITIES_KEY || event.key === null) {
        refresh();
      }
    };
    const onCustomEvent = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener(BACKLOG_CHANGE_EVENT, onCustomEvent);

    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(BACKLOG_CHANGE_EVENT, onCustomEvent);
    };
  }, [refresh]);

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
