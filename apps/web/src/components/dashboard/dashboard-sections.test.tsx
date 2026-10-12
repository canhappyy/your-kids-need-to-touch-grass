import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DashboardDisclosure } from "./dashboard-disclosure";
import { FavouriteActivities } from "./favourite-activities";

describe("dashboard detail sections", () => {
  it("announces disclosure state and shows the NEW marker", () => {
    const closed = renderToStaticMarkup(
      createElement(
        DashboardDisclosure,
        {
          id: "rewards",
          isNew: true,
          onToggle: vi.fn(),
          open: false,
          title: "Reward badges",
        },
        createElement("p", null, "Badge content"),
      ),
    );
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain('aria-controls="rewards-panel"');
    expect(closed).toContain("NEW");
    expect(closed).not.toContain("Badge content");

    const open = renderToStaticMarkup(
      createElement(
        DashboardDisclosure,
        {
          id: "rewards",
          onToggle: vi.fn(),
          open: true,
          title: "Reward badges",
        },
        createElement("p", null, "Badge content"),
      ),
    );
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain('role="region"');
    expect(open).toContain("rotate-180");
    expect(open).toContain("Badge content");
  });

  it("renders favourite tags in supplied rank order with proportional bars", () => {
    const markup = renderToStaticMarkup(
      createElement(FavouriteActivities, {
        tags: [
          { name: "Exploration", count: 4 },
          { name: "Movement", count: 2 },
        ],
      }),
    );

    expect(markup.indexOf("Exploration")).toBeLessThan(
      markup.indexOf("Movement"),
    );
    expect(markup).toContain("4 logged activities");
    expect(markup).toContain("2 logged activities");
    expect(markup).toContain("width:100%");
    expect(markup).toContain("width:50%");
    expect(markup).toContain(
      "[&amp;_[data-slot=progress-indicator]]:bg-[#E4633C]",
    );
  });

});
