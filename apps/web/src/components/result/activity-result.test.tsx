import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

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
  reasons: [
    { kind: "age", label: "Ages 5-9" },
    { kind: "time", label: "Fits your 30m window" },
  ],
  venue: {
    openSpaceId: 42,
    name: "Clayton Reserve",
    category: "park",
    latitude: -37.92,
    longitude: 145.12,
    distanceKm: 0.5,
  },
  weather: {
    status: "available",
    severity: "regular",
    summary: "Cloudy. Bring a rain jacket.",
    startsAt: "2026-09-14T00:00:00.000Z",
    endsAt: "2026-09-14T01:12:00.000Z",
  },
};

function render(recommendation = primary) {
  return renderToStaticMarkup(
    createElement(ActivityResult, {
      recommendation,
      isRetrying: false,
      onTryAnother: () => undefined,
    }),
  );
}

describe("ActivityResult", () => {
  it("renders activity title, match reasons, and details", () => {
    const markup = render();

    expect(markup).toContain("Park Explorer");
    expect(markup).toContain("Ages 5-9");
    expect(markup).toContain("Fits your 30m window");
    expect(markup).toContain("Clayton Reserve");
    expect(markup).toContain("20 mins activity");
    expect(markup).toContain("~12 mins round-trip walk");
  });

  it("renders weather, daily goal progress, and action controls", () => {
    const markup = render();

    expect(markup).toContain("Weather for your outing");
    expect(markup).toContain("Cloudy");
    expect(markup).toContain("Bring a rain jacket.");
    expect(markup).toContain("Mark completed");
    expect(markup).toContain("How to Play");
    expect(markup).toContain("Get Directions");
    expect(markup).toContain("Give me another");
  });

  it("does not render carousel or chained activity elements", () => {
    const markup = render();

    expect(markup).not.toContain('data-slot="carousel"');
    expect(markup).not.toContain("Activity 1");
    expect(markup).not.toContain("Activity 2");
    expect(markup).not.toContain("Discover Another Activity");
    expect(markup).not.toContain("activity-slide-add");
  });
});
