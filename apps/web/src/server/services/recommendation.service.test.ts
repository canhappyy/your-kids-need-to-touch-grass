import { describe, expect, it, vi } from "vitest";

import {
  getRecommendation,
  type RecommendationDependencies,
} from "@/server/services/recommendation.service";

const resolvedLocation = {
  postcode: "3168",
  latitude: -37.925,
  longitude: 145.119,
  suburbs: "Clayton, Notting Hill",
  label: "Clayton, Notting Hill 3168",
};

const locationCandidate = {
  missionId: "MIS-001",
  title: "Basketball",
  description: "Shoot hoops.",
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

function dependencies(
  candidate = locationCandidate,
): RecommendationDependencies {
  return {
    resolveLocation: vi.fn().mockResolvedValue(resolvedLocation),
    repository: {
      findLocationBased: vi.fn().mockResolvedValue(candidate),
    },
  };
}

describe("getRecommendation location-based selection", () => {
  it("returns exactly one venue mission with input-derived reasons", async () => {
    const deps = dependencies();

    const recommendation = await getRecommendation(
      {
        location: "Clayton 3168",
        ageMin: 6,
        ageMax: 10,
        durationMinutes: 120,
      },
      deps,
    );

    expect(recommendation).toEqual({
      ...locationCandidate,
      reasons: [
        { kind: "age", label: "Ages 6–10" },
        { kind: "time", label: "Fits within 2 hours" },
        { kind: "location", label: "Near Clayton, Notting Hill 3168" },
      ],
    });
  });

  it("passes the full age range, duration, coordinates, and exclusion", async () => {
    const deps = dependencies();

    await getRecommendation(
      {
        location: "3168",
        ageMin: 8,
        ageMax: 9,
        durationMinutes: 45,
        excludeMissionId: "MIS-001",
      },
      deps,
    );

    expect(deps.repository.findLocationBased).toHaveBeenCalledWith({
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
      ageMin: 8,
      ageMax: 9,
      durationMinutes: 45,
      excludeMissionId: "MIS-001",
    });
  });

  it("returns null when no location mission matches", async () => {
    const deps = dependencies(null as never);

    await expect(
      getRecommendation(
        {
          location: "3168",
          ageMin: 6,
          ageMax: 10,
          durationMinutes: 120,
        },
        deps,
      ),
    ).resolves.toBeNull();
  });
});
