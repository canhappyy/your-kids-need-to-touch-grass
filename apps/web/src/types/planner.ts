import type { MissionType } from "@/types/recommendation";

export type PlannerView = "month" | "week";

export type ImportantDateKind = "public-holiday" | "school-holiday";

export type ImportantDate = {
  id: string;
  dateKey: string;
  name: string;
  kind: ImportantDateKind;
  sourceUrl: string;
};

export type PlannedActivity = {
  id: string;
  missionId: string;
  name: string;
  plannedDate: string;
  createdAt: string;
  durationMinutes: number;
  missionType: MissionType;
  locationLabel: string;
  instructionText?: string | null;
  equipmentNeeded?: string | null;
};
