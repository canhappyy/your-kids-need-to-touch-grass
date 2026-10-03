import { describe, expect, it } from "vitest";
import type { CompletedMission } from "@/types/completed-mission";
import { buildDashboardStats } from "./dashboard-stats";

function completedMission(
  id: string,
  completedAt: Date,
  durationMinutes: number,
): CompletedMission {
  return {
    id,
    missionId: `mission-${id}`,
    name: `Activity ${id}`,
    completedAt: completedAt.toISOString(),
    durationMinutes,
  };
}

describe("dashboard activity statistics", () => {
  it("returns seven zero-value local days ending today for empty history", () => {
    const stats = buildDashboardStats([], new Date(2026, 9, 3, 12));

    expect(stats.days.map((day) => day.dateKey)).toEqual([
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
    expect(stats.days.map((day) => day.minutes)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(stats).toMatchObject({
      todayMinutes: 0,
      weeklyMinutes: 0,
      daysMeetingGoal: 0,
      goalDayRate: 0,
    });
  });

  it("sums same-day sessions and ignores records outside the rolling window", () => {
    const stats = buildDashboardStats(
      [
        completedMission("today-one", new Date(2026, 9, 3, 8), 20),
        completedMission("today-two", new Date(2026, 9, 3, 18), 40),
        completedMission("first-day", new Date(2026, 8, 27, 10), 15),
        completedMission("too-old", new Date(2026, 8, 26, 23, 59), 90),
        completedMission("future", new Date(2026, 9, 4, 0, 1), 90),
      ],
      new Date(2026, 9, 3, 20),
    );

    expect(stats.days.map((day) => day.minutes)).toEqual([15, 0, 0, 0, 0, 0, 60]);
    expect(stats).toMatchObject({
      todayMinutes: 60,
      weeklyMinutes: 75,
      daysMeetingGoal: 1,
      goalDayRate: 14,
    });
  });

  it("counts exact and above-target days and rounds the seven-day rate", () => {
    const stats = buildDashboardStats(
      [
        completedMission("exact", new Date(2026, 9, 1, 12), 60),
        completedMission("above", new Date(2026, 9, 2, 12), 90),
      ],
      new Date(2026, 9, 3, 12),
    );

    expect(stats.days.at(-3)?.metGoal).toBe(true);
    expect(stats.days.at(-2)?.metGoal).toBe(true);
    expect(stats).toMatchObject({
      weeklyMinutes: 150,
      daysMeetingGoal: 2,
      goalDayRate: 29,
    });
  });

  it("groups sessions around midnight by local calendar date", () => {
    const stats = buildDashboardStats(
      [
        completedMission("previous", new Date(2026, 9, 2, 23, 55), 25),
        completedMission("today", new Date(2026, 9, 3, 0, 5), 35),
      ],
      new Date(2026, 9, 3, 12),
    );

    expect(stats.days.at(-2)?.minutes).toBe(25);
    expect(stats.days.at(-1)?.minutes).toBe(35);
    expect(stats.todayMinutes).toBe(35);
  });
});
