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
      vernacular_name: "Saltwater Crocodile",
      badge_type: "streak",
      target_metric: "consecutive_days",
      target_value: "7",
    };

    const formatted = formatSpeciesBadge(raw);

    expect(formatted).toEqual({
      id: "saltwater-crocodile",
      milestoneDays: 7,
      speciesName: "Saltwater Crocodile",
      icon: "saltwater_crocodile.svg",
      lockedIcon: "saltwater_crocodile_locked.svg",
      category: "streak",
      requirement: "7",
      targetMetric: "consecutive_days",
      targetValue: "7",
    });
  });

  it("handles variety tag badges with non-numeric requirement", () => {
    const raw = {
      vernacular_name: "Sugar Glider",
      badge_type: "variety",
      target_metric: "variety_tag",
      target_value: "Quiet",
    };

    const formatted = formatSpeciesBadge(raw);

    expect(formatted).toEqual({
      id: "sugar-glider",
      milestoneDays: 0,
      speciesName: "Sugar Glider",
      icon: "sugar_glider.svg",
      lockedIcon: "sugar_glider_locked.svg",
      category: "variety",
      requirement: "Quiet",
      targetMetric: "variety_tag",
      targetValue: "Quiet",
    });
  });

  it("calls repository and returns all formatted badges", async () => {
    findAllSpeciesBadges.mockResolvedValue([
      { vernacular_name: "Koala", badge_type: "streak", target_metric: "consecutive_days", target_value: "3" },
      { vernacular_name: "Green Turtle", badge_type: "streak", target_metric: "consecutive_days", target_value: "5" },
    ]);

    const badges = await getAllSpeciesBadges();

    expect(badges).toHaveLength(2);
    expect(badges[0].speciesName).toBe("Koala");
    expect(badges[0].icon).toBe("koala.svg");
    expect(badges[1].speciesName).toBe("Green Turtle");
    expect(badges[1].icon).toBe("green_turtle.svg");
  });
});
