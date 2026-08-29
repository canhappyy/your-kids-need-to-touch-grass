import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocationResolutionError } from "@/server/services/location.service";

const { getRecommendation } = vi.hoisted(() => ({
  getRecommendation: vi.fn(),
}));

vi.mock("@/server/services/recommendation.service", () => ({
  getRecommendation,
}));

import { GET, runtime } from "./route";

function request(query: string): Request {
  return new Request(`http://localhost/api/recommendations?${query}`);
}

describe("GET /api/recommendations", () => {
  beforeEach(() => {
    getRecommendation.mockReset();
    getRecommendation.mockResolvedValue(null);
  });

  it("uses the Node.js runtime and returns one recommendation contract", async () => {
    const recommendation = { missionId: "MIS-001" };
    getRecommendation.mockResolvedValue(recommendation);

    const response = await GET(
      request(
        "location=Clayton%203168&ageMin=6&ageMax=10&durationMinutes=120&excludeMissionId=MIS-002",
      ),
    );

    expect(runtime).toBe("nodejs");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ recommendation });
    expect(getRecommendation).toHaveBeenCalledWith({
      location: "Clayton 3168",
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 120,
      excludeMissionId: "MIS-002",
    });
  });

  it.each([
    ["missing location", "ageMin=6&ageMax=10&durationMinutes=120"],
    ["blank location", "location=%20&ageMin=6&ageMax=10&durationMinutes=120"],
    [
      "long location",
      `location=${"a".repeat(101)}&ageMin=6&ageMax=10&durationMinutes=120`,
    ],
    ["decimal age", "location=3168&ageMin=6.5&ageMax=10&durationMinutes=120"],
    ["young age", "location=3168&ageMin=4&ageMax=10&durationMinutes=120"],
    ["old age", "location=3168&ageMin=6&ageMax=13&durationMinutes=120"],
    ["reversed ages", "location=3168&ageMin=10&ageMax=6&durationMinutes=120"],
    ["short duration", "location=3168&ageMin=6&ageMax=10&durationMinutes=0"],
    ["long duration", "location=3168&ageMin=6&ageMax=10&durationMinutes=780"],
    ["duration step", "location=3168&ageMin=6&ageMax=10&durationMinutes=12"],
  ])("returns 400 INVALID_INPUT for %s", async (_name, query) => {
    const response = await GET(request(query));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_INPUT" },
    });
    expect(getRecommendation).not.toHaveBeenCalled();
  });

  it.each([
    ["LOCATION_NOT_FOUND", 404],
    ["AMBIGUOUS_LOCATION", 422],
  ] as const)("returns typed %s location errors", async (code, status) => {
    getRecommendation.mockRejectedValue(
      new LocationResolutionError(
        code,
        status,
        code === "LOCATION_NOT_FOUND"
          ? "Location not found."
          : "Enter a postcode to choose the correct suburb.",
      ),
    );

    const response = await GET(
      request("location=Nowhere&ageMin=6&ageMax=10&durationMinutes=120"),
    );

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({
      error: { code, field: "location" },
    });
  });

  it("sanitizes unexpected database errors", async () => {
    getRecommendation.mockRejectedValue(
      new Error("password=secret relation activity missing"),
    );

    const response = await GET(
      request("location=3168&ageMin=6&ageMax=10&durationMinutes=120"),
    );
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
