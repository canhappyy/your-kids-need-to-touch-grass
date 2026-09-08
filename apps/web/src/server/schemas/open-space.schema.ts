import { z } from "zod";

/**
 * Validates query parameters for the open spaces listing endpoint (`GET /api/open-spaces`).
 *
 * Validation rules:
 * 1. `category` (optional):
 *    - Type: string enum.
 *    - Allowed values: `"playground"`, `"wetland"`, `"bushland"`, `"nature"`, `"park"`, `"trail"`, `"active_sport"`, `"home"`.
 *    - Behavior: when omitted, all open spaces are retrieved; when provided, results are filtered to that specific venue category.
 */
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
