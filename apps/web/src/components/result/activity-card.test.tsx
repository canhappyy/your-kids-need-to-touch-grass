import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { Recommendation } from "@/types/recommendation";
import { ActivityCard } from "./activity-card";

const mockRecommendation: Recommendation = {
  missionId: "MIS-001",
  title: "Nature Scavenger Hunt",
  description: "Find natural treasures in the park.",
  equipmentNeeded: "Paper bag|Pencil",
  instructionText:
    "1. Grab your bag.\n2. Search for 3 different leaves.\n3. Celebrate your finds!",
  durationMinutes: 25,
  commuteMinutes: 10,
  totalMinutes: 35,
  missionType: "Location-Based",
  ageBands: ["5-7", "8-9"],
  supervisionLevel: "Independent-Play-Safe",
  varietyTags: ["Nature"],
  reasons: [],
  venue: {
    openSpaceId: 1,
    name: "Gardners Creek Reserve",
    category: "park",
    latitude: -37.85,
    longitude: 145.05,
    distanceKm: 0.6,
  },
  weather: {
    status: "available",
    maxUvIndex: 2,
    severity: "regular",
    summary: "Clear and sunny.",
    startsAt: "2026-10-08T00:00:00.000Z",
    endsAt: "2026-10-08T02:00:00.000Z",
  },
  iconFile: "nature-scavenger-hunt.svg",
};

describe("ActivityCard", () => {
  it("renders front face with activity details and flip badge", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityCard, {
        recommendation: mockRecommendation,
        formattedDuration: "25 mins",
        formattedTotalDuration: "35 mins",
        formattedCommuteDuration: "10 mins",
        locationLabel: "Gardners Creek Reserve",
        isHomeBased: false,
      }),
    );

    expect(markup).toContain("Gardners Creek Reserve");
    expect(markup).toContain("35 mins");
    expect(markup).toContain("25 mins activity");
    expect(markup).toContain("Clear and sunny");
    expect(markup).toContain("How to Play");

    expect(markup).toContain("perspective-1000");
    expect(markup).toContain("transform-style-3d");
  });

  it("renders back face with game instructions, equipment badges, and details badge", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityCard, {
        recommendation: mockRecommendation,
        formattedDuration: "25 mins",
        formattedTotalDuration: "35 mins",
        formattedCommuteDuration: "10 mins",
        locationLabel: "Gardners Creek Reserve",
        isHomeBased: false,
      }),
    );

    expect(markup).toContain("How to Play");
    expect(markup).toContain("Nature Scavenger Hunt");
    expect(markup).toContain("Equipment Needed");
    expect(markup).toContain("Paper bag");
    expect(markup).toContain("Pencil");
    expect(markup).toContain("Grab your bag.");
    expect(markup).toContain("Search for 3 different leaves.");
    expect(markup).toContain("Celebrate your finds!");
    expect(markup).toContain("Details");
  });

  it("handles activities with no equipment needed", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityCard, {
        recommendation: {
          ...mockRecommendation,
          equipmentNeeded: null,
        },
        formattedDuration: "15 mins",
        formattedTotalDuration: "15 mins",
        formattedCommuteDuration: null,
        locationLabel: "At home",
        isHomeBased: true,
      }),
    );

    expect(markup).toContain("No equipment needed");
  });

  it("preserves identical card sizing structure for both front and back faces", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityCard, {
        recommendation: mockRecommendation,
        formattedDuration: "25 mins",
        formattedTotalDuration: "35 mins",
        formattedCommuteDuration: "10 mins",
        locationLabel: "Gardners Creek Reserve",
        isHomeBased: false,
      }),
    );

    // Front face establishes min-height, back face uses absolute inset-0 h-full w-full
    expect(markup).toContain("min-h-[380px]");
    expect(markup).toContain(
      "absolute inset-0 h-full w-full backface-hidden rotate-y-180",
    );
  });

  it("renders Instagram-style bookmark save icon at the top right corner", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityCard, {
        recommendation: mockRecommendation,
        formattedDuration: "25 mins",
        formattedTotalDuration: "35 mins",
        formattedCommuteDuration: "10 mins",
        locationLabel: "Gardners Creek Reserve",
        isHomeBased: false,
      }),
    );

    expect(markup).toContain('aria-label="Save activity"');
    expect(markup).toContain("lucide-bookmark");
  });

  it("renders daily active play progress bar inside the card", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityCard, {
        recommendation: mockRecommendation,
        formattedDuration: "25 mins",
        formattedTotalDuration: "35 mins",
        formattedCommuteDuration: "10 mins",
        locationLabel: "Gardners Creek Reserve",
        isHomeBased: false,
        dailyGoalPercentage: 42,
        goalAriaText: "42% of daily outdoor play goal",
        progressValue: 42,
      }),
    );

    expect(markup).toContain("42% of the 60-minute daily goal");
    expect(markup).toContain('aria-valuetext="42% of daily outdoor play goal"');
    expect(markup).toContain('data-slot="progress"');
  });

  it("calculates fallback progress bar values when props are omitted", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityCard, {
        recommendation: mockRecommendation,
        formattedDuration: "25 mins",
        formattedTotalDuration: "35 mins",
        formattedCommuteDuration: "10 mins",
        locationLabel: "Gardners Creek Reserve",
        isHomeBased: false,
      }),
    );

    // 25 mins out of 60 mins is 42%
    expect(markup).toContain("42% of the 60-minute daily goal");
    expect(markup).toContain('data-slot="progress"');
  });

  it("renders flip icon on How to Play and Details badges instead of reload icon", () => {
    const markup = renderToStaticMarkup(
      createElement(ActivityCard, {
        recommendation: mockRecommendation,
        formattedDuration: "25 mins",
        formattedTotalDuration: "35 mins",
        formattedCommuteDuration: "10 mins",
        locationLabel: "Gardners Creek Reserve",
        isHomeBased: false,
      }),
    );

    expect(markup).not.toContain("lucide-rotate-cw");
    expect(markup).toContain("lucide-square-centerline-dashed-horizontal");
  });
});
