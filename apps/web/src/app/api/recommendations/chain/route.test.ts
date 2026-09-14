import { beforeEach, describe, expect, it, vi } from "vitest";

const { getChainedRecommendation, getMissionWeather } = vi.hoisted(() => ({
  getChainedRecommendation: vi.fn(),
  getMissionWeather: vi.fn(),
}));

vi.mock("@/server/services/recommendation.service", () => ({
  getChainedRecommendation,
}));
vi.mock("@/server/services/weather.service", () => ({ getMissionWeather }));

import { GET, runtime } from "./route";

const validQuery = {
  location: "Clayton 3168",
  ageMin: "6",
  ageMax: "9",
  playStyle: "solo",
  canSupervise: "false",
  primaryMissionId: "MIS-001",
  openSpaceId: "42",
};

function request(overrides: Record<string, string | null> = {}) {
  const params = new URLSearchParams(validQuery);
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === null) params.delete(key);
    else params.set(key, value);
  });
  return new Request(`http://localhost/api/recommendations/chain?${params}`);
}

describe("GET /api/recommendations/chain", () => {
  beforeEach(() => {
    getChainedRecommendation.mockReset();
    getMissionWeather.mockReset();
    getChainedRecommendation.mockResolvedValue(null);
    getMissionWeather.mockResolvedValue({ status: "unavailable" });
  });

  it("returns a no-store chained mission with weather through the return trip", async () => {
    const recommendation = {
      missionId: "MIS-002",
      venue: { latitude: -37.92, longitude: 145.12 },
    };
    getChainedRecommendation.mockResolvedValue({
      recommendation,
      outingTotalMinutes: 72,
    });

    const response = await GET(request({ secondaryMissionId: "MIS-002" }));

    expect(runtime).toBe("nodejs");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(getChainedRecommendation).toHaveBeenCalledWith({
      location: "Clayton 3168",
      ageMin: 6,
      ageMax: 9,
      playStyle: "solo",
      canSupervise: false,
      primaryMissionId: "MIS-001",
      openSpaceId: 42,
      missionId: "MIS-002",
    });
    expect(getMissionWeather).toHaveBeenCalledWith(
      recommendation.venue,
      72,
    );
    await expect(response.json()).resolves.toEqual({
      recommendation: {
        ...recommendation,
        weather: { status: "unavailable" },
      },
    });
  });

  it("returns null without requesting weather", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ recommendation: null });
    expect(getMissionWeather).not.toHaveBeenCalled();
  });

  it.each([
    ["missing location", { location: null }],
    ["missing primary", { primaryMissionId: null }],
    ["invalid venue", { openSpaceId: "0" }],
    ["reversed ages", { ageMin: "10", ageMax: "6" }],
    ["one coordinate", { lat: "-37.9" }],
    ["long replay ID", { secondaryMissionId: "a".repeat(51) }],
  ])("returns 400 for %s", async (_name, overrides) => {
    const response = await GET(request(overrides));
    expect(response.status).toBe(400);
    expect(getChainedRecommendation).not.toHaveBeenCalled();
  });
});
