import { describe, expect, it } from "vitest";
import { playPreferenceParams, readPlayPreferences } from "./play-preferences";

describe("play preferences", () => {
  it("defaults older URLs to solo without supervision", () => {
    expect(readPlayPreferences(new URLSearchParams())).toEqual({
      playStyle: "solo",
      canSupervise: false,
    });
  });

  it.each([true, false])(
    "preserves group preference and supervision %s",
    (canSupervise) => {
      const values = { playStyle: "group" as const, canSupervise };
      expect(
        readPlayPreferences(new URLSearchParams(playPreferenceParams(values))),
      ).toEqual(values);
    },
  );
});
