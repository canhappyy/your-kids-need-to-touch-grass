import { z } from "zod";
import type { CompletedMission } from "@/types/completed-mission";
import type { MilestoneBadge, RewardState } from "@/types/reward";

export const REWARDS_KEY = "playgo.rewards.v1";

export const MILESTONE_BADGES: readonly MilestoneBadge[] = [
  {
    id: "koala",
    milestoneDays: 3,
    speciesName: "Koala",
    icon: "koala.svg",
    lockedIcon: "koala_locked.svg",
  },
  {
    id: "green-sea-turtle",
    milestoneDays: 5,
    speciesName: "Green Sea Turtle",
    icon: "green_turtle.svg",
    lockedIcon: "green_turtle_locked.svg",
  },
  {
    id: "saltwater-crocodile",
    milestoneDays: 7,
    speciesName: "Saltwater Crocodile",
    icon: "saltwater_crocodile.svg",
    lockedIcon: "saltwater_crocodile_locked.svg",
  },
  {
    id: "kangaroo",
    milestoneDays: 14,
    speciesName: "Kangaroo",
    icon: "red_kangaroo.svg",
    lockedIcon: "red_kangaroo_locked.svg",
  },
] as const;

export type RewardStorage = Pick<Storage, "getItem" | "setItem">;

const badgeIdSchema = z.string().min(1);

const rewardStateSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  lastCompletedDate: z.iso.date().nullable(),
  unlockedBadgeIds: z.array(badgeIdSchema),
  completionCount: z.number().int().nonnegative().default(0),
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

function hasEarnedBadge(
  badge: MilestoneBadge,
  records: CompletedMission[],
  longestRun: number,
): boolean {
  const value = badge.ruleValue?.trim() ?? "";
  const numericValue = Number(value);
  const compare = (actual: number): boolean => {
    switch (badge.ruleOperator) {
      case "gte":
        return actual >= numericValue;
      case "lte":
        return actual <= numericValue;
      case "equals":
        return actual === numericValue;
      default:
        return false;
    }
  };

  switch (badge.ruleType) {
    case "streak_days":
      return compare(longestRun);
    case "total_completed":
      return compare(records.length);
    case "completed_in_one_day": {
      const counts = new Map<string, number>();
      for (const record of records) {
        const date = localDateKey(new Date(record.completedAt));
        counts.set(date, (counts.get(date) ?? 0) + 1);
      }
      return compare(Math.max(0, ...counts.values()));
    }
    case "first_matching_activity":
      return records.some((record) => {
        const actual =
          badge.ruleField === "duration_minutes"
            ? String(record.durationMinutes)
            : badge.ruleField === "social_tag"
              ? record.socialTag
              : record.varietyTags?.join("|");
        if (!actual) return false;
        if (badge.ruleOperator === "contains") {
          return actual.toLowerCase().includes(value.toLowerCase());
        }
        if (badge.ruleOperator === "equals") {
          return actual.toLowerCase() === value.toLowerCase();
        }
        return compare(Number(actual));
      });
    default:
      return false;
  }
}

/** Rebuilds streak data from completion history while preserving earned badges. */
export function reconcileRewards(
  records: CompletedMission[],
  now = new Date(),
  store: RewardStorage = window.localStorage,
  badges: readonly MilestoneBadge[] = MILESTONE_BADGES,
): RewardState {
  const existing = readRewards(store);
  const dateKeys = orderedUniqueCompletionDates(records, now);
  const { latestRun, longestRun } = streakLengths(dateKeys);
  const latestDate = dateKeys.at(-1) ?? null;
  const today = localDateKey(now);
  const yesterday = shiftLocalDateKey(today, -1);
  const currentStreak =
    latestDate === today || latestDate === yesterday ? latestRun : 0;
  const unlocked = new Set<string>(existing?.unlockedBadgeIds ?? []);

  // 1. Streak milestones unlock directly when the streak criteria is met
  for (const badge of badges) {
    const isStreak =
      badge.milestoneDays > 0 ||
      (badge.ruleType === "streak_days" && Number(badge.ruleValue) > 0);
    const requiredDays =
      badge.milestoneDays > 0
        ? badge.milestoneDays
        : Number(badge.ruleValue) || 0;

    if (isStreak && requiredDays > 0 && longestRun >= requiredDays) {
      unlocked.add(badge.id);
    }
  }

  // 2. Non-streak activity metric badges are paced by completions
  const eligibleNonStreak = badges
    .filter(
      (badge) =>
        !unlocked.has(badge.id) &&
        badge.milestoneDays === 0 &&
        badge.ruleType !== "streak_days" &&
        hasEarnedBadge(badge, records, longestRun),
    )
    .sort(
      (a, b) =>
        (a.unlockPriority ?? 100) - (b.unlockPriority ?? 100) ||
        a.id.localeCompare(b.id),
    );

  const newCompletions = Math.max(
    0,
    records.length - (existing?.completionCount ?? 0),
  );

  const hasActivityBadges = Array.from(unlocked).some((id) => {
    const b = badges.find((badge) => badge.id === id);
    return b && b.milestoneDays === 0 && b.ruleType !== "streak_days";
  });

  const unlockLimit = !hasActivityBadges
    ? Math.max(2, newCompletions)
    : newCompletions;

  for (const badge of eligibleNonStreak.slice(0, unlockLimit)) {
    unlocked.add(badge.id);
  }

  const knownIds = new Set(badges.map((badge) => badge.id));
  const state: RewardState = {
    currentStreak,
    lastCompletedDate: latestDate,
    completionCount: records.length,
    unlockedBadgeIds: [
      ...badges.map((badge) => badge.id).filter((id) => unlocked.has(id)),
      ...Array.from(unlocked).filter((id) => !knownIds.has(id)),
    ],
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
    completionCount: 0,
    unlockedBadgeIds: existing?.unlockedBadgeIds ?? [],
  };
  persistRewards(state, store);
  return state;
}
