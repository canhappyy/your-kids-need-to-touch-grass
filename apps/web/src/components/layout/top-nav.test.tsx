import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TopNav } from "./top-nav";

vi.mock("@/hooks/use-completed-missions", () => ({
  useCompletedMissions: () => ({
    records: [],
    loading: false,
    error: "",
    refresh: vi.fn(),
    clear: vi.fn(),
  }),
}));

describe("TopNav", () => {
  it("renders back button link when backHref provided", () => {
    const markup = renderToStaticMarkup(
      createElement(TopNav, {
        backHref: "/",
        backAriaLabel: "Back to search",
      }),
    );

    expect(markup).toContain('href="/"');
    expect(markup).toContain('aria-label="Back to search"');
  });

  it("renders history toggle button when showHistory is true", () => {
    const markup = renderToStaticMarkup(
      createElement(TopNav, {
        showHistory: true,
      }),
    );

    expect(markup).toContain('aria-label="Completed missions history"');
    expect(markup).toContain('title="History"');
    expect(markup).toContain('aria-expanded="false"');
  });

  it("renders open history overlay when controlled isHistoryOpen is true", () => {
    const markup = renderToStaticMarkup(
      createElement(TopNav, {
        showHistory: true,
        isHistoryOpen: true,
      }),
    );

    expect(markup).toContain('aria-label="Close history"');
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain("Completed missions");
  });
});
