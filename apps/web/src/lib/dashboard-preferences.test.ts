import { describe, expect, it } from "vitest";
import {
  DASHBOARD_SECTIONS_KEY,
  DASHBOARD_SEEN_BADGES_KEY,
  mergeSeenBadgeIds,
  readDashboardSections,
  readSeenBadgeIds,
  writeDashboardSections,
  writeSeenBadgeIds,
} from "./dashboard-preferences";

function memoryStore(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("dashboard presentation preferences", () => {
  it("stays safe when browser storage is unavailable", () => {
    expect(readDashboardSections()).toEqual({
      rewardBadges: false,
      favouriteActivities: false,
      nationalGuidelines: false,
    });
    expect(readSeenBadgeIds()).toEqual([]);
    expect(() =>
      writeDashboardSections({
        rewardBadges: false,
        favouriteActivities: false,
        nationalGuidelines: false,
      }),
    ).not.toThrow();
    expect(() => writeSeenBadgeIds([])).not.toThrow();
  });

  it("defaults every disclosure to collapsed", () => {
    expect(readDashboardSections(memoryStore())).toEqual({
      rewardBadges: false,
      favouriteActivities: false,
      nationalGuidelines: false,
    });
  });

  it("persists independent disclosure state for the browser session", () => {
    const store = memoryStore();
    const state = {
      rewardBadges: true,
      favouriteActivities: false,
      nationalGuidelines: true,
    };

    writeDashboardSections(state, store);

    expect(readDashboardSections(store)).toEqual(state);
    expect(store.getItem(DASHBOARD_SECTIONS_KEY)).toBe(JSON.stringify(state));
  });

  it("uses collapsed defaults when section storage is corrupt", () => {
    const store = memoryStore({ [DASHBOARD_SECTIONS_KEY]: "{broken" });

    expect(readDashboardSections(store)).toEqual({
      rewardBadges: false,
      favouriteActivities: false,
      nationalGuidelines: false,
    });
  });

  it("persists acknowledged badges and safely resets corrupt state", () => {
    const store = memoryStore();
    writeSeenBadgeIds(["koala", "kangaroo", "koala"], store);
    expect(readSeenBadgeIds(store)).toEqual(["koala", "kangaroo"]);
    expect(store.getItem(DASHBOARD_SEEN_BADGES_KEY)).toBe(
      JSON.stringify(["koala", "kangaroo"]),
    );

    expect(
      readSeenBadgeIds(
        memoryStore({ [DASHBOARD_SEEN_BADGES_KEY]: JSON.stringify([42]) }),
      ),
    ).toEqual([]);
  });

  it("merges newly earned badges without removing prior acknowledgements", () => {
    expect(mergeSeenBadgeIds(["koala"], ["koala", "kangaroo"])).toEqual([
      "koala",
      "kangaroo",
    ]);
  });
});
