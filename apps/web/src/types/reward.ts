export type RewardBadgeId =
  | "koala"
  | "kangaroo"
  | "saltwater-crocodile"
  | "green-sea-turtle";

export type RewardState = {
  currentStreak: number;
  lastCompletedDate: string | null;
  unlockedBadgeIds: RewardBadgeId[];
};

export type MilestoneBadge = {
  id: RewardBadgeId;
  milestoneDays: number;
  speciesName: string;
  icon: string;
};
