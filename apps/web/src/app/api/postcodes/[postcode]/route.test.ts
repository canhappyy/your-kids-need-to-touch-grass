import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPostcode } = vi.hoisted(() => ({
  getPostcode: vi.fn(),
}));

vi.mock("@/server/services/postcode.service", () => ({
  getPostcode,
}));

import { GET } from "./route";

describe("GET /api/postcodes/[postcode]", () => {
  beforeEach(() => {
    getPostcode.mockReset();
  });

  it("accepts a four-digit postcode", async () => {
    getPostcode.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ postcode: "3168" }),
    });

    expect(response.status).toBe(404);
    expect(getPostcode).toHaveBeenCalledWith("3168");
  });

  it("rejects a malformed postcode", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ postcode: "316A" }),
    });

    expect(response.status).toBe(400);
    expect(getPostcode).not.toHaveBeenCalled();
  });
});
