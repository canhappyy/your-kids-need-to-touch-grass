import { z } from "zod";

import { isPlannableDate } from "@/lib/planner-dates";
import type { PlannedActivity } from "@/types/planner";

/**
 * Storage key used to persist planned activity items in the browser's localStorage.
 */
export const PLANNED_ACTIVITIES_KEY = "playgo.planned-activities.v1";

/**
 * Custom window event dispatched whenever planned activities are added, updated, or removed,
 * alerting reactive components (e.g. planner calendar view and badge counters) across the page.
 */
export const PLANNER_CHANGE_EVENT = "playgo:planner-change";

/**
 * Friendly error message displayed when a user attempts to plan an activity beyond the allowed 1-year window.
 */
export const PLANNING_WINDOW_MESSAGE =
  "Activities can only be planned up to 12 months in advance.";

/**
 * Minimal storage interface contract required for reading, writing, and clearing planned activities.
 */
export type PlannerStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

/**
 * Zod validation schema ensuring integrity of persisted planned activity records.
 */
const plannedActivitySchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  name: z.string().trim().min(1),
  plannedDate: z.iso.date(),
  createdAt: z.iso.datetime(),
  durationMinutes: z.number().int().positive(),
  missionType: z.enum(["Location-Based", "Home-Based", "Location-Agnostic"]),
  locationLabel: z.string().trim().min(1),
  instructionText: z.string().nullable().optional(),
  equipmentNeeded: z.string().nullable().optional(),
  iconFile: z.string().nullable().optional(),
});

/**
 * Dispatches a DOM event notifying any listening views that planned activities have changed.
 * Safely handles server-side rendering (SSR) environments where window is undefined.
 */
function dispatchPlannerChangeEvent(): void {
  if (typeof window === "undefined" || !window.dispatchEvent) return;
  try {
    window.dispatchEvent(new Event(PLANNER_CHANGE_EVENT));
  } catch {
    // Storage remains authoritative when an event implementation is unavailable.
  }
}

/**
 * Reads and validates the list of planned activities stored in client storage.
 *
 * Sorts activities chronologically by plannedDate, and then by createdAt timestamp.
 * Returns an empty array if no planned activities are found or storage is empty.
 *
 * @param store - Client storage backend (defaults to `window.localStorage`).
 * @returns An array of validated, sorted `PlannedActivity` records.
 */
export function readPlannedActivities(
  store: PlannerStorage = window.localStorage,
): PlannedActivity[] {
  const raw = store.getItem(PLANNED_ACTIVITIES_KEY);
  if (raw === null) return [];
  const activities = z.array(plannedActivitySchema).parse(JSON.parse(raw));
  return activities.sort(
    (a, b) =>
      a.plannedDate.localeCompare(b.plannedDate) ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

/**
 * Validates and saves a planned activity to client storage.
 *
 * Validates that the planned date falls within the 365-day planning window.
 * Avoids duplicate saves if an activity with the same unique record ID already exists.
 *
 * @param record - The planned activity item to store.
 * @param store - Client storage backend (defaults to `window.localStorage`).
 * @param now - Reference current date for planning window verification.
 * @returns True if successfully added, false if a record with the same ID already exists.
 * @throws Error if the planned date falls outside the allowed 365-day planning window.
 */
export function savePlannedActivity(
  record: PlannedActivity,
  store: PlannerStorage = window.localStorage,
  now = new Date(),
): boolean {
  const valid = plannedActivitySchema.parse(record);
  if (!isPlannableDate(valid.plannedDate, now)) {
    throw new Error(PLANNING_WINDOW_MESSAGE);
  }
  const activities = readPlannedActivities(store);
  if (activities.some((activity) => activity.id === valid.id)) return false;

  // Persist updated list and notify listeners
  store.setItem(PLANNED_ACTIVITIES_KEY, JSON.stringify([...activities, valid]));
  dispatchPlannerChangeEvent();
  return true;
}

/**
 * Removes a scheduled activity from client storage by its unique record ID.
 *
 * @param id - The unique UUID of the planned activity to delete.
 * @param store - Client storage backend (defaults to `window.localStorage`).
 * @returns True if the item was found and removed, false if not found.
 */
export function removePlannedActivity(
  id: string,
  store: PlannerStorage = window.localStorage,
): boolean {
  const activities = readPlannedActivities(store);
  const remaining = activities.filter((activity) => activity.id !== id);
  if (remaining.length === activities.length) return false;

  // Persist filtered list and notify listeners
  store.setItem(PLANNED_ACTIVITIES_KEY, JSON.stringify(remaining));
  dispatchPlannerChangeEvent();
  return true;
}
