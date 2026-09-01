import { z } from "zod";

export const openSpaceQuerySchema = z.object({
  category: z
    .enum([
      "playground",
      "wetland",
      "bushland",
      "nature",
      "park",
      "trail",
      "active_sport",
      "home",
    ])
    .optional(),
});
