import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useSpeciesBadges } from "./use-species-badges";

describe("useSpeciesBadges", () => {
  it("initializes with default milestone badges", () => {
    let result!: ReturnType<typeof useSpeciesBadges>;

    function Probe() {
      result = useSpeciesBadges();
      return null;
    }

    renderToStaticMarkup(createElement(Probe));

    expect(result.badges).toHaveLength(4);
    expect(result.loading).toBe(true);
  });
});
