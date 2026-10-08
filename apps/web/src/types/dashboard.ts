/**
 * Information for a single calendar day in the 7-day rolling window on the parent dashboard.
 */
export type DashboardDay = {
  /** JavaScript Date object representing this day. */
  date: Date;
  /** ISO date key formatted as YYYY-MM-DD for reliable day-by-day matching and storage lookups. */
  dateKey: string;
  /** Total active play time in minutes accumulated by the child on this day. */
  minutes: number;
  /** Indicates whether the child achieved the Australian national guideline of 60 minutes of daily physical activity. */
  metGoal: boolean;
  /** Indicates whether this day is in the future relative to the user's current local date. */
  isFuture: boolean;
};

/**
 * Aggregated count of completed activities associated with a specific play category or developmental skill.
 */
export type VarietyTagCount = {
  /** The name of the variety tag (e.g. "Nature & Outdoors", "Coordination", "Creativity"). */
  name: string;
  /** The total number of completed activities that include this variety tag. */
  count: number;
};

/**
 * Summary metrics and comparative statistics displayed on the parent insights dashboard.
 */
export type DashboardStats = {
  /** Array of 7 consecutive days representing the past week's active play history. */
  days: DashboardDay[];
  /** Total active play minutes logged today. */
  todayMinutes: number;
  /** Total active play minutes logged across the entire 7-day window. */
  weeklyMinutes: number;
  /** Total number of days in the current 7-day window where the 60-minute daily activity goal was met. */
  daysMeetingGoal: number;
  /** Percentage of days in the window that met the daily 60-minute active play goal (0 to 100). */
  goalDayRate: number;
  /** Progress percentage towards today's 60-minute active play goal (clamped from 0 to 100). */
  todayGoalPercentage: number;
  /** Total count of completed activity missions across the period. */
  activityCount: number;
  /** Average number of active play minutes logged per day across past days. */
  averageMinutesPerDay: number;
  /** Average estimated walking distance in kilometres logged per day from outdoor missions. */
  averageWalkingKmPerDay: number;
  /** Frequency counts of activities completed across different play variety categories. */
  varietyTagCounts: VarietyTagCount[];
  /** Child age bracket [minAge, maxAge] used for national benchmark comparison, or null if unspecified. */
  referenceAgeRange: [number, number] | null;
  /** Human-readable age bracket label (e.g. "5–7 years", "8–9 years", "10–12 years"). */
  referenceAgeLabel: string;
  /** Benchmark daily average active play minutes according to Australian national guidelines for the child's age group. */
  nationalAverageMinutes: number;
  /** Comparative percentile band description relative to Australian national active play benchmarks. */
  percentileBand: string | null;
};
