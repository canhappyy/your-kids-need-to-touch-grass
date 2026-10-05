import {
  NATIONAL_ACTIVITY_BANDS,
  OVERALL_NATIONAL_ACTIVITY_REFERENCE,
} from "@/data/australian-activity-reference";
import type { CompletedMission } from "@/types/completed-mission";
import type {
  DashboardDay,
  DashboardStats,
  VarietyTagCount,
} from "@/types/dashboard";

export const DAILY_GOAL_MINUTES = 60;
export const WEEK_DAY_COUNT = 7;
/** @deprecated Kept until the legacy dashboard cards are removed. */
export const ROLLING_DAY_COUNT = WEEK_DAY_COUNT;
/** @deprecated Superseded by the bundled ABS 2023 reference. */
export const NATIONAL_MEETING_RATE = 26;

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localNoon(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function currentWeekDates(now: Date): Date[] {
  const today = localNoon(now);
  const mondayOffset = (today.getDay() + 6) % WEEK_DAY_COUNT;
  const monday = new Date(today);
  monday.setDate(monday.getDate() - mondayOffset);
  return Array.from({ length: WEEK_DAY_COUNT }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

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

function ordinal(value: number): string {
  const remainder100 = value % 100;
  const remainder10 = value % 10;
  const suffix =
    remainder100 >= 11 && remainder100 <= 13
      ? "th"
      : remainder10 === 1
        ? "st"
        : remainder10 === 2
          ? "nd"
          : remainder10 === 3
            ? "rd"
            : "th";
  return `${value}${suffix}`;
}

/** Maps an average daily minute value to a normalized ABS distribution band. */
export function calculatePercentileBand(
  averageMinutes: number,
  distribution: readonly number[],
): string {
  const binIndex =
    averageMinutes <= 0
      ? 0
      : averageMinutes < 30
        ? 1
        : averageMinutes < 60
          ? 2
          : averageMinutes < 90
            ? 3
            : averageMinutes < 120
              ? 4
              : averageMinutes < 150
                ? 5
                : averageMinutes < 180
                  ? 6
                  : 7;
  const total = distribution.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return "0th–0th percentile";
  const lower = distribution
    .slice(0, binIndex)
    .reduce((sum, value) => sum + value, 0);
  const upper = lower + (distribution[binIndex] ?? 0);
  return `${ordinal(Math.round((lower / total) * 100))}–${ordinal(
    Math.round((upper / total) * 100),
  )} percentile`;
}

function buildNationalReference(ageRange: [number, number] | null): {
  averageMinutes: number;
  distribution: number[];
  label: string;
} {
  if (!ageRange || ageRange[0] > ageRange[1]) {
    return {
      averageMinutes: OVERALL_NATIONAL_ACTIVITY_REFERENCE.averageMinutes,
      distribution: [...OVERALL_NATIONAL_ACTIVITY_REFERENCE.distribution],
      label: "Ages 5–17",
    };
  }

  const overlaps = NATIONAL_ACTIVITY_BANDS.map((band) => ({
    band,
    weight: Math.max(
      0,
      Math.min(ageRange[1], band.maxAge) -
        Math.max(ageRange[0], band.minAge) +
        1,
    ),
  })).filter(({ weight }) => weight > 0);
  const totalWeight = overlaps.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return buildNationalReference(null);

  const distribution = Array.from({ length: 8 }, (_, index) =>
    overlaps.reduce(
      (sum, item) => sum + (item.band.distribution[index] ?? 0) * item.weight,
      0,
    ) / totalWeight,
  );
  const averageMinutes = Math.round(
    overlaps.reduce(
      (sum, item) => sum + item.band.averageMinutes * item.weight,
      0,
    ) / totalWeight,
  );
  return {
    averageMinutes,
    distribution,
    label: `Ages ${ageRange[0]}–${ageRange[1]}`,
  };
}

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

/** Builds current-week and all-time statistics from device-local completions. */
export function buildDashboardStats(
  records: CompletedMission[],
  now = new Date(),
): DashboardStats {
  const validRecords = records
    .map((record) => ({ record, completedAt: new Date(record.completedAt) }))
    .filter(
      ({ completedAt }) =>
        Number.isFinite(completedAt.getTime()) &&
        completedAt.getTime() <= now.getTime(),
    )
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
  const weekDates = currentWeekDates(now);
  const todayKey = localDateKey(now);
  const minutesByDate = new Map<string, number>(
    weekDates.map((date) => [localDateKey(date), 0]),
  );

  for (const { record, completedAt } of validRecords) {
    const key = localDateKey(completedAt);
    if (minutesByDate.has(key)) {
      minutesByDate.set(key, (minutesByDate.get(key) ?? 0) + record.durationMinutes);
    }
  }

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
  const referenceAgeRange =
    [...completedRecords]
      .reverse()
      .find((record) => record.childAgeRange)?.childAgeRange ?? null;
  const reference = buildNationalReference(referenceAgeRange);
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
    daysMeetingGoal,
    goalDayRate: Math.round((daysMeetingGoal / WEEK_DAY_COUNT) * 100),
    activityCount: completedRecords.length,
    averageMinutesPerDay,
    averageWalkingKmPerDay: observedDays
      ? Math.round((totalWalkingKm / observedDays) * 10) / 10
      : 0,
    varietyTagCounts: countVarietyTags(completedRecords),
    referenceAgeRange,
    referenceAgeLabel: reference.label,
    nationalAverageMinutes: reference.averageMinutes,
    percentileBand:
      completedRecords.length > 0
        ? calculatePercentileBand(averageMinutesPerDay, reference.distribution)
        : null,
  };
}
