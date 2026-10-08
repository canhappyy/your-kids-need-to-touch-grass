import { describe, expect, it } from "vitest";
import type { CompletedMission } from "@/types/completed-mission";
import {
  MILESTONE_BADGES,
  REWARDS_KEY,
  readRewards,
  reconcileRewards,
  resetRewardStreak,
} from "./rewards";

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

function mission(id: string, completedAt: Date): CompletedMission {
  return {
    id,
    missionId: `mission-${id}`,
    name: `Activity ${id}`,
    completedAt: completedAt.toISOString(),
    durationMinutes: 15,
  };
}

describe("activity streak rewards", () => {
  it("initializes and reloads an empty persisted reward state", () => {
    const store = storage();
    const state = reconcileRewards([], new Date(2026, 9, 3, 12), store);

    expect(state).toEqual({
      currentStreak: 0,
      lastCompletedDate: null,
      unlockedBadgeIds: [],
    });
    expect(readRewards(store)).toEqual(state);
  });

  it("counts one day for repeated same-day completions", () => {
    const store = storage();
    const state = reconcileRewards(
      [
        mission("morning", new Date(2026, 9, 3, 8)),
        mission("afternoon", new Date(2026, 9, 3, 16)),
      ],
      new Date(2026, 9, 3, 20),
      store,
    );

    expect(state).toMatchObject({
      currentStreak: 1,
      lastCompletedDate: "2026-10-03",
    });
  });

  it("handles consecutive local days across month, year, and DST boundaries", () => {
    const cases = [
      [new Date(2026, 8, 30, 23), new Date(2026, 9, 1, 1)],
      [new Date(2026, 11, 31, 23), new Date(2027, 0, 1, 1)],
      [new Date(2026, 9, 3, 23), new Date(2026, 9, 4, 1)],
    ];

    for (const [first, second] of cases) {
      const state = reconcileRewards(
        [mission("first", first), mission("second", second)],
        new Date(second.getFullYear(), second.getMonth(), second.getDate(), 12),
        storage(),
      );
      expect(state.currentStreak).toBe(2);
    }
  });

  it("keeps yesterday active then resets after a full inactive day", () => {
    const records = [mission("latest", new Date(2026, 9, 2, 10))];

    expect(
      reconcileRewards(records, new Date(2026, 9, 3, 12), storage())
        .currentStreak,
    ).toBe(1);
    expect(
      reconcileRewards(records, new Date(2026, 9, 4, 0, 1), storage())
        .currentStreak,
    ).toBe(0);
  });

  it("backfills every crossed wildlife milestone from historical streaks", () => {
    const records = Array.from({ length: 14 }, (_, index) =>
      mission(`day-${index}`, new Date(2026, 8, 20 + index, 12)),
    );
    const state = reconcileRewards(
      records,
      new Date(2026, 9, 3, 18),
      storage(),
    );

    expect(state.currentStreak).toBe(14);
    expect(state.unlockedBadgeIds).toEqual(
      MILESTONE_BADGES.map((badge) => badge.id),
    );
  });

  it("unlocks database badges for activity metrics", () => {
    const records = [
      {
        ...mission("one", new Date(2026, 9, 3, 8)),
        durationMinutes: 30,
        varietyTags: ["Creativity"],
        socialTag: "Family",
      },
      {
        ...mission("two", new Date(2026, 9, 3, 10)),
        durationMinutes: 30,
      },
    ];
    const badges = [
      { id: "duration", milestoneDays: 0, speciesName: "A", icon: "", ruleType: "first_matching_activity", ruleField: "duration_minutes", ruleOperator: "gte", ruleValue: "30" },
      { id: "total", milestoneDays: 0, speciesName: "B", icon: "", ruleType: "total_completed", ruleOperator: "gte", ruleValue: "2" },
      { id: "daily", milestoneDays: 0, speciesName: "C", icon: "", ruleType: "completed_in_one_day", ruleOperator: "gte", ruleValue: "2" },
      { id: "variety", milestoneDays: 0, speciesName: "D", icon: "", ruleType: "first_matching_activity", ruleField: "variety_tags", ruleOperator: "contains", ruleValue: "creativity" },
      { id: "social", milestoneDays: 0, speciesName: "E", icon: "", ruleType: "first_matching_activity", ruleField: "social_tag", ruleOperator: "equals", ruleValue: "family" },
    ];

    const state = reconcileRewards(
      records,
      new Date(2026, 9, 3, 12),
      storage(),
      badges,
    );

    expect(state.unlockedBadgeIds).toEqual(
      badges.map((badge) => badge.id),
    );
  });

  it("keeps unlocked badges after a later gap and history clear", () => {
    const store = storage();
    const records = Array.from({ length: 3 }, (_, index) =>
      mission(`day-${index}`, new Date(2026, 8, 1 + index, 12)),
    );
    reconcileRewards(records, new Date(2026, 8, 3, 18), store);

    const afterGap = reconcileRewards([], new Date(2026, 9, 3, 12), store);
    expect(afterGap).toEqual({
      currentStreak: 0,
      lastCompletedDate: null,
      unlockedBadgeIds: ["koala"],
    });
    expect(resetRewardStreak(store)).toEqual(afterGap);
  });

  it.each(["{", "{}", '{"currentStreak":-1}'])(
    "rejects corrupt storage without overwriting it",
    (raw) => {
      const store = storage({ [REWARDS_KEY]: raw });

      expect(() => readRewards(store)).toThrow();
      expect(() => reconcileRewards([], new Date(2026, 9, 3), store)).toThrow();
      expect(store.getItem(REWARDS_KEY)).toBe(raw);
    },
  );

  it("reports blocked storage writes", () => {
    const blocked = storage();
    blocked.setItem = () => {
      throw new Error("Storage blocked");
    };

    expect(() =>
      reconcileRewards([], new Date(2026, 9, 3), blocked),
    ).toThrow("Storage blocked");
  });

  it("does not rewrite unchanged state during synchronization", () => {
    const store = storage();
    const originalSetItem = store.setItem;
    let writes = 0;
    store.setItem = (key, value) => {
      writes += 1;
      return originalSetItem(key, value);
    };
    const now = new Date(2026, 9, 3, 12);

    reconcileRewards([], now, store);
    reconcileRewards([], now, store);

    expect(writes).toBe(1);
  });
});
