import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocationResolutionError } from "@/server/services/location.service";

const { getRecommendation } = vi.hoisted(() => ({
  getRecommendation: vi.fn(),
}));

vi.mock("@/server/services/recommendation.service", () => ({
  getRecommendation,
}));

vi.mock("@/server/services/weather.service", () => ({
  getMissionWeather: vi.fn().mockResolvedValue({ status: "unavailable" }),
}));

import { getMissionWeather } from "@/server/services/weather.service";

import { GET, POST, runtime } from "./route";

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

function postRequest(overrides: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locationMode: "nearby",
      location: "Clayton 3168",
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 120,
      playStyle: "solo",
      canSupervise: false,
      ...overrides,
    }),
  });
}

describe("POST /api/recommendations", () => {
  beforeEach(() => {
    getRecommendation.mockReset();
    getRecommendation.mockResolvedValue(null);
  });

  it("passes trimmed interests to the recommendation service", async () => {
    const response = await POST(
      postRequest({ interests: "  dinosaurs and space  " }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(getRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({ interests: "dinosaurs and space" }),
    );
  });

  it("rejects interests longer than 150 characters", async () => {
    const response = await POST(postRequest({ interests: "x".repeat(151) }));

    expect(response.status).toBe(400);
    expect(getRecommendation).not.toHaveBeenCalled();
  });

  it("passes interests into the extreme-UV home rerank", async () => {
    getRecommendation
      .mockResolvedValueOnce({
        missionId: "MIS-OUTDOOR",
        venue: { latitude: -37.92, longitude: 145.12 },
        totalMinutes: 42,
      })
      .mockResolvedValueOnce({
        missionId: "MIS-HOME",
        venue: null,
        totalMinutes: 30,
      });
    vi.mocked(getMissionWeather).mockResolvedValueOnce({
      status: "available",
      summary: "Clear skies.",
      severity: "regular",
      maxUvIndex: 10,
      startsAt: "2026-09-13T10:00:00Z",
      endsAt: "2026-09-13T10:42:00Z",
    });

    await POST(postRequest({ interests: "drawing" }));

    expect(getRecommendation).toHaveBeenLastCalledWith(
      expect.objectContaining({
        interests: "drawing",
        locationMode: "home",
        homeBasedOnly: true,
      }),
    );
  });
});

describe("GET /api/recommendations", () => {
  beforeEach(() => {
    getRecommendation.mockReset();
    getRecommendation.mockResolvedValue(null);
  });

  it("returns one no-store recommendation using Node.js", async () => {
    const recommendation = { missionId: "MIS-001" };
    getRecommendation.mockResolvedValue(recommendation);

    const response = await GET(request({ excludeMissionId: "MIS-002" }));

    expect(runtime).toBe("nodejs");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      recommendation: { ...recommendation, weather: { status: "unavailable" } },
    });
    expect(getRecommendation).toHaveBeenCalledWith({
      playStyle: "solo",
      canSupervise: false,
      ...validQuery,
      locationMode: "nearby",
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 120,
      excludeMissionIds: ["MIS-002"],
    });
  });

  it("enriches the selected venue for the full outing duration", async () => {
    const venue = { latitude: -37.92, longitude: 145.12 };
    const weather = {
      status: "available" as const,
      summary: "Cloudy.",
      severity: "regular" as const,
      startsAt: "2026-09-13T10:00:00Z",
      endsAt: "2026-09-13T10:42:00Z",
    };
    getRecommendation.mockResolvedValue({
      missionId: "MIS-001",
      venue,
      durationMinutes: 30,
      totalMinutes: 42,
    });
    vi.mocked(getMissionWeather).mockResolvedValueOnce(weather);
    const response = await GET(request());
    expect(getMissionWeather).toHaveBeenLastCalledWith(venue, 42);
    expect((await response.json()).recommendation.weather).toEqual(weather);
  });

  it("switches to a home activity when nearby UV reaches 10", async () => {
    const outdoor = {
      missionId: "MIS-OUTDOOR",
      venue: { latitude: -37.92, longitude: 145.12 },
      durationMinutes: 30,
      totalMinutes: 42,
    };
    const home = {
      missionId: "MIS-HOME",
      missionType: "Home-Based",
      venue: null,
      durationMinutes: 30,
      totalMinutes: 30,
    };
    getRecommendation.mockResolvedValueOnce(outdoor).mockResolvedValueOnce(home);
    vi.mocked(getMissionWeather).mockResolvedValueOnce({
      status: "available",
      summary: "Clear skies.",
      severity: "regular",
      maxUvIndex: 10,
      startsAt: "2026-09-13T10:00:00Z",
      endsAt: "2026-09-13T10:42:00Z",
    });

    const response = await GET(request());

    expect(getRecommendation).toHaveBeenLastCalledWith(
      expect.objectContaining({
        locationMode: "home",
        homeBasedOnly: true,
      }),
    );
    expect((await response.json()).recommendation).toMatchObject({
      missionId: "MIS-HOME",
      weather: { status: "unavailable" },
    });
  });

  it("keeps a nearby activity when UV is 9", async () => {
    const outdoor = {
      missionId: "MIS-OUTDOOR",
      missionType: "Location-Based",
      venue: { latitude: -37.92, longitude: 145.12 },
      durationMinutes: 30,
      totalMinutes: 42,
    };
    getRecommendation.mockResolvedValueOnce(outdoor);
    vi.mocked(getMissionWeather).mockResolvedValueOnce({
      status: "available",
      summary: "Clear skies. High UV: bring sunscreen and a hat.",
      severity: "regular",
      maxUvIndex: 9,
      startsAt: "2026-09-13T10:00:00Z",
      endsAt: "2026-09-13T10:42:00Z",
    });

    const response = await GET(request());

    expect(getRecommendation).toHaveBeenCalledTimes(1);
    expect((await response.json()).recommendation).toMatchObject({
      missionId: "MIS-OUTDOOR",
      missionType: "Location-Based",
      weather: { maxUvIndex: 9 },
    });
  });

  it.each([10, 12])(
    "always selects a Home-Based activity for extreme UV (%s)",
    async (maxUvIndex) => {
      const outdoor = {
        missionId: "MIS-OUTDOOR",
        missionType: "Location-Based",
        venue: { latitude: -37.92, longitude: 145.12 },
        durationMinutes: 30,
        totalMinutes: 42,
      };
      const home = {
        missionId: "MIS-HOME",
        missionType: "Home-Based",
        venue: null,
        durationMinutes: 30,
        totalMinutes: 30,
      };
      getRecommendation.mockResolvedValueOnce(outdoor).mockResolvedValueOnce(home);
      vi.mocked(getMissionWeather).mockResolvedValueOnce({
        status: "available",
        summary: "Clear skies.",
        severity: "regular",
        maxUvIndex,
        startsAt: "2026-09-13T10:00:00Z",
        endsAt: "2026-09-13T10:42:00Z",
      });

      const response = await GET(request());

      expect(getRecommendation).toHaveBeenLastCalledWith(
        expect.objectContaining({
          locationMode: "home",
          homeBasedOnly: true,
        }),
      );
      expect((await response.json()).recommendation).toMatchObject({
        missionType: "Home-Based",
      });
    },
  );

  it("accepts home mode without a location", async () => {
    const response = await GET(
      request({ location: null, locationMode: "home" }),
    );

    expect(response.status).toBe(200);
    expect(getRecommendation).toHaveBeenCalledWith({
      playStyle: "solo",
      canSupervise: false,
      locationMode: "home",
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 120,
    });
  });

  it("parses group play and supervision explicitly", async () => {
    const response = await GET(
      request({ playStyle: "group", canSupervise: "true" }),
    );
    expect(response.status).toBe(200);
    expect(getRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({ playStyle: "group", canSupervise: true }),
    );
  });

  it("parses valid lat and lng coordinates for nearby mode", async () => {
    const response = await GET(request({ lat: "-37.915", lng: "145.123" }));
    expect(response.status).toBe(200);
    expect(getRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: -37.915,
        longitude: 145.123,
      }),
    );
  });

  it("rejects when only lat is provided without lng", async () => {
    const response = await GET(request({ lat: "-37.915" }));
    expect(response.status).toBe(400);
  });

  it("ignores an irrelevant location in home mode", async () => {
    const response = await GET(
      request({ locationMode: "home", location: "a".repeat(101) }),
    );

    expect(response.status).toBe(200);
    expect(getRecommendation).toHaveBeenCalledWith({
      playStyle: "solo",
      canSupervise: false,
      locationMode: "home",
      ageMin: 6,
      ageMax: 10,
      durationMinutes: 120,
    });
  });

  it("normalizes repeated exclusions and rejects replay with exclusions", async () => {
    const repeatedParams = new URLSearchParams(validQuery);
    repeatedParams.append("excludeMissionId", "MIS-001");
    repeatedParams.append("excludeMissionId", "MIS-002");
    repeatedParams.append("excludeMissionId", "MIS-001");
    const repeatedResponse = await GET(
      new Request(`http://localhost/api/recommendations?${repeatedParams}`),
    );

    expect(repeatedResponse.status).toBe(200);
    expect(getRecommendation).toHaveBeenLastCalledWith(
      expect.objectContaining({
        excludeMissionIds: ["MIS-001", "MIS-002"],
      }),
    );

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

  it("rejects more than ten mission exclusions", async () => {
    const params = new URLSearchParams(validQuery);

    for (let index = 1; index <= 11; index += 1) {
      params.append(
        "excludeMissionId",
        `MIS-${String(index).padStart(3, "0")}`,
      );
    }

    const response = await GET(
      new Request(`http://localhost/api/recommendations?${params}`),
    );

    expect(response.status).toBe(400);
    expect(getRecommendation).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid play style", { playStyle: "pairs" }],
    ["invalid supervision", { canSupervise: "yes" }],
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
    ["long mission ID", { missionId: "a".repeat(51) }],
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
