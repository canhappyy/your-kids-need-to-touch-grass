import { describe, expect, it, vi } from "vitest";
import { fetchSpeciesBadges } from "./badges";
import { MILESTONE_BADGES } from "./rewards";

describe("fetchSpeciesBadges", () => {
  it("returns fetched badges when API returns 200", async () => {
    const mockBadges = [
      {
        id: "koala",
        milestoneDays: 3,
        speciesName: "Koala",
        icon: "🐨",
      },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBadges,
    });

    const result = await fetchSpeciesBadges(mockFetch as unknown as typeof fetch);

    expect(result).toEqual(mockBadges);
    expect(mockFetch).toHaveBeenCalledWith("/api/badges");
  });

  it("falls back to MILESTONE_BADGES when API response is not ok", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
    });

    const result = await fetchSpeciesBadges(mockFetch as unknown as typeof fetch);

    expect(result).toEqual([...MILESTONE_BADGES]);
  });

  it("falls back to MILESTONE_BADGES on network throw", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network failed"));

    const result = await fetchSpeciesBadges(mockFetch as unknown as typeof fetch);

    expect(result).toEqual([...MILESTONE_BADGES]);
  });
});
