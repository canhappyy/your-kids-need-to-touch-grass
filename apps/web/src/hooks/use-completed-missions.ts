"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearCompletedMissions,
  HISTORY_KEY,
  readCompletedMissions,
} from "@/lib/completed-missions";
import type { CompletedMission } from "@/types/completed-mission";

/**
 * React hook that manages completed mission history from local storage.
 *
 * Automatically synchronizes across browser tabs via window storage events
 * and provides safe read/clear operations with user-friendly error states.
 *
 * @returns An object containing:
 * - `records`: Array of completed mission history entries sorted by completion date.
 * - `loading`: Boolean indicating whether initial storage hydration is in progress.
 * - `error`: User-facing error message string if storage read or clear fails.
 * - `refresh`: Function to re-read and validate records from storage.
 * - `clear`: Function to wipe all completed missions, returning true on success.
 */
export function useCompletedMissions() {
  const [records, setRecords] = useState<CompletedMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    try {
      setRecords(readCompletedMissions());
      setError("");
    } catch {
      setError(
        "History could not be read. Browser storage may be unavailable or damaged.",
      );
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
      if (event.key === HISTORY_KEY || event.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const clear = () => {
    try {
      clearCompletedMissions();
      setRecords([]);
      setError("");
      return true;
    } catch {
      setError(
        "History could not be cleared. Check browser storage permissions and try again.",
      );
      return false;
    }
  };

  return { records, loading, error, refresh, clear };
}
