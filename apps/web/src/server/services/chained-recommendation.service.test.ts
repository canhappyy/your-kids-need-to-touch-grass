import { describe, expect, it, vi } from "vitest";

import {
  getChainedRecommendation,
  type ChainedRecommendationDependencies,
} from "./recommendation.service";

const candidate = {
  recommendation: {
    missionId: "MIS-002",
    title: "Nature Hunt",
    description: null,
    equipmentNeeded: null,
    instructionText: "Find three leaves.",
    durationMinutes: 40,
    commuteMinutes: 0,
    totalMinutes: 40,
    missionType: "Location-Based" as const,
    ageBands: ["5-7" as const, "8-9" as const],
    supervisionLevel: "Independent-Play-Safe" as const,
    venue: {
      openSpaceId: 42,
      name: "Clayton Reserve",
      category: "park",
      latitude: -37.92,
      longitude: 145.12,
      distanceKm: 0.5,
    },
  },
  outingTotalMinutes: 72,
};

const input = {
  playStyle: "solo" as const,
  canSupervise: false,
  location: "Clayton 3168",
  ageMin: 6,
  ageMax: 9,
  primaryMissionId: "MIS-001",
  openSpaceId: 42,
};

function dependencies(): ChainedRecommendationDependencies {
  return {
    resolveLocation: vi.fn().mockResolvedValue({
      latitude: -37.925,
      longitude: 145.119,
      label: "Clayton, Notting Hill 3168",
    }),
    findChained: vi.fn().mockResolvedValue(candidate),
  };
}

describe("getChainedRecommendation", () => {
  it("uses the resolved origin and adds chain-specific reasons", async () => {
    const deps = dependencies();
    const result = await getChainedRecommendation(input, deps);

    expect(deps.findChained).toHaveBeenCalledWith({
      playStyle: "solo",
      canSupervise: false,
      latitude: -37.925,
      longitude: 145.119,
      ageMin: 6,
      ageMax: 9,
      primaryMissionId: "MIS-001",
      openSpaceId: 42,
      missionId: undefined,
    });
    expect(result).toEqual({
      outingTotalMinutes: 72,
      recommendation: {
        ...candidate.recommendation,
        reasons: [
          { kind: "age", label: "Ages 6-9" },
          { kind: "time", label: "Reaches the 60-minute goal" },
          { kind: "location", label: "Also at Clayton Reserve" },
        ],
      },
    });
  });

  it("uses GPS coordinates and forwards a replay mission", async () => {
    const deps = dependencies();
    await getChainedRecommendation(
      {
        ...input,
        latitude: -37.91,
        longitude: 145.13,
        missionId: "MIS-002",
      },
      deps,
    );

    expect(deps.findChained).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: -37.91,
        longitude: 145.13,
        missionId: "MIS-002",
      }),
    );
  });

  it("returns null when no compatible mission exists", async () => {
    const deps = dependencies();
    vi.mocked(deps.findChained).mockResolvedValueOnce(null);

    await expect(getChainedRecommendation(input, deps)).resolves.toBeNull();
  });
});
