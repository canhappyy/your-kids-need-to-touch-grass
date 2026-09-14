import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { HomeSearchForm } from "./home-search-form";

describe("HomeSearchForm", () => {
  it("links parents to the internal data governance page", () => {
    const markup = renderToStaticMarkup(
      <HomeSearchForm onValidSubmit={vi.fn()} />,
    );

    expect(markup).toContain('href="/data-governance"');
    expect(markup).toContain("Learn more about our data");
    expect(markup).not.toContain("Tap for a random activity idea");
  });
});
