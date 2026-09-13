import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Recommendation } from "@/types/recommendation";
import { useActivityResult } from "./use-activity-result";

const recommendation: Recommendation = {
  missionId: "walk-test",
  title: "Play at park",
  description: null,
  equipmentNeeded: null,
  instructionText: null,
  durationMinutes: 20,
  commuteMinutes: 22,
  totalMinutes: 42,
  missionType: "Location-Based",
  ageBands: ["5-7"],
  supervisionLevel: "Independent-Play-Safe",
  reasons: [],
  venue: {
    openSpaceId: 1,
    name: "Park",
    category: "park",
    latitude: 0.00462,
    longitude: 0,
    distanceKm: 0.51,
  },
};

describe("activity timing presentation", () => {
  it.each([true, false])("keeps activity progress separate from travel: nearby %s", (nearby) => {
    const data: Recommendation = nearby ? recommendation : {
      ...recommendation,
      missionType: "Home-Based",
      venue: null,
      commuteMinutes: 0,
      totalMinutes: 20,
    };
    function Probe() {
      const result = useActivityResult(data);
      expect(result).toMatchObject({
        formattedDuration: "20 minutes",
        formattedTotalDuration: nearby ? "42 minutes" : "20 minutes",
        formattedCommuteDuration: nearby ? "22 minutes" : null,
        dailyGoalPercentage: 33,
        progressValue: 33,
      });
      return null;
    }
    renderToStaticMarkup(createElement(Probe));
  });
});
