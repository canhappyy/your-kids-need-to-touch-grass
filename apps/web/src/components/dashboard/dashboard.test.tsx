import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompletedMission } from "@/types/completed-mission";
import { DashboardSection } from "./dashboard-section";

const records: CompletedMission[] = [
  {
    id: "monday",
    missionId: "MIS-001",
    name: "Park play",
    completedAt: "2026-10-05T10:00:00+11:00",
    durationMinutes: 30,
    walkingDistanceKm: 3,
    varietyTags: ["Exploration"],
    childAgeRange: [5, 7],
  },
  {
    id: "tuesday",
    missionId: "MIS-002",
    name: "Ball game",
    completedAt: "2026-10-06T10:00:00+11:00",
    durationMinutes: 60,
    varietyTags: ["Movement", "Exploration"],
    childAgeRange: [5, 7],
  },
  {
    id: "wednesday",
    missionId: "MIS-003",
    name: "Nature walk",
    completedAt: "2026-10-07T10:00:00+11:00",
    durationMinutes: 45,
    childAgeRange: [5, 7],
  },
];

const hookState = vi.hoisted(() => ({
  current: {
    records: [] as CompletedMission[],
    loading: false,
    error: "",
    refresh: vi.fn(),
    clear: vi.fn(),
  },
}));

const rewardHookState = vi.hoisted(() => ({
  current: {
    rewards: {
      currentStreak: 3,
      lastCompletedDate: "2026-10-07",
      unlockedBadgeIds: ["koala"],
    },
    loading: false,
    error: "",
    refresh: vi.fn(),
  },
}));

vi.mock("@/hooks/use-completed-missions", () => ({
  useCompletedMissions: () => hookState.current,
}));

vi.mock("@/hooks/use-dashboard-date", () => ({
  useDashboardDate: () => new Date(2026, 9, 7, 12),
}));

vi.mock("@/hooks/use-rewards", () => ({
  useRewards: () => rewardHookState.current,
}));

beforeEach(() => {
  hookState.current = {
    records: [...records],
    loading: false,
    error: "",
    refresh: vi.fn(),
    clear: vi.fn(),
  };
  rewardHookState.current = {
    rewards: {
      currentStreak: 3,
      lastCompletedDate: "2026-10-07",
      unlockedBadgeIds: ["koala"],
    },
    loading: false,
    error: "",
    refresh: vi.fn(),
  };
});

describe("compact parent dashboard", () => {
  it("renders branding, daily progress, week chart, and four metrics", () => {
    const markup = renderToStaticMarkup(createElement(DashboardSection));

    expect(markup).toContain("playgo &amp; co");
    expect(markup).toContain("Parent dashboard");
    expect(markup).toContain("Daily activity goal");
    expect(markup).toContain("45 min");
    expect(markup).toContain("75%");
    expect(markup).toContain("3 day streak");
    expect(markup).toContain('aria-label="Weekly active minutes chart"');
    expect(markup).toContain("Dashed line = 60 min");
    for (const label of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      expect(markup).toContain(label);
    }
    expect(markup).toContain("Activity time");
    expect(markup).toContain("Walking");
    expect(markup).toContain("Activities logged");
    expect(markup).toContain("Nationwide ranking");
    expect(markup.match(/avg per day/g)).toHaveLength(2);
    expect(markup).not.toContain("Daily View");
    expect(markup).not.toContain("Weekly Trends");
    expect(markup).not.toContain("26% of Australian children");
  });

  it("links supportive below-target copy to the logging flow", () => {
    const markup = renderToStaticMarkup(createElement(DashboardSection));

    expect(markup).toContain("Almost there!");
    expect(markup).toContain("Log another activity");
    expect(markup).toContain("to reach today&#x27;s goal.");
    expect(markup).toContain('href="/?history=open"');
  });

  it("caps goal progress and replaces the prompt when the goal is reached", () => {
    hookState.current.records = [
      ...records,
      {
        id: "extra",
        missionId: "MIS-004",
        name: "Extra play",
        completedAt: "2026-10-07T11:00:00+11:00",
        durationMinutes: 45,
      },
    ];

    const markup = renderToStaticMarkup(createElement(DashboardSection));

    expect(markup).toContain("100%");
    expect(markup).toContain("Today&#x27;s goal reached—great work!");
    expect(markup).not.toContain("Almost there!");
  });

  it("shows honest empty metrics and seven empty chart days", () => {
    hookState.current.records = [];

    const markup = renderToStaticMarkup(createElement(DashboardSection));

    expect(markup).toContain("0 min");
    expect(markup).toContain("0.0 km");
    expect(markup).toContain("—");
    expect(markup).not.toContain("NaN");
    expect(markup).not.toContain('data-chart-bar="true"');
  });

  it("renders loading and storage-error states", () => {
    hookState.current.loading = true;
    expect(renderToStaticMarkup(createElement(DashboardSection))).toContain(
      'aria-label="Loading dashboard activity"',
    );

    hookState.current.loading = false;
    hookState.current.error =
      "History could not be read. Browser storage may be unavailable or damaged.";
    const errorMarkup = renderToStaticMarkup(createElement(DashboardSection));
    expect(errorMarkup).toContain('role="alert"');
    expect(errorMarkup).toContain("History could not be read");
  });
});
