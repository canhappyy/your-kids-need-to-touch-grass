import { z } from "zod";

export const postcodeParamsSchema = z.object({
  postcode: z.string().regex(/^\d{4}$/),
});

export const nearestPostcodeBodySchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  })
  .strict();
