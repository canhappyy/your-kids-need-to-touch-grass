import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAllSpeciesBadges } = vi.hoisted(() => ({
  getAllSpeciesBadges: vi.fn(),
}));

vi.mock("@/server/services/badge.service", () => ({
  getAllSpeciesBadges,
}));

import { GET } from "./route";

describe("GET /api/badges", () => {
  beforeEach(() => {
    getAllSpeciesBadges.mockReset();
  });

  it("returns species badges with status 200 on success", async () => {
    const mockBadges = [
      {
        id: "koala",
        milestoneDays: 3,
        speciesName: "Koala",
        icon: "🐨",
        category: "Streak",
        requirement: "3",
      },
    ];
    getAllSpeciesBadges.mockResolvedValue(mockBadges);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockBadges);
  });

  it("returns 500 when service throws an error", async () => {
    getAllSpeciesBadges.mockRejectedValue(new Error("Database offline"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch species badges" });
  });
});
