import type { CompletedMission } from "@/types/completed-mission";
import type { DashboardDay, DashboardStats } from "@/types/dashboard";

export const DAILY_GOAL_MINUTES = 60;
export const ROLLING_DAY_COUNT = 7;
export const NATIONAL_MEETING_RATE = 26;

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Builds dashboard activity statistics from locally completed missions. */
export function buildDashboardStats(
  records: CompletedMission[],
  now = new Date(),
): DashboardStats {
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);

  const dates = Array.from({ length: ROLLING_DAY_COUNT }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (ROLLING_DAY_COUNT - 1 - index));
    return date;
  });
  const minutesByDate = new Map(
    dates.map((date) => [localDateKey(date), 0] as const),
  );

  for (const record of records) {
    const completedAt = new Date(record.completedAt);
    const key = localDateKey(completedAt);
    const minutes = minutesByDate.get(key);
    if (minutes !== undefined) {
      minutesByDate.set(key, minutes + record.durationMinutes);
    }
  }

  const days: DashboardDay[] = dates.map((date) => {
    const dateKey = localDateKey(date);
    const minutes = minutesByDate.get(dateKey) ?? 0;
    return {
      date,
      dateKey,
      minutes,
      metGoal: minutes >= DAILY_GOAL_MINUTES,
    };
  });
  const weeklyMinutes = days.reduce((total, day) => total + day.minutes, 0);
  const daysMeetingGoal = days.filter((day) => day.metGoal).length;

  return {
    days,
    todayMinutes: days.at(-1)?.minutes ?? 0,
    weeklyMinutes,
    daysMeetingGoal,
    goalDayRate: Math.round((daysMeetingGoal / ROLLING_DAY_COUNT) * 100),
  };
}
