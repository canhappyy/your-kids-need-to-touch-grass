import {
  findAllActivities,
  findActivityById,
} from "@/server/repositories/activity.repository";

export async function getAllActivities() {
  return findAllActivities();
}

export async function getActivityById(missionId: string) {
  return findActivityById(missionId);
}
