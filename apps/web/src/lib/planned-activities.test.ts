import { describe, expect, it } from "vitest";

import type { PlannedActivity } from "@/types/planner";
import {
  PLANNED_ACTIVITIES_KEY,
  PLANNING_WINDOW_MESSAGE,
  readPlannedActivities,
  removePlannedActivity,
  savePlannedActivity,
} from "./planned-activities";

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

function activity(id: string, plannedDate = "2026-10-04"): PlannedActivity {
  return {
    id,
    missionId: `mission-${id}`,
    name: `Activity ${id}`,
    plannedDate,
    createdAt: "2026-10-04T01:00:00.000Z",
    durationMinutes: 45,
    missionType: "Home-Based",
    locationLabel: "At home",
  };
}

describe("planned activity storage", () => {
  const now = new Date(2026, 9, 4, 12);

  it("starts empty and persists multiple missions on one date", () => {
    const store = storage();
    expect(readPlannedActivities(store)).toEqual([]);

    expect(savePlannedActivity(activity("one"), store, now)).toBe(true);
    expect(savePlannedActivity(activity("two"), store, now)).toBe(true);
    expect(readPlannedActivities(store).map((item) => item.id)).toEqual([
      "one",
      "two",
    ]);
  });

  it("does not add the same record ID twice", () => {
    const store = storage();
    expect(savePlannedActivity(activity("one"), store, now)).toBe(true);
    expect(savePlannedActivity(activity("one"), store, now)).toBe(false);
    expect(readPlannedActivities(store)).toHaveLength(1);
  });

  it("accepts exactly 12 months and rejects dates outside the window", () => {
    const store = storage();
    expect(
      savePlannedActivity(activity("boundary", "2027-10-04"), store, now),
    ).toBe(true);
    expect(() =>
      savePlannedActivity(activity("past", "2026-10-03"), store, now),
    ).toThrow(PLANNING_WINDOW_MESSAGE);
    expect(() =>
      savePlannedActivity(activity("future", "2027-10-05"), store, now),
    ).toThrow(PLANNING_WINDOW_MESSAGE);
  });

  it("removes a planned activity immediately", () => {
    const store = storage();
    savePlannedActivity(activity("one"), store, now);
    savePlannedActivity(activity("two"), store, now);

    expect(removePlannedActivity("one", store)).toBe(true);
    expect(readPlannedActivities(store).map((item) => item.id)).toEqual([
      "two",
    ]);
    expect(removePlannedActivity("missing", store)).toBe(false);
  });

  it.each(["{", "{}", '[{"id":"broken"}]'])(
    "rejects corrupt storage without overwriting it",
    (raw) => {
      const store = storage({ [PLANNED_ACTIVITIES_KEY]: raw });
      expect(() => readPlannedActivities(store)).toThrow();
      expect(store.getItem(PLANNED_ACTIVITIES_KEY)).toBe(raw);
    },
  );

  it("reports blocked storage writes", () => {
    const store = storage();
    store.setItem = () => {
      throw new Error("Storage blocked");
    };
    expect(() => savePlannedActivity(activity("one"), store, now)).toThrow(
      "Storage blocked",
    );
  });
});
