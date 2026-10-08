import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ScreenHeader } from "./screen-header";

describe("ScreenHeader", () => {
  it("renders brand logo and title", () => {
    const markup = renderToStaticMarkup(<ScreenHeader title="Test Title" />);

    expect(markup).toContain("PlayGo &amp; Co");
    expect(markup).toContain("Test Title");
  });

  it("renders description when provided", () => {
    const markup = renderToStaticMarkup(
      <ScreenHeader
        title="Test Title"
        description="This is a test description"
      />,
    );

    expect(markup).toContain("This is a test description");
  });

  it("applies tabIndex and outline-none when tabIndex is supplied", () => {
    const ref = createRef<HTMLHeadingElement>();
    const markup = renderToStaticMarkup(
      <ScreenHeader title="Ref Title" headingRef={ref} tabIndex={-1} />,
    );

    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain("outline-none");
  });

  it("applies custom className and renders children", () => {
    const markup = renderToStaticMarkup(
      <ScreenHeader title="Custom" className="mb-6">
        <span data-testid="custom-child">Extra content</span>
      </ScreenHeader>,
    );

    expect(markup).toContain("mb-6");
    expect(markup).toContain("Extra content");
  });
});
