import { z } from "zod";
import {
  dispatchBacklogChangeEvent,
  isMissionCompleted,
  readCompletedMissions,
  saveCompletedMission,
} from "@/lib/completed-missions";
import { localDateKey } from "@/lib/planner-dates";
import { readPlannedActivities } from "@/lib/planned-activities";
import type { CompletedMission } from "@/types/completed-mission";
import type { SavedActivity } from "@/types/saved-activity";

/**
 * Storage key used to persist saved activities in browser localStorage.
 */
export const SAVED_ACTIVITIES_KEY = "playgo.saved-activities.v1";

/**
 * Storage key used to track planned activities that were already transferred today.
 * Prevents re-adding a planned mission to the daily to-do list if the parent purposefully dismissed it.
 */
export const PLANNER_TRANSFERRED_KEY = "playgo.planner-transferred.v1";

/**
 * Minimal storage interface contract required for reading, writing, and clearing saved activities.
 */
type ActivityStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Zod validation schema ensuring data integrity of saved activity records.
 */
const savedActivitySchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  name: z.string().trim().min(1),
  savedAt: z.iso.datetime(),
  durationMinutes: z.number().int().positive(),
  instructionText: z.string().nullable().optional(),
  equipmentNeeded: z.string().nullable().optional(),
  childAgeRange: z.tuple([z.number().int(), z.number().int()]).optional(),
  walkingDistanceKm: z.number().nonnegative().optional(),
  varietyTags: z.array(z.string().trim().min(1)).optional(),
  socialTag: z.string().optional(),
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
  return records.sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
}

/**
 * Synchronizes saved activities for the active local day:
 * 1. Midnight clearing: purges any uncompleted saved activities saved on prior dates so parents start fresh each morning.
 * 2. If the current date has planned activities scheduled for today, promotes them into saved activities
 *    (unless already completed today, already present, or previously transferred today).
 *
 * @param now - Current clock date (defaults to `new Date()`).
 * @param store - The storage backend to synchronize.
 * @returns Array of validated `SavedActivity` records for the active date.
 */
export function syncSavedActivities(
  now = new Date(),
  store: ActivityStorage = window.localStorage,
): SavedActivity[] {
  const todayKey = localDateKey(now);
  const existing = readSavedActivities(store);

  // 1. Midnight clearing: purge any activities saved before today
  const currentDayActivities = existing.filter((item) => {
    const savedDate = new Date(item.savedAt);
    if (!Number.isFinite(savedDate.getTime())) return false;
    return localDateKey(savedDate) >= todayKey;
  });

  // 2. Read planned activities and completed missions for today
  const plannedActivities = readPlannedActivities(store);
  const completedMissions = readCompletedMissions(store);

  // Read set of previously promoted IDs to maintain idempotency
  let transferred: Record<string, string> = {};
  try {
    const raw = store.getItem(PLANNER_TRANSFERRED_KEY);
    if (raw) transferred = JSON.parse(raw);
  } catch {
    transferred = {};
  }

  // Prune transferred entries older than today to save space
  const cleanedTransferred: Record<string, string> = {};
  for (const [id, date] of Object.entries(transferred)) {
    if (date >= todayKey) {
      cleanedTransferred[id] = date;
    }
  }

  let changed = currentDayActivities.length !== existing.length;

  // 3. Promote planned activities scheduled for today
  const todayPlanned = plannedActivities.filter(
    (item) => item.plannedDate === todayKey,
  );

  for (const planned of todayPlanned) {
    // Skip if already completed today
    const isCompletedToday = completedMissions.some(
      (c) =>
        c.missionId === planned.missionId &&
        localDateKey(new Date(c.completedAt)) === todayKey,
    );
    if (isCompletedToday) continue;

    // Skip if already in the to-do list
    const isAlreadySaved = currentDayActivities.some(
      (item) => item.id === planned.id || item.missionId === planned.missionId,
    );
    if (isAlreadySaved) continue;

    // Skip if previously promoted and dismissed today
    if (cleanedTransferred[planned.id] === todayKey) continue;

    currentDayActivities.push({
      id: planned.id,
      missionId: planned.missionId,
      name: planned.name,
      savedAt: now.toISOString(),
      durationMinutes: planned.durationMinutes,
      instructionText: planned.instructionText ?? null,
      equipmentNeeded: planned.equipmentNeeded ?? null,
    });

    cleanedTransferred[planned.id] = todayKey;
    changed = true;
  }

  // Persist updated transfer records
  store.setItem(PLANNER_TRANSFERRED_KEY, JSON.stringify(cleanedTransferred));

  // If any activities were purged or added, persist changes and notify UI
  if (changed) {
    currentDayActivities.sort(
      (a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt),
    );
    store.setItem(SAVED_ACTIVITIES_KEY, JSON.stringify(currentDayActivities));
    dispatchBacklogChangeEvent();
  }

  return currentDayActivities;
}

/**
 * Checks whether an activity with the specified mission ID is currently saved.
 *
 * @param missionId - Activity mission identifier (e.g. "MIS-001").
 * @param store - Storage backend to read from.
 * @returns True if saved in client storage.
 */
export function isActivitySaved(
  missionId: string,
  store: ActivityStorage = window.localStorage,
): boolean {
  return readSavedActivities(store).some(
    (item) => item.missionId === missionId,
  );
}

/**
 * Checks whether an activity is in the backlog (either saved or completed).
 *
 * @param missionId - Activity mission identifier (e.g. "MIS-001").
 * @param store - Storage backend to read from.
 * @returns True if saved or marked completed in client storage.
 */
export function isActivityInBacklog(
  missionId: string,
  store: ActivityStorage = window.localStorage,
): boolean {
  return (
    isActivitySaved(missionId, store) || isMissionCompleted(missionId, store)
  );
}

/**
 * Validates and saves an activity to client storage.
 *
 * Allows duplicate activities for the same mission from different search results,
 * preventing only duplicate saves of the identical record ID.
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
  if (records.some((item) => item.id === valid.id)) {
    return;
  }
  store.setItem(SAVED_ACTIVITIES_KEY, JSON.stringify([...records, valid]));
  dispatchBacklogChangeEvent();
}

/**
 * Removes an activity from saved activities in client storage.
 *
 * If an exact record ID match exists, only that specific saved activity
 * is removed, preserving any duplicate saved instances.
 *
 * @param idOrMissionId - The unique item ID or mission ID to remove.
 * @param store - Storage backend to update.
 */
export function removeSavedActivity(
  idOrMissionId: string,
  store: ActivityStorage = window.localStorage,
): void {
  const records = readSavedActivities(store);
  const hasExactId = records.some((item) => item.id === idOrMissionId);
  const updated = hasExactId
    ? records.filter((item) => item.id !== idOrMissionId)
    : records.filter((item) => item.missionId !== idOrMissionId);
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
 * to completed mission history with atomic rollback on failure.
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
    (item) =>
      item.id === savedIdOrMissionId || item.missionId === savedIdOrMissionId,
  );
  if (!target) return null;

  const previousSaved = store.getItem(SAVED_ACTIVITIES_KEY);
  const remaining = records.filter((item) => item.id !== target.id);
  store.setItem(SAVED_ACTIVITIES_KEY, JSON.stringify(remaining));

  const completed: CompletedMission = {
    id: crypto.randomUUID(),
    missionId: target.missionId,
    name: target.name,
    completedAt: new Date().toISOString(),
    durationMinutes: target.durationMinutes,
    instructionText: target.instructionText ?? null,
    equipmentNeeded: target.equipmentNeeded ?? null,
    childAgeRange: target.childAgeRange,
    walkingDistanceKm: target.walkingDistanceKm,
    varietyTags: target.varietyTags,
    socialTag: target.socialTag,
  };

  try {
    saveCompletedMission(completed, store);
  } catch (error) {
    // Atomic rollback: restore saved activities if completing fails
    try {
      if (previousSaved === null) {
        store.removeItem(SAVED_ACTIVITIES_KEY);
      } else {
        store.setItem(SAVED_ACTIVITIES_KEY, previousSaved);
      }
    } catch {
      // Preserve the original completion-storage error
    }
    throw error;
  }
  return completed;
}
