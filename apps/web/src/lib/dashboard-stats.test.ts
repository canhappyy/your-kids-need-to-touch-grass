import { describe, expect, it } from "vitest";

import type { CompletedMission } from "@/types/completed-mission";
import {
  buildDashboardStats,
  calculatePercentileBand,
} from "./dashboard-stats";

function completedMission(
  id: string,
  completedAt: Date,
  durationMinutes: number,
  extras: Partial<CompletedMission> = {},
): CompletedMission {
  return {
    id,
    missionId: `mission-${id}`,
    name: `Activity ${id}`,
    completedAt: completedAt.toISOString(),
    durationMinutes,
    ...extras,
  };
}

describe("dashboard activity statistics", () => {
  it("returns the current Monday-to-Sunday week with honest empty values", () => {
    const stats = buildDashboardStats([], new Date(2026, 9, 7, 12));

    expect(stats.days.map((day) => day.dateKey)).toEqual([
      "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08",
      "2026-10-09", "2026-10-10", "2026-10-11",
    ]);
    expect(stats.days.map((day) => day.minutes)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(stats.days.map((day) => day.isFuture)).toEqual([
      false, false, false, true, true, true, true,
    ]);
    expect(stats).toMatchObject({
      todayMinutes: 0,
      todayGoalPercentage: 0,
      weeklyMinutes: 0,
      activityCount: 0,
      averageMinutesPerDay: 0,
      averageWalkingKmPerDay: 0,
      percentileBand: null,
    });
  });

  it("sums the current week and caps today's goal percentage at 100", () => {
    const stats = buildDashboardStats(
      [
        completedMission("monday", new Date(2026, 9, 5, 9), 30),
        completedMission("today-one", new Date(2026, 9, 7, 8), 45),
        completedMission("today-two", new Date(2026, 9, 7, 10), 30),
        completedMission("previous-week", new Date(2026, 9, 4, 10), 90),
        completedMission("future", new Date(2026, 9, 8, 10), 90),
      ],
      new Date(2026, 9, 7, 12),
    );

    expect(stats.days.map((day) => day.minutes)).toEqual([30, 0, 75, 0, 0, 0, 0]);
    expect(stats.todayMinutes).toBe(75);
    expect(stats.todayGoalPercentage).toBe(100);
    expect(stats.weeklyMinutes).toBe(105);
  });

  it("calculates all-time averages from first through latest completion", () => {
    const stats = buildDashboardStats(
      [
        completedMission("first", new Date(2026, 8, 29, 9), 30, {
          walkingDistanceKm: 2.4,
          varietyTags: ["Exploration", "Creativity"],
        }),
        completedMission("second", new Date(2026, 9, 1, 9), 90, {
          walkingDistanceKm: 1.6,
          varietyTags: ["Exploration"],
          childAgeRange: [5, 7],
        }),
      ],
      new Date(2026, 9, 5, 12),
    );

    expect(stats.activityCount).toBe(2);
    expect(stats.averageMinutesPerDay).toBe(40);
    expect(stats.averageWalkingKmPerDay).toBe(1.3);
    expect(stats.varietyTagCounts).toEqual([
      { name: "Exploration", count: 2 },
      { name: "Creativity", count: 1 },
    ]);
    expect(stats.referenceAgeLabel).toBe("Ages 5–7");
    expect(stats.nationalAverageMinutes).toBe(105);
  });

  it("keeps all-time metrics stable when a new week begins without a completion", () => {
    const records = [
      completedMission("first", new Date(2026, 9, 3, 9), 60),
      completedMission("latest", new Date(2026, 9, 4, 9), 30),
    ];

    const sunday = buildDashboardStats(records, new Date(2026, 9, 4, 12));
    const monday = buildDashboardStats(records, new Date(2026, 9, 5, 12));

    expect(monday.weeklyMinutes).toBe(0);
    expect(monday.activityCount).toBe(sunday.activityCount);
    expect(monday.averageMinutesPerDay).toBe(sunday.averageMinutesPerDay);
  });

  it("weights national averages across overlapping ABS age bands", () => {
    const stats = buildDashboardStats(
      [completedMission("age", new Date(2026, 9, 5, 9), 60, { childAgeRange: [8, 9] })],
      new Date(2026, 9, 5, 12),
    );

    expect(stats.referenceAgeLabel).toBe("Ages 8–9");
    expect(stats.nationalAverageMinutes).toBe(100);
    expect(stats.percentileBand).toMatch(/^\d+(st|nd|rd|th)–\d+(st|nd|rd|th) percentile$/);
  });

  it("uses the overall reference for legacy records and ignores future records", () => {
    const stats = buildDashboardStats(
      [
        completedMission("legacy", new Date(2026, 9, 5, 9), 85),
        completedMission("future", new Date(2026, 9, 6, 9), 120, { childAgeRange: [5, 7] }),
      ],
      new Date(2026, 9, 5, 12),
    );

    expect(stats.activityCount).toBe(1);
    expect(stats.referenceAgeLabel).toBe("Ages 5–17");
    expect(stats.nationalAverageMinutes).toBe(85);
  });

  it("normalizes distribution bins into a neutral percentile range", () => {
    expect(calculatePercentileBand(45, [10, 20, 30, 20, 10, 5, 3, 2])).toBe(
      "30th–60th percentile",
    );
    expect(calculatePercentileBand(0, [10, 20, 30, 20, 10, 5, 3, 2])).toBe(
      "0th–10th percentile",
    );
  });

  it("groups records by local calendar date across midnight and DST", () => {
    const stats = buildDashboardStats(
      [
        completedMission("before", new Date(2026, 9, 3, 23, 55), 25),
        completedMission("after", new Date(2026, 9, 4, 0, 5), 35),
      ],
      new Date(2026, 9, 4, 12),
    );

    expect(stats.days.at(-2)?.minutes).toBe(25);
    expect(stats.days.at(-1)?.minutes).toBe(35);
  });
});
