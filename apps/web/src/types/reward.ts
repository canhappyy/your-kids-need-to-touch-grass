/**
 * Unique identifier for Australian wildlife achievement badges.
 * Represents distinct species (e.g. koala, kangaroo, crocodile, green turtle) or dynamic custom badge IDs.
 */
export type RewardBadgeId =
  | "koala"
  | "kangaroo"
  | "red-kangaroo"
  | "saltwater-crocodile"
  | "green-sea-turtle"
  | "green-turtle"
  | (string & {});

/**
 * Local gamification progress tracking streaks, completions, and earned milestone badges.
 */
export type RewardState = {
  /** Number of consecutive active play days logged by the user. */
  currentStreak: number;
  /** ISO date string (YYYY-MM-DD) of the most recent completed activity, used for streak continuity calculations. */
  lastCompletedDate: string | null;
  /** Array of badge IDs that the child has successfully earned and unlocked. */
  unlockedBadgeIds: string[];
  /** Total cumulative count of activities marked as completed. */
  completionCount: number;
};

/**
 * Metadata defining a collectible achievement badge celebrating Australian wildlife.
 */
export type MilestoneBadge = {
  /** Unique badge identifier matching a known species code or badge name. */
  id: string;
  /** Minimum consecutive streak days required to unlock this badge, if streak-based. */
  milestoneDays: number;
  /** Common English name of the Australian native species (e.g. "Eastern Grey Kangaroo", "Koala"). */
  speciesName: string;
  /** File path or asset identifier for the full-colour unlocked badge illustration. */
  icon: string;
  /** Optional file path or asset identifier for the silhouette or locked state illustration. */
  lockedIcon?: string;
  /** General category of the badge achievement (e.g. "Streak", "Variety", "Adventure"). */
  category?: string;
  /** Plain English description of the achievement required to unlock this badge. */
  requirement?: string;
  /** Machine-readable rule type classification for automated unlocking logic. */
  ruleType?: string;
  /** Field name checked by the rule engine (e.g. "streakDays", "completedMissions"). */
  ruleField?: string;
  /** Comparison operator used by the rule evaluator (e.g. ">=", "=="). */
  ruleOperator?: string;
  /** Target threshold value required by the rule evaluator. */
  ruleValue?: string;
  /** Educational fun fact or background description about the animal species and active living. */
  description?: string;
  /** Sorting weight determining visual order in the rewards gallery. */
  unlockPriority?: number;
  /** Progression tier classification (e.g. bronze, silver, gold level). */
  unlockTier?: number;
};
