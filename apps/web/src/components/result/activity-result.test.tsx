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
  varietyTags: [],
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
    maxUvIndex: 3,
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
  it("renders activity title and details without metadata badges", () => {
    const markup = render();

    expect(markup).toContain("Park Explorer");
    expect(markup).not.toContain("Ages 5-7, 8-9");
    expect(markup).not.toContain("Independent play");
    expect(markup).toContain("Clayton Reserve");
    expect(markup).toContain("20 mins activity");
    expect(markup).toContain("~12 mins round-trip walk");
  });

  it("renders weather, daily goal progress, and action controls", () => {
    const markup = render();

    expect(markup).toContain("Weather");
    expect(markup).toContain("Cloudy");
    expect(markup).toContain("Bring a rain jacket.");
    expect(markup).toContain("Weather data by Open-Meteo");
    expect(markup).not.toContain("Save this activity");
    expect(markup).not.toContain("Save to planner (do it later)");
    expect(markup).toContain('aria-label="Save activity"');
    expect(markup).toContain("How to Play");
    expect(markup).toContain("Get Directions");
    expect(markup).toContain("Give me another");
  });

  it("renders weather caution icon on the section label when weather is severe", () => {
    const severeRecommendation: Recommendation = {
      ...primary,
      weather: {
        status: "available",
        maxUvIndex: 0,
        severity: "severe",
        summary: "Thunderstorms expected. Bring an umbrella or rain jacket.",
        weatherCode: 95,
        startsAt: "2026-09-14T00:00:00.000Z",
        endsAt: "2026-09-14T01:12:00.000Z",
      },
    };
    const markup = render(severeRecommendation);

    expect(markup).toContain('aria-label="Weather caution"');
    expect(markup).not.toContain("<span>Weather caution</span>");
    expect(markup).toContain("Thunderstorms expected");
    expect(markup).toContain("Bring an umbrella or rain jacket.");
  });

  it("renders the extreme UV indoor activity notice", () => {
    const markup = render({
      ...primary,
      missionType: "Home-Based",
      venue: null,
      weather: { status: "unavailable" },
      weatherNotice: "Extreme UV: recommending an indoor activity.",
    });

    expect(markup).toContain("Extreme UV: recommending an indoor activity.");
    expect(markup).toContain('role="status"');
  });

  it("renders fallback when weather is unavailable", () => {
    const unavailableRecommendation: Recommendation = {
      ...primary,
      weather: {
        status: "unavailable",
      },
    };
    const markup = render(unavailableRecommendation);

    expect(markup).toContain("Weather");
    expect(markup).toContain("Not listed");
  });

  it("hides weather section when activity is home-based", () => {
    const homeRecommendation: Recommendation = {
      ...primary,
      missionType: "Home-Based",
      venue: null,
      commuteMinutes: 0,
      totalMinutes: 20,
      weather: {
        status: "unavailable",
      },
    };
    const markup = render(homeRecommendation);

    expect(markup).toContain("At home");
    expect(markup).toContain("20 mins");
    expect(markup).not.toContain("Weather");
    expect(markup).not.toContain("Not listed");
    expect(markup).not.toContain("Weather data by Open-Meteo");
  });

  it("does not render carousel or chained activity elements", () => {
    const markup = render();

    expect(markup).not.toContain('data-slot="carousel"');
    expect(markup).not.toContain("Activity 1");
    expect(markup).not.toContain("Activity 2");
    expect(markup).not.toContain("Discover Another Activity");
    expect(markup).not.toContain("activity-slide-add");
  });

  it("renders activity detail section inside a card component", () => {
    const markup = render();

    expect(markup).toContain('data-slot="card"');
    expect(markup).toContain('data-slot="card-content"');
  });
});
