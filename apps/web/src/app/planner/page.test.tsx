import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PlannerPage from "./page";

vi.mock("@/components/planner", () => ({
  PlannerSection: () =>
    createElement("div", { "data-testid": "planner-section" }, "Planner Section"),
}));

vi.mock("@/components/layout/top-nav", () => ({
  TopNav: (props: { showHistory?: boolean }) =>
    createElement("nav", {
      "data-testid": "top-nav",
      "data-show-history": String(Boolean(props.showHistory)),
    }),
}));

describe("PlannerPage", () => {
  it("renders TopNav with showHistory and the PlannerSection", () => {
    const markup = renderToStaticMarkup(createElement(PlannerPage));

    expect(markup).toContain('data-testid="top-nav"');
    expect(markup).toContain('data-show-history="true"');
    expect(markup).toContain('data-testid="planner-section"');
    expect(markup).toContain("pt-16");
    expect(markup).toContain("sm:pt-20");
  });
});
