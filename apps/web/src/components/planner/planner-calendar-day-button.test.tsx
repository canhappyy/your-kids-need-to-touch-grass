import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  PlannerCalendarDayButton,
  PLANNER_SELECTED_DAY_CLASSES,
} from "./planner-calendar-day-button";

describe("PlannerCalendarDayButton", () => {
  it("exports PLANNER_SELECTED_DAY_CLASSES matching the planner screen color", () => {
    expect(PLANNER_SELECTED_DAY_CLASSES).toContain("bg-[#F0B6A31F]");
    expect(PLANNER_SELECTED_DAY_CLASSES).toContain("border-[#E4633C]/40");
    expect(PLANNER_SELECTED_DAY_CLASSES).toContain("text-zinc-900");
  });

  it("applies planner selected styling to CalendarDayButton", () => {
    const markup = renderToStaticMarkup(
      createElement(PlannerCalendarDayButton, {
        day: {
          date: new Date(2026, 9, 4),
          displayMonth: new Date(2026, 9, 1),
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        modifiers: {
          selected: true,
        },
      }),
    );

    expect(markup).toContain("bg-[#F0B6A31F]");
    expect(markup).toContain("border-[#E4633C]/40");
    expect(markup).toContain('data-selected-single="true"');
  });
});
