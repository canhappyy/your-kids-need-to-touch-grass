import { z } from "zod";
import type { CompletedMission } from "@/types/completed-mission";
import type { MilestoneBadge, RewardState } from "@/types/reward";

/**
 * Storage key used to persist gamification streak and earned badge state in localStorage.
 */
export const REWARDS_KEY = "playgo.rewards.v1";

/**
 * Bundled offline fallback catalog of Australian wildlife milestone badges.
 *
 * Used when the backend database is unreachable or for initial client bootstrapping.
 */
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

/**
 * Storage contract required for persisting and reading gamification rewards.
 */
export type RewardStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Schema validating individual badge identifier strings.
 */
const badgeIdSchema = z.string().min(1);

/**
 * Zod schema validating the serialized reward state object.
 */
const rewardStateSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  lastCompletedDate: z.iso.date().nullable(),
  unlockedBadgeIds: z.array(badgeIdSchema),
  completionCount: z.number().int().nonnegative().default(0),
});

/**
 * Formats a Date object into a local date string (YYYY-MM-DD).
 *
 * @param date - JavaScript Date instance.
 * @returns An ISO date key string in YYYY-MM-DD format.
 */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Shifts a local date key forward or backward by a given number of calendar days.
 *
 * @param dateKey - Starting date key (YYYY-MM-DD).
 * @param days - Days to shift (positive for forward, negative for backward).
 * @returns The shifted date key (YYYY-MM-DD).
 */
function shiftLocalDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

/**
 * Extracts a deduplicated and ascending sorted list of calendar date keys from completion records.
 *
 * Filters out records with timestamps that are invalid or in the future relative to `now`.
 *
 * @param records - List of completed mission history entries.
 * @param now - Reference timestamp.
 * @returns Array of unique YYYY-MM-DD date strings sorted oldest to newest.
 */
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

/**
 * Calculates consecutive daily streak runs from a chronological list of unique date keys.
 *
 * @param dateKeys - Sorted list of unique YYYY-MM-DD date strings.
 * @returns An object containing `latestRun` (length of most recent run) and `longestRun` (all-time peak streak).
 */
function streakLengths(dateKeys: string[]): {
  latestRun: number;
  longestRun: number;
} {
  let latestRun = 0;
  let longestRun = 0;
  let previous: string | undefined;

  for (const dateKey of dateKeys) {
    // Check if the current date is exactly 1 day after the previous date
    latestRun =
      previous !== undefined && dateKey === shiftLocalDateKey(previous, 1)
        ? latestRun + 1
        : 1;
    longestRun = Math.max(longestRun, latestRun);
    previous = dateKey;
  }

  return { latestRun, longestRun };
}

/**
 * Reads and validates the user's active streak and unlocked badge state from client storage.
 *
 * @param store - The storage backend to read from (defaults to `window.localStorage`).
 * @returns Validated `RewardState` object or null if no rewards have been stored yet.
 */
export function readRewards(
  store: RewardStorage = window.localStorage,
): RewardState | null {
  const raw = store.getItem(REWARDS_KEY);
  if (raw === null) return null;
  return rewardStateSchema.parse(JSON.parse(raw));
}

/**
 * Serializes and writes the reward state to storage only if the state has changed.
 *
 * @param state - The reward state to store.
 * @param store - The storage backend to write to.
 */
function persistRewards(state: RewardState, store: RewardStorage): void {
  const serialized = JSON.stringify(state);
  if (store.getItem(REWARDS_KEY) !== serialized) {
    store.setItem(REWARDS_KEY, serialized);
  }
}

/**
 * Evaluates whether a non-streak achievement badge has met its unlock criteria based on activity history.
 *
 * Supports various rule operators:
 * - `streak_days`: compares longest streak run against required days.
 * - `total_completed`: compares total completed activity count.
 * - `completed_in_one_day`: compares peak activities finished on a single calendar day.
 * - `first_matching_activity`: checks if any single completed activity matches duration, social tag, or variety tags.
 *
 * @param badge - Milestone badge definition to evaluate.
 * @param records - Completed mission records.
 * @param longestRun - Maximum consecutive daily streak achieved.
 * @returns True if badge requirements are met, false otherwise.
 */
function hasEarnedBadge(
  badge: MilestoneBadge,
  records: CompletedMission[],
  longestRun: number,
): boolean {
  const value = badge.ruleValue?.trim() ?? "";
  const numericValue = Number(value);

  // Helper evaluating comparison operators (gte, lte, equals)
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
      // Group completions by calendar day and find maximum on any single day
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

/**
 * Reconciles the child's streak and unlocked badges from raw completion history.
 *
 * How this works:
 * 1. Derives unique calendar completion dates and computes consecutive daily streaks.
 * 2. Determines current active streak: if the most recent completion was today or yesterday,
 *    the streak is maintained; if two or more days have elapsed, the current streak resets to 0.
 * 3. Evaluates streak milestone badges against `longestRun` so earned badges are never lost.
 * 4. Paces non-streak badge rewards based on newly completed activities to ensure an engaging progression.
 * 5. Persists the updated reward state and returns it.
 *
 * @param records - List of completed mission records.
 * @param now - Reference date/time (defaults to current date).
 * @param store - Client storage backend (defaults to `window.localStorage`).
 * @param badges - Badge catalog to evaluate against (defaults to `MILESTONE_BADGES`).
 * @returns The newly reconciled and persisted `RewardState`.
 */
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

  // Active streak is retained if the latest activity was completed today or yesterday
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

/**
 * Resets the active daily streak to zero (e.g. after history is cleared) while
 * preserving any previously earned badges in the user's trophy collection.
 *
 * @param store - The storage backend to update (defaults to `window.localStorage`).
 * @returns The updated `RewardState` with zeroed streak.
 */
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
