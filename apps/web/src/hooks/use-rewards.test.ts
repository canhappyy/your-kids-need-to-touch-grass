import { afterEach, describe, expect, it, vi } from "vitest";
import { HISTORY_KEY } from "@/lib/completed-missions";
import { readRewards } from "@/lib/rewards";
import { synchronizeRewards } from "./use-rewards";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("reward synchronization", () => {
  it("uses the current clock time instead of a dashboard mount snapshot", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 3, 13));
    const store = storage();
    store.setItem(
      HISTORY_KEY,
      JSON.stringify([
        {
          id: "noon",
          missionId: "mission-noon",
          name: "Noon activity",
          completedAt: new Date(2026, 9, 3, 12).toISOString(),
          durationMinutes: 15,
        },
      ]),
    );

    synchronizeRewards(store);

    expect(readRewards(store)?.currentStreak).toBe(1);
  });
});
