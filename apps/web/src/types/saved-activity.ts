/**
 * Record of a saved activity mission in the user's backlog.
 */
export type SavedActivity = {
  /** Unique client-side record identifier (UUID). */
  id: string;
  /** Activity database mission identifier (e.g. "MIS-001"). */
  missionId: string;
  /** Human-readable title of the saved activity. */
  name: string;
  /** ISO 8601 timestamp string indicating when the activity was saved. */
  savedAt: string;
  /** Activity duration in minutes. */
  durationMinutes: number;
  /** Activity instructions text, or null. */
  instructionText?: string | null;
  /** Activity equipment needed text, or null. */
  equipmentNeeded?: string | null;
};
