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

type HistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const BACKLOG_CHANGE_EVENT = "playgo:backlog-change";

function restoreHistory(raw: string | null, store: HistoryStorage): void {
  if (raw === null) {
    store.removeItem(HISTORY_KEY);
  } else {
    store.setItem(HISTORY_KEY, raw);
  }
}

export function dispatchBacklogChangeEvent(): void {
  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function"
  ) {
    try {
      window.dispatchEvent(new Event(BACKLOG_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }
}

const recordSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  name: z.string().trim().min(1),
  completedAt: z.iso.datetime(),
  durationMinutes: z.number().int().positive(),
  instructionText: z.string().nullable().optional(),
  equipmentNeeded: z.string().nullable().optional(),
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
 * Checks whether a mission with the specified ID has been completed.
 *
 * @param missionId - Mission identifier.
 * @param store - Storage backend to read from.
 * @returns True if already recorded in completed missions.
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
 * Avoids duplicate entries if a record with the same unique `id` already exists.
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
  const valid = recordSchema.parse(record);
  const records = readCompletedMissions(store);
  if (records.some((item) => item.id === valid.id)) return;
  const previousHistory = store.getItem(HISTORY_KEY);
  readRewards(store);
  const updatedRecords = [...records, valid];
  store.setItem(HISTORY_KEY, JSON.stringify(updatedRecords));
  try {
    reconcileRewards(updatedRecords, now, store);
  } catch (error) {
    try {
      restoreHistory(previousHistory, store);
    } catch {
      // Preserve the original reward-storage error.
    }
    throw error;
  }
  dispatchBacklogChangeEvent();
}

/**
 * Clears all completed mission history from client storage.
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
    resetRewardStreak(store);
  } catch (error) {
    try {
      restoreHistory(previousHistory, store);
    } catch {
      // Preserve the original reward-storage error.
    }
    throw error;
  }
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
