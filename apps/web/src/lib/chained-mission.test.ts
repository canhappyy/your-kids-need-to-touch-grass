import { describe, expect, it } from "vitest";

import {
  chainReducer,
  getChainPairKey,
  initialChainState,
  shouldReplayChain,
} from "./chained-mission";

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

describe("chain replay", () => {
  it("waits for the primary mission selected by the URL", () => {
    expect(
      shouldReplayChain({
        selectedPrimaryMissionId: "MIS-A",
        selectedSecondaryMissionId: "MIS-B",
        recommendationMissionId: "MIS-C",
        currentPairKey: null,
      }),
    ).toBe(false);
  });

  it("loads each primary-secondary pair once", () => {
    const pairKey = getChainPairKey("MIS-A", "MIS-B");
    const input = {
      selectedPrimaryMissionId: "MIS-A",
      selectedSecondaryMissionId: "MIS-B",
      recommendationMissionId: "MIS-A",
    };

    expect(shouldReplayChain({ ...input, currentPairKey: null })).toBe(true);
    expect(shouldReplayChain({ ...input, currentPairKey: pairKey })).toBe(false);
  });
});
