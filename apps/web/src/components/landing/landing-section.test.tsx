import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LandingSection } from "./landing-section";

vi.mock("@/components/layout/top-nav", () => ({
  TopNav: (props: { showHistory?: boolean }) =>
    createElement("nav", {
      "data-testid": "top-nav",
      "data-show-history": String(Boolean(props.showHistory)),
    }),
}));

describe("LandingSection", () => {
  it("renders key landing page sections, headings and primary call-to-action buttons", () => {
    const markup = renderToStaticMarkup(createElement(LandingSection));

    // TopNav with history
    expect(markup).toContain('data-testid="top-nav"');
    expect(markup).toContain('data-show-history="true"');

    // Hero title and value proposition
    expect(markup).toContain("Turn");
    expect(markup).toContain("screen time");
    expect(markup).toContain("green time");

    // Action CTAs linking to search and planner
    expect(markup).toContain('href="/search"');
    expect(markup).toContain("Find an Activity");
    expect(markup).toContain('href="/planner"');

    // How it works
    expect(markup).toContain("How PlayGo &amp; Co Works");
    expect(markup).toContain("Tell us what they love");
    expect(markup).toContain("Get an instant, weather-ready mission");

    // Core value features
    expect(markup).toContain("Why Parents Love PlayGo &amp; Co");
    expect(markup).toContain("Weather-Smart Recommendations");

    // Badges showcase
    expect(markup).toContain("Collect Victorian Wildlife Badges");
    expect(markup).toContain("Platypus");
    expect(markup).toContain("Koala");

    // Health movement guidelines
    expect(markup).toContain("Australian 24-Hour Movement Guidelines");

    // Bottom CTA & Governance footer
    expect(markup).toContain("Ready to trade screen time for sunshine?");
    expect(markup).toContain('href="/data-governance"');
  });
});
