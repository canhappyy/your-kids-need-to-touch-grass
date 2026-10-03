export type DashboardView = "daily" | "weekly";

export type DashboardDay = {
  date: Date;
  dateKey: string;
  minutes: number;
  metGoal: boolean;
};

export type DashboardStats = {
  days: DashboardDay[];
  todayMinutes: number;
  weeklyMinutes: number;
  daysMeetingGoal: number;
  goalDayRate: number;
};
