"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BACKLOG_CHANGE_EVENT,
  HISTORY_KEY,
  readCompletedMissions,
} from "@/lib/completed-missions";
import { MILESTONE_BADGES, REWARDS_KEY, reconcileRewards } from "@/lib/rewards";
import type { CompletedMission } from "@/types/completed-mission";
import type { MilestoneBadge, RewardState } from "@/types/reward";

const EMPTY_REWARDS: RewardState = {
  currentStreak: 0,
  lastCompletedDate: null,
  unlockedBadgeIds: [],
};

type RewardsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Reconciles rewards using the current clock time at the moment of each event. */
export function synchronizeRewards(
  store: RewardsStorage = window.localStorage,
  now = new Date(),
  badges: readonly MilestoneBadge[] = MILESTONE_BADGES,
): RewardState {
  return reconcileRewards(readCompletedMissions(store), now, store, badges);
}

/** Hydrates and synchronizes local streak rewards with completion history. */
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

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === HISTORY_KEY ||
        event.key === REWARDS_KEY ||
        event.key === null
      ) {
        refresh();
      }
    };
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
