import { describe, expect, it } from "vitest";

import { localDateKey } from "./planner-dates";
import { movePlannerPeriod } from "./planner-navigation";

describe("planner period navigation", () => {
  it("moves a month view to the first day of the adjacent month", () => {
    const result = movePlannerPeriod(
      "month",
      new Date(2026, 9, 1, 12),
      new Date(2026, 9, 20, 12),
      1,
    );

    expect(localDateKey(result.selectedDate)).toBe("2026-11-01");
    expect(localDateKey(result.displayedMonth)).toBe("2026-11-01");
  });

  it("keeps the month display synchronized after weekly navigation", () => {
    const result = movePlannerPeriod(
      "week",
      new Date(2026, 9, 1, 12),
      new Date(2026, 9, 28, 12),
      1,
    );

    expect(localDateKey(result.selectedDate)).toBe("2026-11-04");
    expect(localDateKey(result.displayedMonth)).toBe("2026-11-01");
  });
});
