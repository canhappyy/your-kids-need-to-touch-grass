import { z } from "zod";

/**
 * Validates route parameters for activity lookup endpoints (e.g. `/api/activities/[missionId]`).
 *
 * Validation rules:
 * 1. `missionId`:
 *    - Type: string.
 *    - Trimming: strips leading and trailing whitespace.
 *    - Length: must contain between 1 and 50 characters (rejects empty or overly long identifiers).
 */
export const activityParamsSchema = z.object({
  missionId: z.string().trim().min(1).max(50),
});
