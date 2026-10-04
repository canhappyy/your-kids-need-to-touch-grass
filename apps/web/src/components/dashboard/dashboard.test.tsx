import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardStats } from "@/types/dashboard";
import { ActivityStatsCard } from "./activity-stats-card";
import { DashboardSection } from "./dashboard-section";

const hookState = vi.hoisted(() => ({
  current: {
    records: [],
    loading: false,
    error: "",
    refresh: vi.fn(),
    clear: vi.fn(),
  },
}));

const rewardHookState = vi.hoisted(() => ({
  current: {
    rewards: {
      currentStreak: 0,
      lastCompletedDate: null,
      unlockedBadgeIds: [],
    },
    loading: false,
    error: "",
    refresh: vi.fn(),
  },
}));

vi.mock("@/hooks/use-completed-missions", () => ({
  useCompletedMissions: () => hookState.current,
}));

vi.mock("@/hooks/use-rewards", () => ({
  useRewards: () => rewardHookState.current,
}));

const stats: DashboardStats = {
  days: [
    { date: new Date(2026, 8, 27, 12), dateKey: "2026-09-27", minutes: 20, metGoal: false },
    { date: new Date(2026, 8, 28, 12), dateKey: "2026-09-28", minutes: 35, metGoal: false },
    { date: new Date(2026, 8, 29, 12), dateKey: "2026-09-29", minutes: 60, metGoal: true },
    { date: new Date(2026, 8, 30, 12), dateKey: "2026-09-30", minutes: 75, metGoal: true },
    { date: new Date(2026, 9, 1, 12), dateKey: "2026-10-01", minutes: 0, metGoal: false },
    { date: new Date(2026, 9, 2, 12), dateKey: "2026-10-02", minutes: 40, metGoal: false },
    { date: new Date(2026, 9, 3, 12), dateKey: "2026-10-03", minutes: 45, metGoal: false },
  ],
  todayMinutes: 45,
  weeklyMinutes: 275,
  daysMeetingGoal: 2,
  goalDayRate: 29,
};

beforeEach(() => {
  hookState.current = {
    records: [],
    loading: false,
    error: "",
    refresh: vi.fn(),
    clear: vi.fn(),
  };
  rewardHookState.current = {
    rewards: {
      currentStreak: 0,
      lastCompletedDate: null,
      unlockedBadgeIds: [],
    },
    loading: false,
    error: "",
    refresh: vi.fn(),
  };
});

describe("parent dashboard", () => {
  it("renders playgo branding, heading, controls, and zero-value benchmark", () => {
    const markup = renderToStaticMarkup(createElement(DashboardSection));

    expect(markup).toContain("playgo &amp; co");
    expect(markup).toContain("Parent dashboard");
    expect(markup).toContain("Daily View");
    expect(markup).toContain("Weekly Trends");
    expect(markup).toContain("0 active minutes in the last 7 days");
    expect(markup).toContain("26% of Australian children");
    expect(markup).toContain("0 day streak");
    expect(markup).toContain("Wildlife rewards");
  });

  it("keeps the dashboard skeleton visible while rewards hydrate", () => {
    rewardHookState.current = { ...rewardHookState.current, loading: true };

    const markup = renderToStaticMarkup(createElement(DashboardSection));

    expect(markup).toContain('aria-label="Loading dashboard activity"');
    expect(markup).not.toContain("Daily View");
  });

  it("renders a loading skeleton while local history hydrates", () => {
    hookState.current = { ...hookState.current, loading: true };

    const markup = renderToStaticMarkup(createElement(DashboardSection));

    expect(markup).toContain('aria-label="Loading dashboard activity"');
    expect(markup).not.toContain("Daily View");
  });

  it("renders a reward-storage error instead of dashboard cards", () => {
    rewardHookState.current = {
      ...rewardHookState.current,
      error: "Rewards could not be read. Browser storage may be unavailable or damaged.",
    };

    const markup = renderToStaticMarkup(createElement(DashboardSection));

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Rewards could not be read");
    expect(markup).not.toContain("Daily View");
  });

  it("renders the local-storage error instead of activity cards", () => {
    hookState.current = {
      ...hookState.current,
      error: "History could not be read. Browser storage may be unavailable or damaged.",
    };

    const markup = renderToStaticMarkup(createElement(DashboardSection));

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("History could not be read");
    expect(markup).not.toContain("Daily View");
  });

  it("shows today progress and supportive guidance below target", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityStatsCard, { stats, view: "daily" }),
    );

    expect(markup).toContain("Today&#x27;s activity");
    expect(markup).toContain("45 active minutes today");
    expect(markup).toContain("45 of 60 minutes");
    expect(markup).toContain(
      "Every 15 minutes of physical activity counts towards today&#x27;s goal!",
    );
    expect(markup).toContain("275 active minutes in the last 7 days");
    expect(markup).toContain("2 of 7 days reached the goal (29%).");
  });

  it("shows positive goal-reached copy at 60 minutes", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityStatsCard, {
        stats: { ...stats, todayMinutes: 60 },
        view: "daily",
      }),
    );

    expect(markup).toContain("Today&#x27;s goal reached - great work!");
    expect(markup).not.toContain("Every 15 minutes");
  });

  it("renders an accessible weekly chart with target, labels, and values", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityStatsCard, { stats, view: "weekly" }),
    );

    expect(markup).toContain('aria-label="Weekly active minutes chart"');
    expect(markup).toContain('aria-describedby="weekly-activity-description"');
    expect(markup).toContain(
      "60-minute daily target. Sun: 20 minutes; Mon: 35 minutes; Tue: 60 minutes; Wed: 75 minutes; Thu: 0 minutes; Fri: 40 minutes; Sat: 45 minutes.",
    );
    expect(markup).toContain("60-minute target");
    expect(markup).toContain("Sun 20 minutes");
    expect(markup).toContain("Wed 75 minutes");
    expect(markup).toContain("Sat 45 minutes");
    expect(markup).toContain("Australian national benchmark");
  });
});
