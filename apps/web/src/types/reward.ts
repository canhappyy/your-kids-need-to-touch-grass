export type RewardBadgeId =
  | "koala"
  | "kangaroo"
  | "red-kangaroo"
  | "saltwater-crocodile"
  | "green-sea-turtle"
  | "green-turtle"
  | (string & {});

export type RewardState = {
  currentStreak: number;
  lastCompletedDate: string | null;
  unlockedBadgeIds: string[];
};

export type MilestoneBadge = {
  id: string;
  milestoneDays: number;
  speciesName: string;
  icon: string;
  lockedIcon?: string;
  category?: string;
  requirement?: string;
  targetMetric?: string;
  targetValue?: string;
};
