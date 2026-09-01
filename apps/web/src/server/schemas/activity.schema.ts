import { z } from "zod";

export const activityParamsSchema = z.object({
  missionId: z.string().trim().min(1).max(50),
});
