import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearSavedActivities,
  isActivityInBacklog,
  isActivitySaved,
  moveSavedToCompleted,
  readSavedActivities,
  removeSavedActivity,
  saveActivity,
} from "./saved-activities";
import { readCompletedMissions } from "./completed-missions";
import { readRewards } from "./rewards";
import type { SavedActivity } from "@/types/saved-activity";

function createMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  };
}

const sampleActivity: SavedActivity = {
  id: "save-1",
  missionId: "MIS-001",
  name: "Nature Scavenger Hunt",
  savedAt: "2026-10-03T10:00:00.000Z",
  durationMinutes: 30,
  instructionText: "Find 3 leaves",
  equipmentNeeded: "Bag|pencil",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("saved-activities", () => {
  it("reads empty list when storage is empty", () => {
    const storage = createMockStorage();
    expect(readSavedActivities(storage)).toEqual([]);
  });

  it("saves an activity and reads it back", () => {
    const storage = createMockStorage();
    saveActivity(sampleActivity, storage);

    expect(isActivitySaved("MIS-001", storage)).toBe(true);
    const records = readSavedActivities(storage);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      missionId: "MIS-001",
      name: "Nature Scavenger Hunt",
      durationMinutes: 30,
      instructionText: "Find 3 leaves",
      equipmentNeeded: "Bag|pencil",
    });
  });

  it("allows duplicate saves with same mission ID and distinct record IDs", () => {
    const storage = createMockStorage();
    saveActivity(sampleActivity, storage);
    saveActivity({ ...sampleActivity, id: "save-2" }, storage);

    expect(readSavedActivities(storage)).toHaveLength(2);
  });

  it("prevents saving duplicate record with identical record ID", () => {
    const storage = createMockStorage();
    saveActivity(sampleActivity, storage);
    saveActivity(sampleActivity, storage);

    expect(readSavedActivities(storage)).toHaveLength(1);
  });

  it("removes a saved activity by ID", () => {
    const storage = createMockStorage();
    saveActivity(sampleActivity, storage);
    removeSavedActivity("save-1", storage);

    expect(readSavedActivities(storage)).toEqual([]);
    expect(isActivitySaved("MIS-001", storage)).toBe(false);
  });

  it("removes a specific saved activity instance without removing other duplicates", () => {
    const storage = createMockStorage();
    saveActivity(sampleActivity, storage);
    saveActivity({ ...sampleActivity, id: "save-2" }, storage);

    removeSavedActivity("save-1", storage);
    const remaining = readSavedActivities(storage);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe("save-2");
    expect(isActivitySaved("MIS-001", storage)).toBe(true);
  });

  it("clears all saved activities", () => {
    const storage = createMockStorage();
    saveActivity(sampleActivity, storage);
    clearSavedActivities(storage);

    expect(readSavedActivities(storage)).toEqual([]);
  });

  it("moves a saved activity to completed activities", () => {
    const storage = createMockStorage();
    saveActivity(sampleActivity, storage);

    const completed = moveSavedToCompleted("save-1", storage);
    expect(completed).not.toBeNull();
    expect(completed?.missionId).toBe("MIS-001");
    expect(completed?.name).toBe("Nature Scavenger Hunt");
    expect(completed?.instructionText).toBe("Find 3 leaves");
    expect(completed?.equipmentNeeded).toBe("Bag|pencil");

    // It should now be gone from saved activities
    expect(readSavedActivities(storage)).toEqual([]);
    expect(isActivitySaved("MIS-001", storage)).toBe(false);

    // It should now exist in completed missions
    const completedMissions = readCompletedMissions(storage);
    expect(completedMissions).toHaveLength(1);
    expect(completedMissions[0]?.missionId).toBe("MIS-001");
    expect(completedMissions[0]?.name).toBe("Nature Scavenger Hunt");
  });

  it("dispatches once after saved, completed, and reward writes finish", () => {
    const storage = createMockStorage();
    saveActivity(sampleActivity, storage);
    let stateAtDispatch: {
      saved: number;
      completed: number;
      streak: number | undefined;
    } | null = null;
    const dispatchEvent = vi.fn(() => {
      stateAtDispatch = {
        saved: readSavedActivities(storage).length,
        completed: readCompletedMissions(storage).length,
        streak: readRewards(storage)?.currentStreak,
      };
      return true;
    });
    vi.stubGlobal("window", { dispatchEvent });

    moveSavedToCompleted("save-1", storage);

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(stateAtDispatch).toEqual({ saved: 0, completed: 1, streak: 1 });
  });

  it("identifies activity as in backlog if either saved or completed", () => {
    const storage = createMockStorage();
    expect(isActivityInBacklog("MIS-001", storage)).toBe(false);

    // 1. Saved
    saveActivity(sampleActivity, storage);
    expect(isActivityInBacklog("MIS-001", storage)).toBe(true);

    // 2. Moved to completed
    moveSavedToCompleted("save-1", storage);
    expect(isActivityInBacklog("MIS-001", storage)).toBe(true);

    // 3. Removed from both
    clearSavedActivities(storage);
    expect(isActivityInBacklog("MIS-001", storage)).toBe(true); // still in completed!
  });
});
