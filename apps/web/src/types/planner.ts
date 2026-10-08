import type { MissionType } from "@/types/recommendation";

/**
 * Calendar presentation mode selected by the user on the planner screen:
 * - `"month"`: Full monthly grid displaying all dates and planned activity dots.
 * - `"week"`: 7-day horizontal strip focusing on the current week's schedule.
 */
export type PlannerView = "month" | "week";

/**
 * Category classification for Victorian school and civic events:
 * - `"public-holiday"`: Official state or national public holidays (e.g. Australia Day, Melbourne Cup).
 * - `"school-holiday"`: Victorian term break holiday periods.
 */
export type ImportantDateKind = "public-holiday" | "school-holiday";

/**
 * Significant Victorian date displayed on the calendar to help parents coordinate active play around holidays.
 */
export type ImportantDate = {
  /** Unique identifier for the holiday or school break event. */
  id: string;
  /** ISO date key formatted as YYYY-MM-DD marking the date of the event. */
  dateKey: string;
  /** Human-readable event name (e.g. "Good Friday", "Term 1 School Holidays"). */
  name: string;
  /** Type of holiday event. */
  kind: ImportantDateKind;
  /** Official Victorian Government source URL for date verification. */
  sourceUrl: string;
};

/**
 * Activity mission scheduled by a parent for a specific calendar date in the future.
 */
export type PlannedActivity = {
  /** Unique client-side record identifier (UUID) generated when the activity is saved to the planner. */
  id: string;
  /** Activity database mission identifier (e.g. "MIS-042"). */
  missionId: string;
  /** Human-readable title of the planned activity. */
  name: string;
  /** Scheduled date string in YYYY-MM-DD format indicating when the family plans to complete this activity. */
  plannedDate: string;
  /** ISO 8601 timestamp string marking when the plan entry was created. */
  createdAt: string;
  /** Duration of the activity in minutes. */
  durationMinutes: number;
  /** Environmental classification indicating whether the activity is venue-based, at-home, or location-agnostic. */
  missionType: MissionType;
  /** Display label for the location (e.g. park venue name, or "At home"). */
  locationLabel: string;
  /** Optional step-by-step instructions for completing the activity. */
  instructionText?: string | null;
  /** Optional equipment or materials needed for the activity. */
  equipmentNeeded?: string | null;
  /** Optional SVG filename representing the activity's category icon. */
  iconFile?: string | null;
};
