"use client";

import { useCallback, useEffect, useState } from "react";

import {
  PLANNED_ACTIVITIES_KEY,
  PLANNER_CHANGE_EVENT,
  readPlannedActivities,
  removePlannedActivity,
} from "@/lib/planned-activities";
import type { PlannedActivity } from "@/types/planner";

export const PLANNER_STORAGE_ERROR =
  "Planned activities could not be read. Browser storage may be unavailable or damaged.";

export function isPlannerStorageEventKey(key: string | null): boolean {
  return key === PLANNED_ACTIVITIES_KEY || key === null;
}

export function usePlannedActivities(currentDate: Date) {
  const [activities, setActivities] = useState<PlannedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    try {
      setActivities(readPlannedActivities());
      setError("");
    } catch {
      setError(PLANNER_STORAGE_ERROR);
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
      if (isPlannerStorageEventKey(event.key)) refresh();
    };
    const onPlannerChange = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener(PLANNER_CHANGE_EVENT, onPlannerChange);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PLANNER_CHANGE_EVENT, onPlannerChange);
    };
  }, [currentDate, refresh]);

  const remove = useCallback(
    (id: string) => {
      try {
        removePlannedActivity(id);
        refresh();
      } catch {
        setError(PLANNER_STORAGE_ERROR);
      }
    },
    [refresh],
  );

  return { activities, loading, error, refresh, remove };
}
