import { z } from "zod";
import type { CompletedMission } from "@/types/completed-mission";
import type {
  MilestoneBadge,
  RewardBadgeId,
  RewardState,
} from "@/types/reward";

export const REWARDS_KEY = "playgo.rewards.v1";

export const MILESTONE_BADGES: readonly MilestoneBadge[] = [
  { id: "koala", milestoneDays: 3, speciesName: "Koala", icon: "🐨" },
  {
    id: "kangaroo",
    milestoneDays: 5,
    speciesName: "Kangaroo",
    icon: "🦘",
  },
  {
    id: "saltwater-crocodile",
    milestoneDays: 7,
    speciesName: "Saltwater Crocodile",
    icon: "🐊",
  },
  {
    id: "green-sea-turtle",
    milestoneDays: 14,
    speciesName: "Green Sea Turtle",
    icon: "🐢",
  },
] as const;

export type RewardStorage = Pick<Storage, "getItem" | "setItem">;

const badgeIdSchema = z.enum([
  "koala",
  "kangaroo",
  "saltwater-crocodile",
  "green-sea-turtle",
]);

const rewardStateSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  lastCompletedDate: z.iso.date().nullable(),
  unlockedBadgeIds: z.array(badgeIdSchema),
});

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftLocalDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function orderedUniqueCompletionDates(
  records: CompletedMission[],
  now: Date,
): string[] {
  return [
    ...new Set(
      records
        .map((record) => new Date(record.completedAt))
        .filter(
          (completedAt) =>
            Number.isFinite(completedAt.getTime()) &&
            completedAt.getTime() <= now.getTime(),
        )
        .map(localDateKey),
    ),
  ].sort();
}

function streakLengths(dateKeys: string[]): {
  latestRun: number;
  longestRun: number;
} {
  let latestRun = 0;
  let longestRun = 0;
  let previous: string | undefined;

  for (const dateKey of dateKeys) {
    latestRun =
      previous !== undefined && dateKey === shiftLocalDateKey(previous, 1)
        ? latestRun + 1
        : 1;
    longestRun = Math.max(longestRun, latestRun);
    previous = dateKey;
  }

  return { latestRun, longestRun };
}

/** Reads and validates persisted streak and badge data. */
export function readRewards(
  store: RewardStorage = window.localStorage,
): RewardState | null {
  const raw = store.getItem(REWARDS_KEY);
  if (raw === null) return null;
  return rewardStateSchema.parse(JSON.parse(raw));
}

function persistRewards(state: RewardState, store: RewardStorage): void {
  const serialized = JSON.stringify(state);
  if (store.getItem(REWARDS_KEY) !== serialized) {
    store.setItem(REWARDS_KEY, serialized);
  }
}

/** Rebuilds streak data from completion history while preserving earned badges. */
export function reconcileRewards(
  records: CompletedMission[],
  now = new Date(),
  store: RewardStorage = window.localStorage,
): RewardState {
  const existing = readRewards(store);
  const dateKeys = orderedUniqueCompletionDates(records, now);
  const { latestRun, longestRun } = streakLengths(dateKeys);
  const latestDate = dateKeys.at(-1) ?? null;
  const today = localDateKey(now);
  const yesterday = shiftLocalDateKey(today, -1);
  const currentStreak =
    latestDate === today || latestDate === yesterday ? latestRun : 0;
  const unlocked = new Set<RewardBadgeId>(existing?.unlockedBadgeIds ?? []);

  for (const badge of MILESTONE_BADGES) {
    if (longestRun >= badge.milestoneDays) unlocked.add(badge.id);
  }

  const state: RewardState = {
    currentStreak,
    lastCompletedDate: latestDate,
    unlockedBadgeIds: MILESTONE_BADGES.map((badge) => badge.id).filter((id) =>
      unlocked.has(id),
    ),
  };
  persistRewards(state, store);
  return state;
}

/** Clears active streak data without relocking earned badges. */
export function resetRewardStreak(
  store: RewardStorage = window.localStorage,
): RewardState {
  const existing = readRewards(store);
  const state: RewardState = {
    currentStreak: 0,
    lastCompletedDate: null,
    unlockedBadgeIds: existing?.unlockedBadgeIds ?? [],
  };
  persistRewards(state, store);
  return state;
}
