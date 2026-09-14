/**
 * Record of a completed activity mission stored in local browser history.
 */
export type CompletedMission = {
  /** Unique client-side record identifier (UUID). */
  id: string;
  /** Activity database mission identifier (e.g. "MIS-001"). */
  missionId: string;
  /** Human-readable title of the completed activity. */
  name: string;
  /** ISO 8601 timestamp string indicating when the mission was marked complete. */
  completedAt: string;
  /** Activity duration in minutes (excludes walking commute). */
  durationMinutes: number;
};
