import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getAllOpenSpaces } = vi.hoisted(() => ({
  getAllOpenSpaces: vi.fn(),
}));

vi.mock("@/server/services/open-space.service", () => ({
  getAllOpenSpaces,
}));

import { GET } from "./route";

describe("GET /api/open-spaces", () => {
  beforeEach(() => {
    getAllOpenSpaces.mockReset();
  });

  it("rejects an unknown open-space category", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/open-spaces?category=unknown"),
    );

    expect(response.status).toBe(400);
    expect(getAllOpenSpaces).not.toHaveBeenCalled();
  });

  it("accepts a known open-space category", async () => {
    getAllOpenSpaces.mockResolvedValue([]);

    const response = await GET(
      new NextRequest("http://localhost/api/open-spaces?category=park"),
    );

    expect(response.status).toBe(200);
    expect(getAllOpenSpaces).toHaveBeenCalledWith("park");
  });
});
