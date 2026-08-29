import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocationResolutionError } from "@/server/services/location.service";

const { getRecommendation } = vi.hoisted(() => ({
  getRecommendation: vi.fn(),
}));

vi.mock("@/server/services/recommendation.service", () => ({
  getRecommendation,
}));

import { GET, runtime } from "./route";

const validQuery = {
  location: "Clayton 3168",
  ageMin: "6",
  ageMax: "10",
  durationMinutes: "120",
};

function request(overrides: Record<string, string | null> = {}) {
  const params = new URLSearchParams(validQuery);

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }

  return new Request(`http://localhost/api/recommendations?${params}`);
}

describe("GET /api/recommendations", () => {
  beforeEach(() => {
    getRecommendation.mockReset();
    getRecommendation.mockResolvedValue(null);
  });

  it("returns one no-store recommendation using Node.js", async () => {
    const recommendation = { missionId: "MIS-001" };
    getRecommendation.mockResolvedValue(recommendation);

    const response = await GET(
      request({ excludeMissionId: "MIS-002" }),
    );

    expect(runtime).toBe("nodejs");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ recommendation });
    expect(getRecommendation).toHaveBeenCalledWith({
      ...validQuery,
      locationMode: "nearby",
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 120,
      excludeMissionId: "MIS-002",
    });
  });

  it("accepts home mode without a location", async () => {
    const response = await GET(
      request({ location: null, locationMode: "home" }),
    );

    expect(response.status).toBe(200);
    expect(getRecommendation).toHaveBeenCalledWith({
      locationMode: "home",
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 120,
    });
  });

  it("accepts exact replay but rejects replay with exclusion", async () => {
    const replayResponse = await GET(request({ missionId: "MIS-001" }));

    expect(replayResponse.status).toBe(200);
    expect(getRecommendation).toHaveBeenLastCalledWith(
      expect.objectContaining({ missionId: "MIS-001" }),
    );

    const invalidResponse = await GET(
      request({ missionId: "MIS-001", excludeMissionId: "MIS-002" }),
    );

    expect(invalidResponse.status).toBe(400);
    await expect(invalidResponse.json()).resolves.toMatchObject({
      error: { code: "INVALID_INPUT" },
    });
  });

  it.each([
    ["missing location", { location: null }],
    ["blank location", { location: " " }],
    ["long location", { location: "a".repeat(101) }],
    ["decimal age", { ageMin: "6.5" }],
    ["age below range", { ageMin: "4" }],
    ["age above range", { ageMax: "13" }],
    ["reversed ages", { ageMin: "11", ageMax: "6" }],
    ["short duration", { durationMinutes: "0" }],
    ["long duration", { durationMinutes: "780" }],
    ["duration step", { durationMinutes: "12" }],
    ["invalid location mode", { locationMode: "somewhere" }],
  ])("returns 400 for %s", async (_name, overrides) => {
    const response = await GET(request(overrides));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_INPUT" },
    });
    expect(getRecommendation).not.toHaveBeenCalled();
  });

  it.each([
    ["LOCATION_NOT_FOUND", 404],
    ["AMBIGUOUS_LOCATION", 422],
  ] as const)("returns %s location errors", async (code, status) => {
    getRecommendation.mockRejectedValue(
      new LocationResolutionError(code, status, "Location error."),
    );

    const response = await GET(request());

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({
      error: { code, field: "location" },
    });
  });

  it("sanitizes unexpected errors", async () => {
    getRecommendation.mockRejectedValue(new Error("password=secret"));

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to generate a recommendation.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("secret");
  });
});
