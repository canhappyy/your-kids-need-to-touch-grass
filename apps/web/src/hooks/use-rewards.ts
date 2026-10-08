"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BACKLOG_CHANGE_EVENT,
  HISTORY_KEY,
  readCompletedMissions,
} from "@/lib/completed-missions";
import {
  MILESTONE_BADGES,
  REWARDS_KEY,
  readRewards,
  reconcileRewards,
} from "@/lib/rewards";
import type { CompletedMission } from "@/types/completed-mission";
import type { MilestoneBadge, RewardState } from "@/types/reward";

/**
 * Initial empty reward state used prior to client storage hydration.
 */
const EMPTY_REWARDS: RewardState = {
  currentStreak: 0,
  lastCompletedDate: null,
  completionCount: 0,
  unlockedBadgeIds: [],
};

/**
 * Storage interface required for reading and updating gamification rewards.
 */
type RewardsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Reconciles streak calculations and badge unlock evaluation using the current clock time.
 * Reads the latest completed missions from client storage and updates reward records accordingly.
 *
 * @param store - The storage backend to read from and write to (defaults to `window.localStorage`).
 * @param now - Reference timestamp. Defaults to current clock time (`new Date()`).
 * @param badges - Badge catalog to evaluate against (defaults to `MILESTONE_BADGES`).
 * @returns Reconciled `RewardState` object.
 */
export function synchronizeRewards(
  store: RewardsStorage = window.localStorage,
  now = new Date(),
  badges: readonly MilestoneBadge[] = MILESTONE_BADGES,
): RewardState {
  return reconcileRewards(readCompletedMissions(store), now, store, badges);
}

/**
 * Custom React hook that hydrates and synchronizes local streak rewards and unlocked wildlife badges.
 *
 * Listens for cross-tab `storage` events and internal `BACKLOG_CHANGE_EVENT` notifications so that completing
 * an activity immediately updates badge collections and active streaks across all open application screens.
 *
 * @param records - List of completed mission history records.
 * @param currentDate - Active local calendar date (e.g. from `useDashboardDate`).
 * @param badges - Badge catalog to evaluate against (defaults to `MILESTONE_BADGES`).
 * @returns An object containing:
 * - `rewards`: Active `RewardState` tracking currentStreak, lastCompletedDate, and unlockedBadgeIds.
 * - `loading`: Boolean indicating whether initial storage hydration is in progress.
 * - `error`: User-friendly error message string if storage read or write fails.
 * - `refresh`: Function to manually trigger reward reconciliation from storage.
 */
export function useRewards(
  records: CompletedMission[],
  currentDate: Date,
  badges: readonly MilestoneBadge[] = MILESTONE_BADGES,
) {
  const [rewards, setRewards] = useState<RewardState>(EMPTY_REWARDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    try {
      // If badge catalog is not yet loaded, read whatever state exists in storage
      if (badges.length === 0) {
        const existing = readRewards(window.localStorage);
        if (existing) setRewards(existing);
        return;
      }
      setRewards(synchronizeRewards(window.localStorage, new Date(), badges));
      setError("");
    } catch {
      setError(
        "Rewards could not be read. Browser storage may be unavailable or damaged.",
      );
    } finally {
      setLoading(false);
    }
  }, [badges]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) refresh();
    });

    // Cross-tab storage event handler
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === HISTORY_KEY ||
        event.key === REWARDS_KEY ||
        event.key === null
      ) {
        refresh();
      }
    };

    // Internal app event handler fired on activity completion
    const onCompletion = () => refresh();

    window.addEventListener("storage", onStorage);
    window.addEventListener(BACKLOG_CHANGE_EVENT, onCompletion);

    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(BACKLOG_CHANGE_EVENT, onCompletion);
    };
  }, [currentDate, records, refresh]);

  return { rewards, loading, error, refresh };
}
