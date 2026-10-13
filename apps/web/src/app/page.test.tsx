import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("@/components/landing", () => ({
  LandingSection: () =>
    createElement("div", { "data-testid": "landing-section" }, "Landing Section"),
}));

describe("Home Page", () => {
  it("renders the landing section within main container", () => {
    const markup = renderToStaticMarkup(createElement(Home));

    expect(markup).toContain('data-testid="landing-section"');
    expect(markup).toContain("bg-[#FDF6EA]");
  });
});
