export type DashboardView = "daily" | "weekly";

export type DashboardDay = {
  date: Date;
  dateKey: string;
  minutes: number;
  metGoal: boolean;
  isFuture: boolean;
};

export type VarietyTagCount = {
  name: string;
  count: number;
};

export type DashboardStats = {
  days: DashboardDay[];
  todayMinutes: number;
  weeklyMinutes: number;
  daysMeetingGoal: number;
  goalDayRate: number;
  todayGoalPercentage: number;
  activityCount: number;
  averageMinutesPerDay: number;
  averageWalkingKmPerDay: number;
  varietyTagCounts: VarietyTagCount[];
  referenceAgeRange: [number, number] | null;
  referenceAgeLabel: string;
  nationalAverageMinutes: number;
  percentileBand: string | null;
};
