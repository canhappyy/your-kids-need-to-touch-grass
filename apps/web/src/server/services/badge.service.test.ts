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
      requirement: "7",
      badge_id: "saltwater_crocodile",
      rule_type: "streak_days",
      rule_field: null,
      rule_operator: "gte",
      rule_value: "7",
      description: "A whole week of play in a row!",
      image_earned: "saltwater_crocodile.svg",
      image_locked: "saltwater_crocodile_locked.svg",
    };

    const formatted = formatSpeciesBadge(raw);

    expect(formatted).toEqual({
      id: "saltwater_crocodile",
      milestoneDays: 7,
      speciesName: "Saltwater Crocodile",
      icon: "saltwater_crocodile.svg",
      lockedIcon: "saltwater_crocodile_locked.svg",
      category: "streak",
      requirement: "7",
      ruleType: "streak_days",
      ruleOperator: "gte",
      ruleValue: "7",
      description: "A whole week of play in a row!",
    });
  });

  it("handles variety tag badges with non-numeric requirement", () => {
    const raw = {
      vernacular_name: "Sugar Glider",
      badge_type: "variety",
      requirement: "Quiet",
      badge_id: "sugar_glider",
      rule_type: "first_matching_activity",
      rule_field: "variety_tags",
      rule_operator: "contains",
      rule_value: "Quiet",
      description: "You tried your first quiet activity.",
      image_earned: "sugar_glider.svg",
      image_locked: "sugar_glider_locked.svg",
    };

    const formatted = formatSpeciesBadge(raw);

    expect(formatted).toEqual({
      id: "sugar_glider",
      milestoneDays: 0,
      speciesName: "Sugar Glider",
      icon: "sugar_glider.svg",
      lockedIcon: "sugar_glider_locked.svg",
      category: "variety",
      requirement: "Quiet",
      ruleType: "first_matching_activity",
      ruleField: "variety_tags",
      ruleOperator: "contains",
      ruleValue: "Quiet",
      description: "You tried your first quiet activity.",
    });
  });

  it("calls repository and returns all formatted badges", async () => {
    findAllSpeciesBadges.mockResolvedValue([
      {
        vernacular_name: "Koala", badge_type: "streak", requirement: "3",
        badge_id: "koala", rule_type: "streak_days", rule_field: null,
        rule_operator: "gte", rule_value: "3", description: "Three days!",
        image_earned: "koala.svg", image_locked: "koala_locked.svg",
      },
      {
        vernacular_name: "Green Turtle", badge_type: "streak", requirement: "5",
        badge_id: "green_turtle", rule_type: "streak_days", rule_field: null,
        rule_operator: "gte", rule_value: "5", description: "Five days!",
        image_earned: "green_turtle.svg", image_locked: "green_turtle_locked.svg",
      },
    ]);

    const badges = await getAllSpeciesBadges();

    expect(badges).toHaveLength(2);
    expect(badges[0].speciesName).toBe("Koala");
    expect(badges[0].icon).toBe("koala.svg");
    expect(badges[1].speciesName).toBe("Green Turtle");
    expect(badges[1].icon).toBe("green_turtle.svg");
  });
});
