import { describe, expect, it } from "vitest";

import {
  getPlanningWindow,
  isPlannableDate,
  localDateKey,
  shiftLocalDateKey,
  startOfLocalWeek,
} from "./planner-dates";

describe("planner local dates", () => {
  it("uses the local calendar date near midnight", () => {
    expect(localDateKey(new Date(2026, 9, 4, 0, 1))).toBe("2026-10-04");
    expect(localDateKey(new Date(2026, 9, 3, 23, 59))).toBe("2026-10-03");
  });

  it("includes today and exactly 365 calendar days", () => {
    const now = new Date(2026, 9, 4, 23, 30);
    expect(getPlanningWindow(now)).toEqual({
      minDateKey: "2026-10-04",
      maxDateKey: "2027-10-04",
    });
    expect(isPlannableDate("2026-10-04", now)).toBe(true);
    expect(isPlannableDate("2027-10-04", now)).toBe(true);
    expect(isPlannableDate("2026-10-03", now)).toBe(false);
    expect(isPlannableDate("2027-10-05", now)).toBe(false);
  });

  it("rejects malformed and impossible dates", () => {
    const now = new Date(2026, 9, 4);
    expect(isPlannableDate("2026-02-30", now)).toBe(false);
    expect(isPlannableDate("04-10-2026", now)).toBe(false);
  });

  it("shifts by local calendar days across DST and year boundaries", () => {
    expect(shiftLocalDateKey("2026-10-04", 1)).toBe("2026-10-05");
    expect(shiftLocalDateKey("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("starts weeks on Monday", () => {
    expect(localDateKey(startOfLocalWeek(new Date(2026, 9, 4)))).toBe(
      "2026-09-28",
    );
    expect(localDateKey(startOfLocalWeek(new Date(2026, 9, 5)))).toBe(
      "2026-10-05",
    );
  });
});
