import { z } from "zod";



/**
 * Validates request payload for reverse geocoding to the nearest postcode (`POST /api/postcodes/nearest`).
 *
 * Validation rules:
 * 1. `latitude`:
 *    - Type: finite number between -90 and 90 (valid Earth latitude bounds).
 *
 * 2. `longitude`:
 *    - Type: finite number between -180 and 180 (valid Earth longitude bounds).
 *
 * 3. Strict schema:
 *    - `.strict()` disallows any extraneous properties in the request body.
 */
export const nearestPostcodeBodySchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  })
  .strict();
