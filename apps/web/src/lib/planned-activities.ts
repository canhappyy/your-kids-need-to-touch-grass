import { z } from "zod";

import { isPlannableDate } from "@/lib/planner-dates";
import type { PlannedActivity } from "@/types/planner";

export const PLANNED_ACTIVITIES_KEY = "playgo.planned-activities.v1";
export const PLANNER_CHANGE_EVENT = "playgo:planner-change";
export const PLANNING_WINDOW_MESSAGE =
  "Activities can only be planned up to 365 days in advance.";

export type PlannerStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

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

function dispatchPlannerChangeEvent(): void {
  if (typeof window === "undefined" || !window.dispatchEvent) return;
  try {
    window.dispatchEvent(new Event(PLANNER_CHANGE_EVENT));
  } catch {
    // Storage remains authoritative when an event implementation is unavailable.
  }
}

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
  store.setItem(PLANNED_ACTIVITIES_KEY, JSON.stringify([...activities, valid]));
  dispatchPlannerChangeEvent();
  return true;
}

export function removePlannedActivity(
  id: string,
  store: PlannerStorage = window.localStorage,
): boolean {
  const activities = readPlannedActivities(store);
  const remaining = activities.filter((activity) => activity.id !== id);
  if (remaining.length === activities.length) return false;
  store.setItem(PLANNED_ACTIVITIES_KEY, JSON.stringify(remaining));
  dispatchPlannerChangeEvent();
  return true;
}
