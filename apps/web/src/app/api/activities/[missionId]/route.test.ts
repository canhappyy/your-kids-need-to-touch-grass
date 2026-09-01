import { beforeEach, describe, expect, it, vi } from "vitest";

const { getActivityById } = vi.hoisted(() => ({
  getActivityById: vi.fn(),
}));

vi.mock("@/server/services/activity.service", () => ({
  getActivityById,
}));

import { GET } from "./route";

describe("GET /api/activities/[missionId]", () => {
  beforeEach(() => {
    getActivityById.mockReset();
  });

  it("rejects mission IDs longer than the database column", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ missionId: "a".repeat(51) }),
    });

    expect(response.status).toBe(400);
    expect(getActivityById).not.toHaveBeenCalled();
  });

  it("accepts a mission ID at the 50-character boundary", async () => {
    const missionId = "a".repeat(50);
    getActivityById.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ missionId }),
    });

    expect(response.status).toBe(404);
    expect(getActivityById).toHaveBeenCalledWith(missionId);
  });
});
