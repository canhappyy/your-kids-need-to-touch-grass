import { z } from "zod";
import {
  readRewards,
  reconcileRewards,
  resetRewardStreak,
} from "@/lib/rewards";
import type { CompletedMission } from "@/types/completed-mission";

/**
 * Storage key used to persist completed mission records in the browser's localStorage.
 */
export const HISTORY_KEY = "playgo.completed-missions.v1";

/**
 * Minimal storage interface contract required for reading, writing, and clearing mission history.
 */
type HistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Window event name fired whenever an activity is completed, saved, or removed.
 * Listened to by navigation bars, headers, and dashboard counters to refresh badges in real time.
 */
export const BACKLOG_CHANGE_EVENT = "playgo:backlog-change";

/**
 * Restores a previous raw history string to storage.
 * Used as an atomic rollback mechanism if a subsequent step (such as reward calculation) fails.
 *
 * @param raw - Previous JSON string stored in localStorage, or null if key did not exist.
 * @param store - The storage backend to restore into.
 */
function restoreHistory(raw: string | null, store: HistoryStorage): void {
  if (raw === null) {
    store.removeItem(HISTORY_KEY);
  } else {
    store.setItem(HISTORY_KEY, raw);
  }
}

/**
 * Dispatches a DOM event notifying any open views that activity backlog/history has changed.
 * Safely guards against server-side rendering (SSR) environments where window is undefined.
 */
export function dispatchBacklogChangeEvent(): void {
  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function"
  ) {
    try {
      window.dispatchEvent(new Event(BACKLOG_CHANGE_EVENT));
    } catch {
      // Discard errors if browser environment restricts event dispatching
    }
  }
}

/**
 * Zod validation schema ensuring data integrity of completed mission records.
 */
const recordSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  name: z.string().trim().min(1),
  completedAt: z.iso.datetime(),
  durationMinutes: z.number().int().positive(),
  instructionText: z.string().nullable().optional(),
  equipmentNeeded: z.string().nullable().optional(),
  childAgeRange: z.tuple([z.number().int(), z.number().int()]).optional(),
  walkingDistanceKm: z.number().nonnegative().optional(),
  varietyTags: z.array(z.string().trim().min(1)).optional(),
  socialTag: z.string().trim().min(1).optional(),
});

/**
 * Reads and validates the list of completed missions stored in client storage.
 *
 * Automatically sorts records in descending chronological order (most recently completed first).
 * If no history exists, returns an empty array.
 *
 * @param store - The storage backend to read from (defaults to `window.localStorage`).
 * @returns An array of validated `CompletedMission` objects sorted by completion time.
 */
export function readCompletedMissions(
  store: HistoryStorage = window.localStorage,
): CompletedMission[] {
  const raw = store.getItem(HISTORY_KEY);
  if (raw === null) return [];
  const records = z.array(recordSchema).parse(JSON.parse(raw));
  return records.sort(
    (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt),
  );
}

/**
 * Checks whether a mission with the specified ID has ever been marked as completed.
 *
 * @param missionId - Mission identifier (e.g. "MIS-001").
 * @param store - Storage backend to read from (defaults to `window.localStorage`).
 * @returns True if already recorded in completed missions, false otherwise.
 */
export function isMissionCompleted(
  missionId: string,
  store: HistoryStorage = window.localStorage,
): boolean {
  return readCompletedMissions(store).some(
    (item) => item.missionId === missionId,
  );
}

/**
 * Validates and appends a newly completed mission to client storage.
 *
 * Steps:
 * 1. Validates the mission schema with Zod.
 * 2. Checks for duplicates by ID to prevent repeated insertions.
 * 3. Appends the record and saves to localStorage.
 * 4. Reconciles streak counters and unlocks any newly earned animal species badges.
 * 5. If reward reconciliation fails, rolls back the saved history to avoid corrupted state.
 * 6. Dispatches a backlog change event so all components update immediately.
 *
 * @param record - The completed mission record to store.
 * @param store - The storage backend to write to (defaults to `window.localStorage`).
 * @param now - Current local date used to reconcile streak rewards.
 */
export function saveCompletedMission(
  record: CompletedMission,
  store: HistoryStorage = window.localStorage,
  now = new Date(),
): void {
  // Validate incoming record shape
  const valid = recordSchema.parse(record);
  const records = readCompletedMissions(store);

  // Prevent duplicate insertion if already recorded
  if (records.some((item) => item.id === valid.id)) return;

  const previousHistory = store.getItem(HISTORY_KEY);
  readRewards(store);
  const updatedRecords = [...records, valid];
  store.setItem(HISTORY_KEY, JSON.stringify(updatedRecords));

  try {
    // Reconcile gamification streak and check milestone unlocks
    reconcileRewards(updatedRecords, now, store);
  } catch (error) {
    // Atomic rollback: restore previous history if rewards reconciliation fails
    try {
      restoreHistory(previousHistory, store);
    } catch {
      // Preserve the original reward-storage error
    }
    throw error;
  }

  // Notify UI of updated history
  dispatchBacklogChangeEvent();
}

/**
 * Clears all completed mission history from client storage and resets streaks.
 *
 * If resetting rewards fails, rolls back the cleared history to maintain data integrity.
 *
 * @param store - The storage backend to clear (defaults to `window.localStorage`).
 */
export function clearCompletedMissions(
  store: HistoryStorage = window.localStorage,
): void {
  const previousHistory = store.getItem(HISTORY_KEY);
  readRewards(store);
  store.removeItem(HISTORY_KEY);

  try {
    // Reset active streak while preserving earned badges
    resetRewardStreak(store);
  } catch (error) {
    // Rollback if streak reset fails
    try {
      restoreHistory(previousHistory, store);
    } catch {
      // Preserve original error
    }
    throw error;
  }

  // Notify UI that history has been cleared
  dispatchBacklogChangeEvent();
}

/**
 * Formats an ISO 8601 completion date string into a user-friendly, localized date and time label.
 *
 * @param completedAt - ISO 8601 timestamp string (e.g. "2026-09-13T10:30:00Z").
 * @param locale - Optional BCP 47 locale tag (e.g. "en-AU"). Defaults to runtime system locale.
 * @returns Formatted date and time string (e.g. "13 Sept 2026, 10:30 am").
 */
export function formatCompletionDate(
  completedAt: string,
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(completedAt));
}
