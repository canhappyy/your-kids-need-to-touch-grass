import { describe, expect, it, vi } from "vitest";

import {
  getRecommendation,
  type RecommendationDependencies,
  type RecommendationInput,
} from "@/server/services/recommendation.service";

const input: RecommendationInput = {
  locationMode: "nearby",
  location: "Clayton 3168",
  ageMin: 6,
  ageMax: 10,
  durationMinutes: 120,
};

const resolvedLocation = {
  postcode: "3168",
  latitude: -37.925,
  longitude: 145.119,
  suburbs: "Clayton, Notting Hill",
  label: "Clayton, Notting Hill 3168",
};

const venueMission = {
  missionId: "MIS-001",
  title: "Basketball",
  description: null,
  equipmentNeeded: "Basketball",
  instructionText: "Find a hoop.",
  durationMinutes: 60,
  missionType: "Location-Based" as const,
  venue: {
    openSpaceId: 42,
    name: "Clayton Reserve",
    category: "active_sport",
    latitude: -37.92,
    longitude: 145.12,
    distanceKm: 0.57,
  },
};

const fallbackMission = {
  ...venueMission,
  missionId: "MIS-101",
  title: "Living Room Obstacle Course",
  missionType: "Home-Based" as const,
  venue: null,
};

function dependencies(
  venue: typeof venueMission | null = venueMission,
  fallback: typeof fallbackMission | null = null,
): RecommendationDependencies {
  return {
    resolveLocation: vi.fn().mockResolvedValue(resolvedLocation),
    repository: {
      findLocationBased: vi.fn().mockResolvedValue(venue),
      findFallback: vi.fn().mockResolvedValue(fallback),
    },
  };
}

describe("getRecommendation", () => {
  it("returns one venue mission with query inputs and selection reasons", async () => {
    const deps = dependencies();
    const result = await getRecommendation(input, deps);

    expect(result).toEqual({
      ...venueMission,
      reasons: [
        { kind: "age", label: "Ages 6-10" },
        { kind: "time", label: "Fits within 2 hours" },
        { kind: "location", label: "Near Clayton, Notting Hill 3168" },
      ],
    });
    expect(deps.repository.findLocationBased).toHaveBeenCalledWith({
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 120,
      excludeMissionIds: undefined,
    });
    expect(deps.repository.findFallback).not.toHaveBeenCalled();
  });

  it("returns fallback without a location reason", async () => {
    const result = await getRecommendation(
      { ...input, durationMinutes: 45 },
      dependencies(null, fallbackMission),
    );

    expect(result).toMatchObject({
      missionId: fallbackMission.missionId,
      venue: null,
      reasons: [
        { kind: "age", label: "Ages 6-10" },
        { kind: "time", label: "Fits within 45 minutes" },
      ],
    });
  });

  it("selects only Home-Based missions without resolving a location", async () => {
    const deps = dependencies(null, fallbackMission);
    const result = await getRecommendation(
      {
        locationMode: "home",
        ageMin: 6,
        ageMax: 10,
        durationMinutes: 45,
      } as RecommendationInput,
      deps,
    );

    expect(result).toMatchObject({
      missionId: fallbackMission.missionId,
      missionType: "Home-Based",
      reasons: [
        { kind: "age", label: "Ages 6-10" },
        { kind: "time", label: "Fits within 45 minutes" },
      ],
    });
    expect(deps.resolveLocation).not.toHaveBeenCalled();
    expect(deps.repository.findLocationBased).not.toHaveBeenCalled();
    expect(deps.repository.findFallback).toHaveBeenCalledWith({
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 45,
      excludeMissionIds: undefined,
      missionId: undefined,
      missionTypes: ["Home-Based"],
      equipmentRequiredTag: "None",
    });
  });

  it("passes an exact mission through each matching query", async () => {
    const deps = dependencies(null, fallbackMission);
    const result = await getRecommendation(
      { ...input, missionId: fallbackMission.missionId },
      deps,
    );

    expect(result?.missionId).toBe(fallbackMission.missionId);
    expect(deps.repository.findLocationBased).toHaveBeenCalledWith(
      expect.objectContaining({ missionId: fallbackMission.missionId }),
    );
    expect(deps.repository.findFallback).toHaveBeenCalledWith(
      expect.objectContaining({ missionId: fallbackMission.missionId }),
    );
  });

  it("returns null when neither tier matches", async () => {
    await expect(
      getRecommendation(input, dependencies(null, null)),
    ).resolves.toBeNull();
  });

  it("prefers unseen missions and repeats after every mission was shown", async () => {
    const deps = dependencies(venueMission, fallbackMission);
    const retryInput = {
      ...input,
      excludeMissionIds: [venueMission.missionId],
    };
    const result = await getRecommendation(retryInput, deps);

    expect(result?.missionId).toBe(fallbackMission.missionId);
    expect(deps.repository.findFallback).toHaveBeenCalledWith({
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 120,
      excludeMissionIds: [venueMission.missionId],
      missionTypes: ["Home-Based", "Location-Agnostic"],
    });

    const exhausted = await getRecommendation(
      {
        ...input,
        excludeMissionIds: [venueMission.missionId, fallbackMission.missionId],
      },
      dependencies(venueMission, fallbackMission),
    );

    expect(exhausted).not.toBeNull();
  });
});
