import { describe, expect, it, vi } from "vitest";
import { formatSpeciesBadge, getAllSpeciesBadges } from "./badge.service";

const { findAllSpeciesBadges } = vi.hoisted(() => ({
  findAllSpeciesBadges: vi.fn(),
}));

vi.mock("@/server/repositories/badge.repository", () => ({
  findAllSpeciesBadges,
}));

describe("badge.service", () => {
  it("formats raw database rows into MilestoneBadge objects", () => {
    const raw = {
      animal_name: "Saltwater Crocodile",
      badge_category: "Streak",
      requirement: "7",
    };

    const formatted = formatSpeciesBadge(raw);

    expect(formatted).toEqual({
      id: "saltwater-crocodile",
      milestoneDays: 7,
      speciesName: "Saltwater Crocodile",
      icon: "🐊",
      category: "Streak",
      requirement: "7",
    });
  });

  it("handles variety tag badges with non-numeric requirement", () => {
    const raw = {
      animal_name: "Sugar Glider",
      badge_category: "Variety Tag",
      requirement: "Quiet",
    };

    const formatted = formatSpeciesBadge(raw);

    expect(formatted).toEqual({
      id: "sugar-glider",
      milestoneDays: 0,
      speciesName: "Sugar Glider",
      icon: "🐿️",
      category: "Variety Tag",
      requirement: "Quiet",
    });
  });

  it("calls repository and returns all formatted badges", async () => {
    findAllSpeciesBadges.mockResolvedValue([
      { animal_name: "Koala", badge_category: "Streak", requirement: "3" },
      { animal_name: "Green Turtle", badge_category: "Streak", requirement: "5" },
    ]);

    const badges = await getAllSpeciesBadges();

    expect(badges).toHaveLength(2);
    expect(badges[0].speciesName).toBe("Koala");
    expect(badges[0].icon).toBe("🐨");
    expect(badges[1].speciesName).toBe("Green Turtle");
    expect(badges[1].icon).toBe("🐢");
  });
});
