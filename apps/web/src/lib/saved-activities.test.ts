import { describe, expect, it } from "vitest";
import {
  clearSavedActivities,
  isActivitySaved,
  moveSavedToCompleted,
  readSavedActivities,
  removeSavedActivity,
  saveActivity,
  SAVED_ACTIVITIES_KEY,
} from "./saved-activities";
import { readCompletedMissions } from "./completed-missions";
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

  it("prevents duplicate saves with same mission ID", () => {
    const storage = createMockStorage();
    saveActivity(sampleActivity, storage);
    saveActivity({ ...sampleActivity, id: "save-2" }, storage);

    expect(readSavedActivities(storage)).toHaveLength(1);
  });

  it("removes a saved activity by ID", () => {
    const storage = createMockStorage();
    saveActivity(sampleActivity, storage);
    removeSavedActivity("save-1", storage);

    expect(readSavedActivities(storage)).toEqual([]);
    expect(isActivitySaved("MIS-001", storage)).toBe(false);
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
});
