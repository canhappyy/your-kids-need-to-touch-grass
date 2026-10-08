import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ChildInterestsField } from "./child-interests-field";

describe("ChildInterestsField", () => {
  it("renders label with AI Ready badge, input field, and helper caption", () => {
    const markup = renderToStaticMarkup(
      createElement(ChildInterestsField, {
        onChange: vi.fn(),
        value: "dinosaurs and space",
      }),
    );

    expect(markup).toContain("Child&#x27;s interests (optional)");
    expect(markup).toContain("AI Ready");
    expect(markup).toContain('id="interests"');
    expect(markup).toContain('name="interests"');
    expect(markup).toContain('value="dinosaurs and space"');
    expect(markup).toContain("Add topics or activities your child loves to personalise AI recommendations.");
  });

  it("renders with empty value and placeholder by default", () => {
    const markup = renderToStaticMarkup(
      createElement(ChildInterestsField, {
        onChange: vi.fn(),
      }),
    );

    expect(markup).toContain('placeholder="e.g. loves dinosaurs, space, puddle jumping, arts &amp; crafts..."');
    expect(markup).toContain('value=""');
  });

  it("respects disabled prop", () => {
    const markup = renderToStaticMarkup(
      createElement(ChildInterestsField, {
        disabled: true,
        onChange: vi.fn(),
      }),
    );

    expect(markup).toContain("disabled");
  });
});
