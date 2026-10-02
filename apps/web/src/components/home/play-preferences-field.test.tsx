import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PlayPreferencesField } from "./play-preferences-field";

describe("PlayPreferencesField", () => {
  it("renders in-switch mode labels for playing style and supervision", () => {
    const markup = renderToStaticMarkup(
      createElement(PlayPreferencesField, {
        playStyle: "solo",
        canSupervise: false,
        onPlayStyleChange: vi.fn(),
        onSupervisionChange: vi.fn(),
      }),
    );

    expect(markup).toContain("Play preferences");
    expect(markup).toContain("Playing style");
    expect(markup).toContain("Solo");
    expect(markup).toContain("Group");
    expect(markup).toContain("Supervision");
    expect(markup).toContain("Independent");
    expect(markup).toContain("Supervised");
  });

  it("checks the active mode based on playStyle and canSupervise props", () => {
    const markupDefault = renderToStaticMarkup(
      createElement(PlayPreferencesField, {
        playStyle: "solo",
        canSupervise: false,
        onPlayStyleChange: vi.fn(),
        onSupervisionChange: vi.fn(),
      }),
    );

    // Solo and Independent should be checked
    expect(markupDefault).toContain('checked="" value="solo"');
    expect(markupDefault).toContain('checked="" value="independent"');

    const markupAlt = renderToStaticMarkup(
      createElement(PlayPreferencesField, {
        playStyle: "group",
        canSupervise: true,
        onPlayStyleChange: vi.fn(),
        onSupervisionChange: vi.fn(),
      }),
    );

    // Group and Supervised should be checked
    expect(markupAlt).toContain('checked="" value="group"');
    expect(markupAlt).toContain('checked="" value="supervised"');
  });

  it("animates the sliding indicator pill based on active option", () => {
    const markupDefault = renderToStaticMarkup(
      createElement(PlayPreferencesField, {
        playStyle: "solo",
        canSupervise: false,
        onPlayStyleChange: vi.fn(),
        onSupervisionChange: vi.fn(),
      }),
    );

    // Indicator should be at translate-x-0 for both solo and independent
    expect(markupDefault).toContain("translate-x-0");
    expect(markupDefault).toContain("duration-300");

    const markupAlt = renderToStaticMarkup(
      createElement(PlayPreferencesField, {
        playStyle: "group",
        canSupervise: true,
        onPlayStyleChange: vi.fn(),
        onSupervisionChange: vi.fn(),
      }),
    );

    // Indicator should be at translate-x-full for group and supervised
    expect(markupAlt).toContain("translate-x-full");
  });
});
