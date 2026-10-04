import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlannedActivity } from "@/types/planner";
import { PlannerDateDetails } from "./planner-date-details";
import { PlannerSection } from "./planner-section";
import { WeekPlannerView } from "./week-planner-view";

const planned: PlannedActivity = {
  id: "plan-1",
  missionId: "mission-1",
  name: "Backyard bug safari",
  plannedDate: "2026-10-04",
  createdAt: "2026-10-04T01:00:00.000Z",
  durationMinutes: 30,
  missionType: "Home-Based",
  locationLabel: "At home",
};

const hookState = vi.hoisted(() => ({
  current: {
    activities: [] as PlannedActivity[],
    loading: false,
    error: "",
    refresh: vi.fn(),
    remove: vi.fn(),
  },
}));

const push = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-planned-activities", () => ({
  usePlannedActivities: () => hookState.current,
}));

vi.mock("@/hooks/use-dashboard-date", () => ({
  useDashboardDate: () => new Date(2026, 9, 4, 12),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  hookState.current = {
    activities: [],
    loading: false,
    error: "",
    refresh: vi.fn(),
    remove: vi.fn(),
  };
  push.mockReset();
});

describe("activity planner", () => {
  it("renders branding, calendar views, holidays, and empty details", () => {
    const markup = renderToStaticMarkup(createElement(PlannerSection));

    expect(markup).toContain("PlayGo &amp; Co");
    expect(markup).toContain("Activity planner");
    expect(markup).toContain("Month");
    expect(markup).toContain("Week");
    expect(markup).toContain('aria-label="Monthly activity planner"');
    expect(markup).toContain("Victorian school holidays");
    expect(markup).toContain("Nothing planned yet");
    expect(markup).toContain("Add activity");
  });

  it("shows planned activity details and a remove control", () => {
    hookState.current = { ...hookState.current, activities: [planned] };
    const markup = renderToStaticMarkup(createElement(PlannerSection));

    expect(markup).toContain("Backyard bug safari");
    expect(markup).toContain("30 min");
    expect(markup).toContain("At home");
    expect(markup).toContain("Remove");
    expect(markup).toContain("1 planned activity");
  });

  it("renders a Monday to Sunday weekly agenda", () => {
    const markup = renderToStaticMarkup(
      <WeekPlannerView
        activities={[planned]}
        selectedDate={new Date(2026, 9, 4, 12)}
        today={new Date(2026, 9, 4, 12)}
        onSelectDate={() => undefined}
      />,
    );

    expect(markup).toContain('aria-label="Weekly activity planner"');
    expect(markup).toContain("Mon");
    expect(markup).toContain("Sun");
    expect(markup).toContain("Backyard bug safari");
    expect(markup).toContain("Victorian school holidays");
  });

  it("disables Add activity outside the planning window", () => {
    const markup = renderToStaticMarkup(
      <PlannerDateDetails
        activities={[]}
        selectedDate={new Date(2026, 9, 3, 12)}
        today={new Date(2026, 9, 4, 12)}
        onAdd={() => undefined}
        onRemove={() => undefined}
      />,
    );

    expect(markup).toContain("disabled");
    expect(markup).toContain(
      "Activities can only be planned up to 365 days in advance.",
    );
  });

  it("renders loading and storage-error states", () => {
    hookState.current = { ...hookState.current, loading: true };
    expect(renderToStaticMarkup(<PlannerSection />)).toContain(
      'aria-label="Loading activity planner"',
    );

    hookState.current = {
      ...hookState.current,
      loading: false,
      error: "Planned activities could not be read.",
    };
    const errorMarkup = renderToStaticMarkup(<PlannerSection />);
    expect(errorMarkup).toContain('role="alert"');
    expect(errorMarkup).toContain("Planned activities could not be read.");
  });
});
