import { describe, expect, it } from "vitest";

import { chainReducer, initialChainState } from "./chained-mission";

const recommendation = {
  missionId: "MIS-002",
  title: "Second Mission",
} as never;

describe("chainReducer", () => {
  it("moves through loading and loaded states", () => {
    const loading = chainReducer(initialChainState, { type: "start" });
    expect(loading).toEqual({ status: "loading" });
    expect(
      chainReducer(loading, { type: "success", recommendation }),
    ).toEqual({ status: "loaded", recommendation });
  });

  it("ignores another start while a request is loading", () => {
    const loading = { status: "loading" as const };
    expect(chainReducer(loading, { type: "start" })).toBe(loading);
  });

  it("represents unavailable and request error separately", () => {
    expect(chainReducer(initialChainState, { type: "unavailable" })).toEqual({
      status: "unavailable",
    });
    expect(chainReducer(initialChainState, { type: "failure" })).toEqual({
      status: "error",
    });
  });

  it("resets loaded state when the primary mission changes", () => {
    expect(
      chainReducer(
        { status: "loaded", recommendation },
        { type: "reset" },
      ),
    ).toEqual(initialChainState);
  });
});
