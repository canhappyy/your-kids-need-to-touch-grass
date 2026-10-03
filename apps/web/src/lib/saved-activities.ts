import { z } from "zod";
import {
  dispatchBacklogChangeEvent,
  saveCompletedMission,
} from "@/lib/completed-missions";
import type { CompletedMission } from "@/types/completed-mission";
import type { SavedActivity } from "@/types/saved-activity";

/**
 * Storage key used to persist saved activities in browser localStorage.
 */
export const SAVED_ACTIVITIES_KEY = "playgo.saved-activities.v1";

type ActivityStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const savedActivitySchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  name: z.string().trim().min(1),
  savedAt: z.iso.datetime(),
  durationMinutes: z.number().int().positive(),
  instructionText: z.string().nullable().optional(),
  equipmentNeeded: z.string().nullable().optional(),
});

/**
 * Reads and validates the list of saved activities stored in client storage.
 *
 * Automatically sorts records in descending chronological order (most recently saved first).
 * If no saved activities exist, returns an empty array.
 *
 * @param store - The storage backend to read from (defaults to `window.localStorage`).
 * @returns An array of validated `SavedActivity` objects.
 */
export function readSavedActivities(
  store: ActivityStorage = window.localStorage,
): SavedActivity[] {
  const raw = store.getItem(SAVED_ACTIVITIES_KEY);
  if (raw === null) return [];
  const records = z.array(savedActivitySchema).parse(JSON.parse(raw));
  return records.sort(
    (a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt),
  );
}

/**
 * Checks whether an activity with the specified mission ID is already saved.
 *
 * @param missionId - Activity mission identifier (e.g. "MIS-001").
 * @param store - Storage backend to read from.
 * @returns True if already saved in client storage.
 */
export function isActivitySaved(
  missionId: string,
  store: ActivityStorage = window.localStorage,
): boolean {
  return readSavedActivities(store).some((item) => item.missionId === missionId);
}

/**
 * Validates and saves an activity to client storage.
 * Avoids duplicate entries if the activity is already saved.
 *
 * @param activity - The activity record to save.
 * @param store - Storage backend to write to.
 */
export function saveActivity(
  activity: SavedActivity,
  store: ActivityStorage = window.localStorage,
): void {
  const valid = savedActivitySchema.parse(activity);
  const records = readSavedActivities(store);
  if (records.some((item) => item.missionId === valid.missionId || item.id === valid.id)) {
    return;
  }
  store.setItem(SAVED_ACTIVITIES_KEY, JSON.stringify([...records, valid]));
  dispatchBacklogChangeEvent();
}

/**
 * Removes an activity from saved activities in client storage.
 *
 * @param idOrMissionId - The unique item ID or mission ID to remove.
 * @param store - Storage backend to update.
 */
export function removeSavedActivity(
  idOrMissionId: string,
  store: ActivityStorage = window.localStorage,
): void {
  const records = readSavedActivities(store);
  const updated = records.filter(
    (item) => item.id !== idOrMissionId && item.missionId !== idOrMissionId,
  );
  store.setItem(SAVED_ACTIVITIES_KEY, JSON.stringify(updated));
  dispatchBacklogChangeEvent();
}

/**
 * Clears all saved activities from client storage.
 *
 * @param store - Storage backend to clear.
 */
export function clearSavedActivities(
  store: ActivityStorage = window.localStorage,
): void {
  store.removeItem(SAVED_ACTIVITIES_KEY);
  dispatchBacklogChangeEvent();
}

/**
 * Moves a saved activity to the completed activities section.
 *
 * Removes it from saved activities and appends a corresponding record
 * to completed mission history.
 *
 * @param savedIdOrMissionId - Unique record ID or mission ID of the saved activity.
 * @param store - Storage backend to update.
 * @returns The newly created `CompletedMission`, or null if the saved record was not found.
 */
export function moveSavedToCompleted(
  savedIdOrMissionId: string,
  store: ActivityStorage = window.localStorage,
): CompletedMission | null {
  const records = readSavedActivities(store);
  const target = records.find(
    (item) => item.id === savedIdOrMissionId || item.missionId === savedIdOrMissionId,
  );
  if (!target) return null;

  removeSavedActivity(target.id, store);

  const completed: CompletedMission = {
    id: crypto.randomUUID(),
    missionId: target.missionId,
    name: target.name,
    completedAt: new Date().toISOString(),
    durationMinutes: target.durationMinutes,
    instructionText: target.instructionText ?? null,
    equipmentNeeded: target.equipmentNeeded ?? null,
  };

  saveCompletedMission(completed, store);
  return completed;
}
