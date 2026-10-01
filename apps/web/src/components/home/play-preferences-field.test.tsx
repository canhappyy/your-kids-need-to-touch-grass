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
});
