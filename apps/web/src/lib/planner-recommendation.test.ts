import { describe, expect, it } from "vitest";

import type { Recommendation } from "@/types/recommendation";
import { plannedActivityFromRecommendation } from "./planner-recommendation";

const recommendation: Recommendation = {
  missionId: "mission-1",
  title: "Park Explorer",
  description: null,
  equipmentNeeded: "Hat",
  instructionText: "Look for leaves.",
  durationMinutes: 30,
  commuteMinutes: 10,
  totalMinutes: 40,
  missionType: "Location-Based",
  ageBands: ["5-7"],
  supervisionLevel: "Needs Supervision",
  varietyTags: [],
  reasons: [],
  venue: {
    openSpaceId: 1,
    name: "Central Park",
    category: "Park",
    latitude: -37.8,
    longitude: 145,
    distanceKm: 1,
  },
};

describe("planner recommendation mapping", () => {
  it("creates a date-only planner record with venue details", () => {
    expect(
      plannedActivityFromRecommendation(
        recommendation,
        "2026-11-03",
        "plan-1",
        new Date("2026-10-04T01:00:00.000Z"),
      ),
    ).toEqual({
      id: "plan-1",
      missionId: "mission-1",
      name: "Park Explorer",
      plannedDate: "2026-11-03",
      createdAt: "2026-10-04T01:00:00.000Z",
      durationMinutes: 30,
      missionType: "Location-Based",
      locationLabel: "Central Park",
      instructionText: "Look for leaves.",
      equipmentNeeded: "Hat",
    });
  });

  it("derives home and anywhere labels without venues", () => {
    expect(
      plannedActivityFromRecommendation(
        { ...recommendation, venue: null, missionType: "Home-Based" },
        "2026-11-03",
        "home",
      ).locationLabel,
    ).toBe("At home");
    expect(
      plannedActivityFromRecommendation(
        { ...recommendation, venue: null, missionType: "Location-Agnostic" },
        "2026-11-03",
        "anywhere",
      ).locationLabel,
    ).toBe("Anywhere");
  });

  it("preserves iconFile when provided on the recommendation", () => {
    expect(
      plannedActivityFromRecommendation(
        { ...recommendation, iconFile: "nature-icon.svg" },
        "2026-11-03",
        "icon-test",
      ).iconFile,
    ).toBe("nature-icon.svg");
  });
});
