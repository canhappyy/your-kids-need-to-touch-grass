import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readCompletedMissions,
  saveCompletedMission,
  clearCompletedMissions,
  formatCompletionDate,
  isMissionCompleted,
  HISTORY_KEY,
} from "./completed-missions";
import { REWARDS_KEY, readRewards } from "./rewards";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}
const first = {
  id: "1",
  missionId: "m1",
  name: "Park play",
  completedAt: "2026-09-12T10:00:00.000Z",
  durationMinutes: 20,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("local completion history", () => {
  it("persists repeated missions and reads newest first", () => {
    const store = storage();
    saveCompletedMission(first, store);
    saveCompletedMission(
      { ...first, id: "2", completedAt: "2026-09-13T10:00:00.000Z" },
      store,
    );
    expect(readCompletedMissions(store).map((record) => record.id)).toEqual([
      "2",
      "1",
    ]);
    expect(readCompletedMissions(store)[1]).toEqual(first);
  });
  it("makes saving the same completion id idempotent", () => {
    const store = storage();
    saveCompletedMission(first, store);
    saveCompletedMission(first, store);
    expect(readCompletedMissions(store)).toEqual([first]);
  });
  it("reconciles rewards from the full history after new completions", () => {
    const store = storage();
    const now = new Date(2026, 9, 3, 20);

    saveCompletedMission(
      { ...first, id: "today-one", completedAt: new Date(2026, 9, 3, 8).toISOString() },
      store,
      now,
    );
    saveCompletedMission(
      { ...first, id: "today-two", completedAt: new Date(2026, 9, 3, 16).toISOString() },
      store,
      now,
    );

    expect(readRewards(store)?.currentStreak).toBe(1);
  });
  it("does not reconcile or dispatch for duplicate completion ids", () => {
    const store = storage();
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });
    const now = new Date(2026, 9, 3, 20);
    const record = {
      ...first,
      id: "today",
      completedAt: new Date(2026, 9, 3, 8).toISOString(),
    };

    saveCompletedMission(record, store, now);
    saveCompletedMission(record, store, now);

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(readRewards(store)?.currentStreak).toBe(1);
  });
  it("dispatches backlog changes only after history and rewards are written", () => {
    const store = storage();
    let stateAtDispatch = null;
    let historyLengthAtDispatch = 0;
    const dispatchEvent = vi.fn(() => {
      stateAtDispatch = readRewards(store);
      historyLengthAtDispatch = readCompletedMissions(store).length;
      return true;
    });
    vi.stubGlobal("window", { dispatchEvent });

    saveCompletedMission(first, store, new Date(2026, 8, 12, 20));

    expect(stateAtDispatch).toMatchObject({ currentStreak: 1 });
    expect(historyLengthAtDispatch).toBe(1);
  });
  it("clears only history", () => {
    const store = storage();
    store.setItem("other", "keep");
    saveCompletedMission(first, store);
    clearCompletedMissions(store);
    expect(readCompletedMissions(store)).toEqual([]);
    expect(store.getItem("other")).toBe("keep");
  });
  it("clears streak dates while preserving unlocked badges", () => {
    const store = storage();
    store.setItem(
      REWARDS_KEY,
      JSON.stringify({
        currentStreak: 3,
        lastCompletedDate: "2026-10-03",
        unlockedBadgeIds: ["koala"],
      }),
    );

    clearCompletedMissions(store);

    expect(readRewards(store)).toEqual({
      currentStreak: 0,
      lastCompletedDate: null,
      unlockedBadgeIds: ["koala"],
    });
  });
  it("does not change history when reward storage is corrupt", () => {
    const store = storage();
    const originalHistory = JSON.stringify([first]);
    store.setItem(HISTORY_KEY, originalHistory);
    store.setItem(REWARDS_KEY, "{");

    expect(() =>
      saveCompletedMission(
        { ...first, id: "2" },
        store,
        new Date(2026, 8, 12, 20),
      ),
    ).toThrow();
    expect(store.getItem(HISTORY_KEY)).toBe(originalHistory);
    expect(() => clearCompletedMissions(store)).toThrow();
    expect(store.getItem(HISTORY_KEY)).toBe(originalHistory);
    expect(store.getItem(REWARDS_KEY)).toBe("{");
  });
  it("rolls history back when the reward write fails", () => {
    const store = storage();
    const baseSetItem = store.setItem;
    store.setItem(
      REWARDS_KEY,
      JSON.stringify({
        currentStreak: 1,
        lastCompletedDate: "2026-10-03",
        unlockedBadgeIds: [],
      }),
    );
    store.setItem = (key, value) => {
      if (key === REWARDS_KEY) throw new Error("Reward write blocked");
      return baseSetItem(key, value);
    };

    expect(() =>
      saveCompletedMission(
        { ...first, completedAt: new Date(2026, 9, 4, 8).toISOString() },
        store,
        new Date(2026, 9, 4, 12),
      ),
    ).toThrow("Reward write blocked");
    expect(readCompletedMissions(store)).toEqual([]);

    baseSetItem(HISTORY_KEY, JSON.stringify([first]));
    expect(() => clearCompletedMissions(store)).toThrow(
      "Reward write blocked",
    );
    expect(readCompletedMissions(store)).toEqual([first]);
  });
  it.each(["{", "{}", '[{"id":"bad"}]'])(
    "rejects corrupt history without overwriting it",
    (raw) => {
      const store = storage();
      store.setItem(HISTORY_KEY, raw);
      expect(() => readCompletedMissions(store)).toThrow();
      expect(() => saveCompletedMission(first, store)).toThrow();
      expect(store.getItem(HISTORY_KEY)).toBe(raw);
    },
  );
  it("reports blocked reads, writes and deletes", () => {
    const blocked = () => {
      throw new Error("Storage blocked");
    };
    const store = { getItem: blocked, setItem: blocked, removeItem: blocked };
    expect(() => readCompletedMissions(store)).toThrow();
    expect(() =>
      saveCompletedMission(first, { ...store, getItem: () => null }),
    ).toThrow();
    expect(() => clearCompletedMissions(store)).toThrow();
  });
  it("formats completion date with medium date and short time", () => {
    const formatted = formatCompletionDate("2026-09-13T10:30:00.000Z", "en-US");
    expect(formatted).toMatch(/Sep 13, 2026/);
  });
  it("checks if a mission is completed by missionId", () => {
    const store = storage();
    expect(isMissionCompleted("m1", store)).toBe(false);
    saveCompletedMission(first, store);
    expect(isMissionCompleted("m1", store)).toBe(true);
    expect(isMissionCompleted("other", store)).toBe(false);
  });
});
