import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ChainState } from "@/types/result";
import type { Recommendation } from "@/types/recommendation";
import { ActivityResult } from "./activity-result";

const primary: Recommendation = {
  missionId: "MIS-001",
  title: "Park Explorer",
  description: null,
  equipmentNeeded: null,
  instructionText: "Explore the park.",
  durationMinutes: 20,
  commuteMinutes: 12,
  totalMinutes: 32,
  missionType: "Location-Based",
  ageBands: ["5-7", "8-9"],
  supervisionLevel: "Independent-Play-Safe",
  reasons: [],
  venue: {
    openSpaceId: 42,
    name: "Clayton Reserve",
    category: "park",
    latitude: -37.92,
    longitude: 145.12,
    distanceKm: 0.5,
  },
  weather: { status: "unavailable" },
};

const secondary: Recommendation = {
  ...primary,
  missionId: "MIS-002",
  title: "Nature Hunt",
  durationMinutes: 40,
  commuteMinutes: 0,
  totalMinutes: 40,
  reasons: [],
  weather: {
    status: "available",
    severity: "regular",
    summary: "Cloudy. Bring a rain jacket.",
    startsAt: "2026-09-14T00:00:00.000Z",
    endsAt: "2026-09-14T01:12:00.000Z",
  },
};

function render(chainState: ChainState, recommendation = primary) {
  return renderToStaticMarkup(
    createElement(ActivityResult, {
      recommendation,
      chainState,
      isBusy: false,
      isRetrying: false,
      onAddActivity: () => undefined,
      onTryAnother: () => undefined,
    }),
  );
}

describe("ActivityResult chained outing", () => {
  it("offers another activity for a short venue mission", () => {
    expect(render({ status: "idle" })).toContain(
      "Add another activity here",
    );
  });

  it("stacks the second mission and uses combined activity progress and weather", () => {
    const markup = render({ status: "loaded", recommendation: secondary });

    expect(markup).toContain("Activity 1");
    expect(markup).toContain("Activity 2")
    expect(markup).toContain("Nature Hunt")
    expect(markup).toContain("100% of the 60-minute daily goal")
    expect(markup).toContain("1 hour activities")
    expect(markup).toContain("Cloudy. Bring a rain jacket.")
    expect(markup.match(/Mark completed/g)).toHaveLength(2)
    expect(markup.match(/How to Play/g)?.length).toBeGreaterThanOrEqual(2)
  });

  it("shows the exact unavailable message", () => {
    expect(render({ status: "unavailable" })).toContain(
      "No additional activity is available at this location.",
    );
  });

  it("does not offer chaining for a home mission", () => {
    const home = {
      ...primary,
      missionType: "Home-Based" as const,
      venue: null,
      commuteMinutes: 0,
      totalMinutes: 20,
    };
    expect(render({ status: "idle" }, home)).not.toContain(
      "Add another activity here",
    );
  });

  it("renders a carousel with navigation tabs and slide controls for chained activities", () => {
    const markup = render({ status: "loaded", recommendation: secondary });

    expect(markup).toContain('data-slot="carousel"');
    expect(markup).toContain('id="activity-slide-1"');
    expect(markup).toContain('id="activity-slide-2"');
    expect(markup).toContain('aria-label="Activity selection"');
    expect(markup).toContain('aria-label="Previous activity"');
    expect(markup).toContain('aria-label="Next activity"');
  });

  it("renders a single-slide carousel without slide navigation tabs when single", () => {
    const markup = render({ status: "idle" });

    expect(markup).toContain('data-slot="carousel"');
    expect(markup).toContain('id="activity-slide-1"');
    expect(markup).not.toContain('id="activity-slide-2"');
    expect(markup).not.toContain('aria-label="Activity selection"');
    expect(markup).not.toContain('aria-label="Previous activity"');
    expect(markup).not.toContain('aria-label="Next activity"');
  });
});
