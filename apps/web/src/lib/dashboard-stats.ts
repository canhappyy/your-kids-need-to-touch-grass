import type { CompletedMission } from "@/types/completed-mission";
import type {
  DashboardDay,
  DashboardStats,
  VarietyTagCount,
} from "@/types/dashboard";

/**
 * Australian Department of Health guideline target: 60 minutes of daily physical activity for children aged 5–17.
 */
export const DAILY_GOAL_MINUTES = 60;

/**
 * Number of days in a standard weekly rolling window.
 */
export const WEEK_DAY_COUNT = 7;

/**
 * Converts a JavaScript Date into a local date key formatted as YYYY-MM-DD.
 *
 * @param date - The Date object to format.
 * @returns An ISO date key string in YYYY-MM-DD format.
 */
function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Anchors a Date at local midday (12:00:00) to prevent daylight savings shifts from rolling across midnight.
 *
 * @param date - Input date.
 * @returns Midday Date instance on the same calendar day.
 */
function localNoon(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

/**
 * Generates an array of 7 consecutive dates representing the current week (Monday through Sunday).
 *
 * @param now - Reference date determining the active week.
 * @returns An array of 7 Date objects anchored at local midday starting on Monday.
 */
function currentWeekDates(now: Date): Date[] {
  const today = localNoon(now);
  // (getDay() + 6) % 7 calculates days since Monday (where Sunday is day 0 -> 6 days since Monday)
  const mondayOffset = (today.getDay() + 6) % WEEK_DAY_COUNT;
  const monday = new Date(today);
  monday.setDate(monday.getDate() - mondayOffset);

  return Array.from({ length: WEEK_DAY_COUNT }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

/**
 * Generates the complete Monday-to-Sunday week immediately before the active week.
 *
 * @param now - Reference date determining the active week.
 * @returns An array of 7 Date objects anchored at local midday.
 */
function previousWeekDates(now: Date): Date[] {
  const dates = currentWeekDates(now);
  const previousMonday = new Date(dates[0]);
  previousMonday.setDate(previousMonday.getDate() - WEEK_DAY_COUNT);

  return Array.from({ length: WEEK_DAY_COUNT }, (_, index) => {
    const date = new Date(previousMonday);
    date.setDate(previousMonday.getDate() + index);
    return date;
  });
}

/**
 * Computes the inclusive number of calendar days between two dates.
 *
 * @param first - Earliest date in the range.
 * @param last - Latest date in the range.
 * @returns Total count of unique calendar days spanned (minimum 1).
 */
function inclusiveCalendarDays(first: Date, last: Date): number {
  let count = 1;
  const cursor = localNoon(first);
  const endKey = localDateKey(last);
  while (localDateKey(cursor) < endKey) {
    cursor.setDate(cursor.getDate() + 1);
    count += 1;
  }
  return count;
}

/**
 * Converts an integer into its English ordinal representation (e.g. 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th").
 * Correctly accounts for English teens exceptions (11th, 12th, 13th).
 *
 * @param value - Integer number to format.
 * @returns Formatted ordinal string.
 */
/**
 * Aggregates frequency counts of completed activities grouped by developmental variety tags.
 *
 * @param records - List of completed mission history records.
 * @returns Array of tag counts sorted by popularity (descending), then alphabetically.
 */
function countVarietyTags(records: CompletedMission[]): VarietyTagCount[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    for (const tag of new Set(record.varietyTags ?? [])) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

/**
 * Aggregates device-local completed mission records into dashboard metrics.
 *
 * Calculations performed:
 * 1. Filters and validates timestamps to include only valid records occurring on or before `now`.
 * 2. Compiles daily active minutes across Monday through Sunday of the active week.
 * 3. Evaluates daily goal attainment (60 minutes) for each day.
 * 4. Derives current-week and previous-week daily averages, plus all-time activity counts and walking distances.
 * 5. Categorizes play diversity via variety tag frequency counts.
 *
 * @param records - Array of completed mission records stored locally.
 * @param now - Reference timestamp (defaults to current system time).
 * @returns Comprehensive `DashboardStats` view-model object.
 */
export function buildDashboardStats(
  records: CompletedMission[],
  now = new Date(),
): DashboardStats {
  // Filter valid historical records up to current moment
  const validRecords = records
    .map((record) => ({ record, completedAt: new Date(record.completedAt) }))
    .filter(
      ({ completedAt }) =>
        Number.isFinite(completedAt.getTime()) &&
        completedAt.getTime() <= now.getTime(),
    )
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());

  const weekDates = currentWeekDates(now);
  const previousWeekDateKeys = new Set(
    previousWeekDates(now).map((date) => localDateKey(date)),
  );
  const todayKey = localDateKey(now);
  const minutesByDate = new Map<string, number>(
    weekDates.map((date) => [localDateKey(date), 0]),
  );

  // Accumulate minutes for each day in the current week
  for (const { record, completedAt } of validRecords) {
    const key = localDateKey(completedAt);
    if (minutesByDate.has(key)) {
      minutesByDate.set(key, (minutesByDate.get(key) ?? 0) + record.durationMinutes);
    }
  }

  // Construct weekly day records
  const days: DashboardDay[] = weekDates.map((date) => {
    const dateKey = localDateKey(date);
    const minutes = minutesByDate.get(dateKey) ?? 0;
    return {
      date,
      dateKey,
      minutes,
      metGoal: minutes >= DAILY_GOAL_MINUTES,
      isFuture: dateKey > todayKey,
    };
  });

  const completedRecords = validRecords.map(({ record }) => record);
  const firstDate = validRecords.at(0)?.completedAt;
  const latestDate = validRecords.at(-1)?.completedAt;
  const observedDays =
    firstDate && latestDate ? inclusiveCalendarDays(firstDate, latestDate) : 0;

  const totalMinutes = completedRecords.reduce(
    (sum, record) => sum + record.durationMinutes,
    0,
  );
  const totalWalkingKm = completedRecords.reduce(
    (sum, record) => sum + (record.walkingDistanceKm ?? 0),
    0,
  );
  const currentWeekMinutes = days.reduce((sum, day) => sum + day.minutes, 0);
  const elapsedCurrentWeekDays =
    days.findIndex((day) => day.dateKey === todayKey) + 1;
  const previousWeekMinutes = completedRecords
    .filter((record) =>
      previousWeekDateKeys.has(localDateKey(new Date(record.completedAt))),
    )
    .reduce((sum, record) => sum + record.durationMinutes, 0);
  const hasPreviousWeekActivity = completedRecords.some((record) =>
    previousWeekDateKeys.has(localDateKey(new Date(record.completedAt))),
  );
  const previousWeekAverageMinutes = hasPreviousWeekActivity
    ? Math.round(previousWeekMinutes / WEEK_DAY_COUNT)
    : null;

  const averageMinutesPerDay = observedDays
    ? Math.round(totalMinutes / observedDays)
    : 0;
  const daysMeetingGoal = days.filter((day) => day.metGoal).length;

  return {
    days,
    todayMinutes: minutesByDate.get(todayKey) ?? 0,
    todayGoalPercentage: Math.min(
      100,
      Math.round(((minutesByDate.get(todayKey) ?? 0) / DAILY_GOAL_MINUTES) * 100),
    ),
    weeklyMinutes: days.reduce((sum, day) => sum + day.minutes, 0),
    currentWeekAverageMinutes: elapsedCurrentWeekDays
      ? Math.round(currentWeekMinutes / elapsedCurrentWeekDays)
      : 0,
    previousWeekAverageMinutes,
    previousWeekMinutes,
    daysMeetingGoal,
    goalDayRate: Math.round((daysMeetingGoal / WEEK_DAY_COUNT) * 100),
    activityCount: completedRecords.length,
    averageMinutesPerDay,
    averageWalkingKmPerDay: observedDays
      ? Math.round((totalWalkingKm / observedDays) * 10) / 10
      : 0,
    varietyTagCounts: countVarietyTags(completedRecords),
  };
}
