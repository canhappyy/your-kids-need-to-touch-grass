import { findAllActivities } from "@/server/repositories/activity.repository";

export async function getAllActivities() {
  return findAllActivities();
}
