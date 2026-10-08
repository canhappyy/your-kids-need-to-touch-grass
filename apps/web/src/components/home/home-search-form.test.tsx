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

  it("renders age range bucket options", () => {
    const markup = renderToStaticMarkup(
      <HomeSearchForm onValidSubmit={vi.fn()} />,
    );

    expect(markup).toContain("5 - 7 yrs");
    expect(markup).toContain("8 - 9 yrs");
    expect(markup).toContain("10 - 12 yrs");
  });

  it("renders child's interests free text input field", () => {
    const markup = renderToStaticMarkup(
      <HomeSearchForm onValidSubmit={vi.fn()} />,
    );

    expect(markup).toContain("Child&#x27;s interests (optional)");
    expect(markup).toContain("AI Ready");
    expect(markup).toContain('id="interests"');
  });
});
